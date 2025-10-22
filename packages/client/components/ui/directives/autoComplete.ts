import { Accessor, JSX, createSignal, onCleanup } from "solid-js";

import { Channel, Client, ServerMember, ServerRole, User } from "stoat.js";

import emojiMapping from "../emojiMapping.json";

import { registerFloatingElement, unregisterFloatingElement } from "./floating";

const EMOJI_KEYS = Object.keys(emojiMapping).sort();
const MAPPED_EMOJI_KEYS = EMOJI_KEYS.map((id) => ({ id, name: id }));

type Operator = "@" | ":" | "#" | "%";

export type AutoCompleteState =
  | {
      matched: "none";
    }
  | ({
      length: number;
    } & (
      | {
          matched: "emoji";
          matches: ((
            | {
                type: "unicode";
                codepoint: string;
              }
            | {
                type: "custom";
                id: string;
              }
          ) & { replacement: string; shortcode: string })[];
        }
      | {
          matched: "user";
          matches: {
            user: User | ServerMember;
            replacement: string;
          }[];
        }
      | {
          matched: "role";
          matches: {
            role: ServerRole;
            replacement: string;
          }[];
        }
      | {
          matched: "channel";
          matches: {
            channel: Channel;
            replacement: string;
          }[];
        }
    ));

/**
 * Configure auto complete for an input
 * @param element Input element
 * @param configuration Configuration
 */
export function autoComplete(
  element: HTMLInputElement,
  config: Accessor<JSX.Directives["autoComplete"]>,
) {
  if (!config()) return;

  const [state, setState] = createSignal<AutoCompleteState>({
    matched: "none",
  });

  const [selection, setSelection] = createSignal(0);

  /**
   * Select a given auto complete entry
   * @param index Entry
   */
  function select(index: number) {
    const realElement = element.shadowRoot
      ? element.shadowRoot.querySelector("input") ||
        element.shadowRoot.querySelector("textarea")
      : element;

    if (!realElement) return;

    const info = state() as AutoCompleteState & {
      matched: "emoji" | "user" | "member";
    };

    const currentPosition = realElement.selectionStart;
    if (!currentPosition) return;

    const match = info.matches[index];
    if (!match) return;

    const replacement = match.replacement;
    const originalValue = element.value;

    element.value =
      originalValue.slice(0, currentPosition - info.length) +
      replacement +
      " " +
      originalValue.slice(currentPosition);

    const newPosition = currentPosition - info.length + replacement.length + 1;
    element.setSelectionRange(newPosition, newPosition, "none");

    // Bubble up this change to the rest of the application,
    // we should do this directly through state in the future
    // but for now this will do.
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // TODO: use a virtual element on the caret
  // THIS IS NOT POSSIBLE WITH HTML INPUT ELEMENT!
  const accessor = () => ({
    autoComplete: {
      state,
      selection,
      setSelection,
      select,
    },
  });

  registerFloatingElement({
    element,
    config: accessor,
    show: () => (state().matched === "none" ? undefined : accessor()),
    hide: () => void 0,
  });

  /**
   * Intercept selection
   */
  function onKeyDown(
    event: KeyboardEvent & { currentTarget: HTMLTextAreaElement },
  ) {
    const current = state();
    if (current.matched !== "none") {
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        select(selection());
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelection((index) =>
          index === 0 ? current.matches.length - 1 : index - 1,
        );
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelection((index) => (index + 1) % current.matches.length);
        return;
      }
    }

    const value = config();
    if (typeof value === "object") {
      value.onKeyDown?.(event);
    }
  }

  /**
   * Update state as input changes
   */
  function onKeyUp(event: unknown) {
    if (event instanceof KeyboardEvent) {
      const current = state();
      if (current.matched !== "none") {
        if (["ArrowUp", "ArrowDown"].includes(event.key)) {
          return;
        }
      }
    }

    const realElement = element.shadowRoot
      ? element.shadowRoot.querySelector("input") ||
        element.shadowRoot.querySelector("textarea")
      : element;

    if (realElement) {
      const cursor = realElement.selectionStart;
      if (cursor && cursor === realElement.selectionEnd) {
        const content = realElement.value.slice(0, cursor);

        // Try to figure out what we're matching
        const current = (["@", ":", "#", "%"] as Operator[])
          // First find any applicable string
          .map((searchType) => {
            const index = content.lastIndexOf(searchType);
            return (
              index === -1
                ? undefined
                : [searchType, content.slice(index + 1).toLowerCase()]
            ) as [Operator, string];
          })
          // Filter by found strings
          .filter((match) => match)
          // Make sure there's no spaces nor other matching characters
          .filter(([, matchedString]) => /^[^\s@:#]*$/.test(matchedString))
          // Enforce minimum length for emoji and role matching
          .filter(([searchType, matchedString]) =>
            searchType === ":" || searchType === "%"
              ? matchedString.length > 0
              : true,
          )[0];

        if (current) {
          setSelection(0);
          setState(searchMatches(...current, config()));
          return;
        }
      }
    }

    if (state().matched !== "none")
      setState({
        matched: "none",
      });
  }

  /**
   * Hide if currently showing if input loses focus
   */
  function onBlur() {
    if (state().matched !== "none")
      setState({
        matched: "none",
      });
  }

  element.addEventListener("keydown", onKeyDown as never);
  element.addEventListener("keyup", onKeyUp);
  element.addEventListener("focus", onKeyUp);
  element.addEventListener("blur", onBlur);

  onCleanup(() => {
    unregisterFloatingElement(element);

    element.removeEventListener("keydown", onKeyDown as never);
    element.removeEventListener("keyup", onKeyUp);
    element.removeEventListener("focus", onKeyUp);
    element.removeEventListener("blur", onBlur);
  });
}

/**
 * Search for matches given operator and query
 */
function searchMatches(
  operator: Operator,
  query: string,
  config: JSX.Directives["autoComplete"],
): AutoCompleteState {
  if (operator === ":") {
    const matches: string[] = [];

    if (typeof config === "object" && config.client) {
      const searchSpace = [
        ...MAPPED_EMOJI_KEYS,
        ...config.client.emojis.toList(),
      ].sort((a, b) => a.name.localeCompare(b.name));

      let i = 0;
      while (matches.length < 10 && i < searchSpace.length) {
        if (searchSpace[i].name.includes(query)) {
          matches.push(searchSpace[i].id);
        }

        i++;
      }
    } else {
      let i = 0;
      while (matches.length < 10 && i < EMOJI_KEYS.length) {
        if (EMOJI_KEYS[i].includes(query)) {
          matches.push(EMOJI_KEYS[i]);
        }

        i++;
      }
    }

    if (!matches.length) {
      return {
        matched: "none",
      };
    }

    return {
      matched: "emoji",
      length: query.length + 1,
      matches: matches.map((id) =>
        id.length === 26
          ? {
              type: "custom",
              id,
              shortcode: (config as { client: Client }).client!.emojis.get(id)!
                .name,
              replacement: ":" + id + ":",
            }
          : {
              type: "unicode",
              shortcode: id,
              codepoint: emojiMapping[id as keyof typeof emojiMapping],
              replacement: emojiMapping[id as keyof typeof emojiMapping],
            },
      ),
    };
  }

  if (typeof config === "object" && config.client) {
    if (operator === "@") {
      const matches: (User | ServerMember)[] = [];
      const searchSpace = (
        config.searchSpace?.members ??
        config.searchSpace?.users ??
        config.client.users.toList()
      ).sort((a, b) => a.displayName!.localeCompare(b.displayName!));

      let i = 0;
      while (matches.length < 10 && i < searchSpace.length) {
        const user = searchSpace[i];
        if (
          user.displayName?.toLowerCase().includes(query) ||
          (user instanceof ServerMember &&
            user.user?.username.toLowerCase().includes(query))
        ) {
          matches.push(searchSpace[i]);
        }

        i++;
      }

      if (matches.length) {
        return {
          matched: "user",
          length: query.length + 1,
          matches: matches.map((user) => ({
            user,
            replacement: user.toString(),
          })),
        };
      }
    }

    if (operator === "%") {
      const matches: ServerRole[] = [];
      const searchSpace =
        config.searchSpace?.roles?.toSorted((a, b) =>
          a.name!.localeCompare(b.name!),
        ) ?? [];

      let i = 0;
      while (matches.length < 10 && i < searchSpace.length) {
        const role = searchSpace[i];
        if (role.name?.toLowerCase().includes(query)) {
          matches.push(searchSpace[i]);
        }

        i++;
      }

      if (matches.length) {
        return {
          matched: "role",
          length: query.length + 1,
          matches: matches.map((role) => ({
            role,
            replacement: role.toString(),
          })),
        };
      }
    }

    if (operator === "#") {
      const matches: Channel[] = [];
      const searchSpace = (
        config.searchSpace?.channels ?? config.client.channels.toList()
      )
        .filter((channel) => channel.name)
        .sort((a, b) => a.name!.localeCompare(b.name!));

      let i = 0;
      while (matches.length < 10 && i < searchSpace.length) {
        if (searchSpace[i].name!.toLowerCase().includes(query)) {
          matches.push(searchSpace[i]);
        }

        i++;
      }

      if (matches.length) {
        return {
          matched: "channel",
          length: query.length + 1,
          matches: matches.map((channel) => ({
            channel,
            replacement: channel.toString(),
          })),
        };
      }
    }
  }

  return {
    matched: "none",
  };
}
