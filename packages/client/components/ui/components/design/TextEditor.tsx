import { useFloating } from "solid-floating-ui";
import {
  Accessor,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
} from "solid-js";
import { onCleanup } from "solid-js";
import { Portal } from "solid-js/web";

import { AutoSizer } from "@dschz/solid-auto-sizer";
import { autoUpdate, flip, shift } from "@floating-ui/dom";
import autocomplete, {
  ActionKind,
  closeAutocomplete,
} from "prosemirror-autocomplete";
import codemark from "prosemirror-codemark";
import codeMirrorBlockPlugin, {
  codeBlockKeymap,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
} from "prosemirror-codemirror-block";
import { baseKeymap, toggleMark } from "prosemirror-commands";
import { history, redo, undo } from "prosemirror-history";
import { InputRule, inputRules } from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { Node } from "prosemirror-model";
import { EditorState, EditorStateConfig, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Channel, ServerMember, ServerRole, User } from "stoat.js";
import { css, cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { CustomEmoji, UnicodeEmoji } from "@revolt/markdown/emoji";
import { unicodeEmojiUrl } from "@revolt/markdown/emoji/UnicodeEmoji";
import {
  blankModel,
  markdownFromProseMirrorModel,
  markdownToProseMirrorModel,
  schema,
} from "@revolt/markdown/prosemirror";
import { useState } from "@revolt/state";

import emojiMapping from "../../emojiMapping.json";
import { AutoCompleteSearchSpace } from "../utils/autoComplete";

import { Avatar } from "./Avatar";
import { typography } from "./Text";

const EMOJI_KEYS = Object.keys(emojiMapping).sort();
const MAPPED_EMOJI_KEYS = EMOJI_KEYS.map((id) => ({ id, name: id }));

interface Props {
  /**
   * Auto focus the input on creation
   */
  autoFocus?: boolean;

  /**
   * Placeholder to show when no text is shown
   */
  placeholder?: string;

  /**
   * Initial value to show in the text box
   */
  initialValue?: readonly [string];

  /**
   * Signal for sending a node replacement or focus request to the editor
   */
  nodeReplacement?: Node | readonly ["_focus"];

  /**
   * Event is fired when the text content changes
   * @param value Text value
   */
  onChange: (value: string) => void;

  /**
   * Event is fired when user submits (Enter) content
   */
  onComplete?: () => void;

  /**
   * Event is fired when any keys are input
   */
  onTyping?: () => void;

  /**
   * Event is fired when 'previous context' is requested
   * i.e. edit the last message (given current is empty)
   */
  onPreviousContext?: () => void;

  autoCompleteSearchSpace?: AutoCompleteSearchSpace;
}

interface AutoCompleteView {
  element: HTMLDivElement;
  // query: string;
  selected: number;
  result:
    | {
        type: "emoji";
        matches: MatchEmoji[];
      }
    | {
        type: "user";
        matches: MatchUser[];
      }
    | {
        type: "role";
        matches: ServerRole[];
      }
    | {
        type: "channel";
        matches: Channel[];
      };
}

type MatchEmoji =
  | {
      type: "unicode";
      codepoint: string;
      name: string;
    }
  | {
      type: "custom";
      id: string;
      name: string;
    };

type MatchUser = User | ServerMember;

/**
 * Rich text editor powered by ProseMirror
 *
 * Will fill the width of the parent, e.g. wrap the editor:
 * ```ts
 * <div class={css({ flexGrow: 1 })}>
 *   <TextEditor />
 * </div>
 * ```
 */
export function TextEditor(props: Props) {
  const applicationState = useState();

  const proseMirror = document.createElement("div");
  proseMirror.style.width = "0px"; // initial width

  // don't show the editor to start (messes with auto sizing)
  proseMirror.style.height = "0px";
  proseMirror.style.display = "none";

  const placeholder = document.createElement("span");
  proseMirror.prepend(placeholder);

  const [value, setValue] = createSignal(props.initialValue?.[0] ?? "");
  const [focused, setFocused] = createSignal(false);

  createEffect(() => (placeholder.innerText = props.placeholder ?? ""));

  createEffect(
    () => (placeholder.style.display = value().length ? "none" : "block"),
  );

  proseMirror.className = css({
    flexGrow: 1,
    alignItems: "center",

    cursor: "text",

    "& > .ProseMirror": {
      width: "100%",
      // todo: consider alternative, nicer looking indication that it's selected
      outline: "none",

      fontWeight: 400,
      fontSize: "var(--message-size)",
    },

    // copied from elements.ts:
    "& h1": {
      fontSize: "2em",
      fontWeight: 600,
    },
    "& h2": {
      fontSize: "1.6em",
      fontWeight: 600,
    },
    "& h3": {
      fontSize: "1.4em",
      fontWeight: 600,
    },
    "& h4": {
      fontSize: "1.2em",
      fontWeight: 600,
    },
    "& h5": {
      fontSize: "1em",
      fontWeight: 600,
    },
    "& h6": {
      fontSize: "0.8em",
      fontWeight: 600,
    },
    "& ul": {
      listStylePosition: "outside",
      paddingLeft: "1.5em",

      "& li": {
        listStyleType: "disc",
      },

      "& li li": {
        listStyleType: "circle",
      },
    },
    "& ol": {
      listStylePosition: "outside",
      paddingLeft: "1.5em",

      listStyleType: "decimal",
    },

    // anchors.ts
    "& a": {
      color: "var(--md-sys-color-primary) !important",
    },
  });

  placeholder.className = css({
    ...typography.raw({ class: "_messages" }),
    color: "var(--md-color-outline)",
    position: "absolute",
    whiteSpace: "nowrap",
    userSelect: "none",
    opacity: 0.5,
  });

  // initialise auto complete
  const client = useClient();
  const [autoComplete, setAutoComplete] = createSignal<AutoCompleteView>();

  // todo: (AC1.) define what items will be searched through
  const searchSpace = createMemo(() => {
    return {
      emoji: [MAPPED_EMOJI_KEYS, client().emojis.toList()].flat(),
      users:
        props.autoCompleteSearchSpace?.members ??
        props.autoCompleteSearchSpace?.users ??
        client().users.toList(),
      roles: props.autoCompleteSearchSpace?.roles ?? [],
      channels:
        props.autoCompleteSearchSpace?.channels ?? client().channels.toList(),
    };
  });

  // todo: (AC2.) define search mechanism for the new trigger
  function updateAutoComplete(trigger: string, query?: string) {
    query = query?.toLowerCase();

    if (query) {
      // find the autocomplete element
      const element = document.getElementsByClassName(
        "autocomplete",
      )[0] as HTMLDivElement;

      if (!element) return setAutoComplete(undefined);

      // perform query
      const space = searchSpace();
      let result: AutoCompleteView["result"] | null = null;
      switch (trigger) {
        case "emoji": {
          const matches: MatchEmoji[] = [];
          const emoji = space.emoji.sort((a, b) =>
            a.name.localeCompare(b.name),
          );

          for (let i = 0; i < emoji.length && matches.length < 10; i++) {
            const emote = emoji[i];
            if (emote.name.includes(query)) {
              const id = emote.id;
              matches.push(
                id.length === 26
                  ? {
                      type: "custom",
                      id,
                      name: emote.name,
                    }
                  : {
                      type: "unicode",
                      codepoint: emojiMapping[id as keyof typeof emojiMapping],
                      name: emote.name,
                    },
              );
            }
          }

          result = {
            type: "emoji",
            matches,
          };

          break;
        }
        case "user": {
          const matches: MatchUser[] = [];
          const users = space.users.sort((a, b) =>
            a.displayName!.localeCompare(b.displayName!),
          );

          let i = -1;
          while (matches.length < 10 && i + 1 < users.length) {
            const user = users[++i];
            if (
              user.displayName!.toLowerCase().includes(query) ||
              (user instanceof ServerMember &&
                user.user?.username.toLowerCase().includes(query))
            ) {
              matches.push(users[i]);
            }
          }

          result = {
            type: "user",
            matches,
          };

          break;
        }
        case "role": {
          const matches: ServerRole[] = [];
          const roles = space.roles.sort((a, b) =>
            a.name.localeCompare(b.name),
          );

          let i = -1;
          while (matches.length < 10 && i + 1 < roles.length) {
            const role = roles[++i];
            if (role.name.toLowerCase().includes(query)) {
              matches.push(roles[i]);
            }
          }

          result = {
            type: "role",
            matches,
          };

          break;
        }
        case "channel": {
          const matches: Channel[] = [];
          const channels = space.channels.sort((a, b) =>
            a.name.localeCompare(b.name),
          );

          let i = -1;
          while (matches.length < 10 && i + 1 < channels.length) {
            const role = channels[++i];
            if (role.name.toLowerCase().includes(query)) {
              matches.push(channels[i]);
            }
          }

          result = {
            type: "channel",
            matches,
          };

          break;
        }
      }

      if (result?.matches.length) {
        setAutoComplete((ac) => ({
          element,
          // query,
          result,

          // ensure selected is within range
          selected: ac?.selected ? ac.selected % result.matches.length : 0,
        }));

        return;
      }
    }

    setAutoComplete(undefined);
  }

  // eslint-disable-next-line solid/reactivity
  const autoCompletePlugin = props.autoCompleteSearchSpace
    ? // (AC3.) define the triggers
      autocomplete({
        triggers: [
          { name: "channel", trigger: "#" },
          { name: "user", trigger: "@" },
          { name: "role", trigger: "%" },
          { name: "emoji", trigger: ":" },
        ],
        reducer(action) {
          const name = action.type?.name;
          switch (action.kind) {
            case ActionKind.open:
              updateAutoComplete(name!, action.filter);
              return true;
            case ActionKind.close:
              updateAutoComplete(name!);
              return false;
            case ActionKind.up:
              setAutoComplete((ac) =>
                ac
                  ? {
                      ...ac,
                      selected:
                        (ac.selected - 1 + ac.result.matches.length) %
                        ac.result.matches.length,
                    }
                  : undefined,
              );
              return true;
            case ActionKind.down:
              setAutoComplete((ac) =>
                ac
                  ? {
                      ...ac,
                      selected: (ac.selected + 1) % ac.result.matches.length,
                    }
                  : undefined,
              );
              return true;
            case ActionKind.enter: {
              // (AC4.) define how to insert the new node
              const ac = autoComplete();
              switch (ac?.result?.type) {
                case "emoji": {
                  const match = ac.result.matches[ac.selected];

                  let tr = action.view.state.tr.deleteRange(
                    action.range.from,
                    action.range.to,
                  );

                  if (match.type == "unicode") {
                    tr = tr.insert(
                      action.range.from,
                      schema.nodes.rfm_unicode_emoji.createAndFill({
                        id: match.codepoint,
                        pack: applicationState.settings.getValue(
                          "appearance:unicode_emoji",
                        ),
                        src: unicodeEmojiUrl(
                          applicationState.settings.getValue(
                            "appearance:unicode_emoji",
                          ),
                          match.codepoint,
                        ),
                      })!,
                    );
                  } else {
                    tr = tr.insert(
                      action.range.from,
                      schema.nodes.rfm_custom_emoji.createAndFill({
                        id: match.id,
                        src: `https://cdn.revoltusercontent.com/emojis/${match.id}`,
                      })!,
                    );
                  }

                  action.view.dispatch(tr);

                  return true;
                }
                case "user": {
                  const match = ac.result.matches[ac.selected];

                  let tr = action.view.state.tr.deleteRange(
                    action.range.from,
                    action.range.to,
                  );

                  tr = tr.insert(
                    action.range.from,
                    schema.nodes.rfm_user_mention.createAndFill({
                      id:
                        match instanceof ServerMember
                          ? match.id.user
                          : match.id,
                      username: match.displayName,
                      avatar: match.animatedAvatarURL,
                    })!,
                  );

                  action.view.dispatch(tr);

                  return true;
                }
                case "role": {
                  const match = ac.result.matches[ac.selected];

                  let tr = action.view.state.tr.deleteRange(
                    action.range.from,
                    action.range.to,
                  );

                  tr = tr.insert(
                    action.range.from,
                    schema.nodes.rfm_role_mention.createAndFill({
                      id: match.id,
                      name: match.name,
                    })!,
                  );

                  action.view.dispatch(tr);

                  return true;
                }
                case "channel": {
                  const match = ac.result.matches[ac.selected];

                  let tr = action.view.state.tr.deleteRange(
                    action.range.from,
                    action.range.to,
                  );

                  tr = tr.insert(
                    action.range.from,
                    schema.nodes.rfm_channel_mention.createAndFill({
                      id: match.id,
                      name: match.name,
                    })!,
                  );

                  action.view.dispatch(tr);

                  return true;
                }
              }

              return false;
            }
            default:
              updateAutoComplete(name!, action.filter);
              return false;
          }
        },
      })
    : [];

  function selectAutoCompleteItem(selected: number) {
    setAutoComplete((ac) =>
      ac
        ? {
            ...ac,
            selected,
          }
        : undefined,
    );
  }

  function confirmAutoCompleteItem() {
    // send a fake Enter event to trigger the AC plugin handler
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    view.someProp("handleKeyDown", (f) => f(view, event));
  }

  // configure prosemirror
  const config: EditorStateConfig = {
    schema,
    plugins: [
      history(),
      keymap(codeBlockKeymap),
      keymap({
        "Shift-Enter": baseKeymap["Enter"],
        Space: () => {
          // typing a space should cancel autocomplete
          closeAutocomplete(view);

          return false;
        },
      }),
      ...codemark({
        markType: schema.marks.code,
      }),
      codeMirrorBlockPlugin({
        ...defaultSettings,
        languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
        undo,
        redo,
      }),
      inputRules({
        rules: [
          new InputRule(/^```$/, (state, match, start, end) => {
            return state.tr.replaceRangeWith(
              start,
              end,
              schema.nodes.code_block.createAndFill()!,
            );
          }),
          new InputRule(/^#{1,6}\s$/, (state, match, start, end) => {
            return state.tr.replaceRangeWith(
              start,
              end,
              schema.nodes.heading.createAndFill({
                level: match[0].length - 1,
              })!,
            );
          }),
          new InputRule(/^(?:-|\*)\s$/, (state, match, start, end) => {
            return state.tr.replaceRangeWith(
              start,
              end,
              schema.nodes.bullet_list.createAndFill(null, [
                schema.nodes.list_item.createAndFill(null)!,
              ])!,
            );
          }),
          new InputRule(/^(\d*)\.\s$/, (state, match, start, end) => {
            return state.tr.replaceRangeWith(
              start,
              end,
              schema.nodes.ordered_list.createAndFill(
                {
                  order: parseInt(match[1]),
                },
                [schema.nodes.list_item.createAndFill(null)!],
              )!,
            );
          }),
          new InputRule(
            /(?<![^\\]\\|^\\)(?:~{2})([^*]*)(?<![^\\]\\|^\\)(?:~{2})$/,
            (state, match, start, end) => {
              const [_, text] = match;
              if (!text.length) return null;

              if (
                state.doc.rangeHasMark(start, end, schema.marks.strikethrough)
              )
                return null;

              return state.tr
                .replaceRangeWith(
                  start,
                  end,
                  schema.text(text, [
                    schema.marks.strikethrough.create(),
                    ...activeMarks(state.doc, start, end),
                  ]),
                )
                .setStoredMarks([]);
            },
          ),
          new InputRule(
            /(?<![^\\]\\|^\\)(\*{1,2})([^*]*)(?<![^\\]\\|^\\)(\*{1,2})$/,
            (state, match, start, end) => {
              const [_, operatorBegin, text, operatorEnd] = match;
              if (!text.length) return null;

              if (operatorBegin.length === operatorEnd.length) {
                if (operatorBegin.length === 2) return null;

                if (state.doc.rangeHasMark(start, end, schema.marks.em))
                  return null;

                return state.tr
                  .replaceRangeWith(
                    start,
                    end,
                    schema.text(text, [
                      schema.marks.em.create(),
                      ...activeMarks(state.doc, start, end),
                    ]),
                  )
                  .setStoredMarks([]);
              }

              return null;
            },
          ),
          new InputRule(
            /(?<![^\\]\\|^\\)(\*{2})([^*]*)(?<![^\\]\\|^\\)(\*{2})$/,
            (state, match, start, end) => {
              const [_, operatorBegin, text, operatorEnd] = match;
              if (!text.length) return null;

              if (operatorBegin.length === operatorEnd.length) {
                if (state.doc.rangeHasMark(start, end, schema.marks.strong))
                  return null;

                return state.tr
                  .replaceRangeWith(
                    start,
                    end,
                    schema.text(text, [
                      schema.marks.strong.create(),
                      ...activeMarks(state.doc, start, end),
                    ]),
                  )
                  .setStoredMarks([]);
              }

              return null;
            },
          ),
        ],
      }),
      ...autoCompletePlugin,
      keymap({
        Enter: () => {
          // note: unsure if ProseMirror correctly handles
          //       event.isComposing, it is assumed that it does!

          if (props.onComplete) {
            props.onComplete();
            return true;
          }

          return false;
        },
        // todo
        "Ctrl-b": toggleMark(schema.marks.strong),
        "Ctrl-i": toggleMark(schema.marks.em),
        "Ctrl-s": toggleMark(schema.marks.strikethrough),
      }),
      keymap({ "Mod-z": undo, "Mod-y": redo }),
      keymap(baseKeymap),
    ],
  };

  const state = EditorState.create({
    ...config,
    doc: blankModel(), // populated by initialValue effect
    // doc: markdownToProseMirrorModel(props.initialValue?.[0] ?? "", client()),
  });

  const view = new EditorView(proseMirror, {
    state,
    dispatchTransaction(tr) {
      view.updateState(this.state.applyTransaction(tr).state);

      const value = markdownFromProseMirrorModel(view.state.doc);
      props.onChange?.(value);
      setValue(value);
    },
    handleDOMEvents: {
      focus: () => setFocused(true),
      blur: () => setFocused(false),
      keydown: (_, event) => {
        if (event.key === "ArrowUp" && !value().length)
          return props.onPreviousContext?.();

        if (event.key === "Enter" && !event.shiftKey && props.onComplete)
          return;

        props.onTyping?.();
      },
    },
    nodeViews: {},
  });

  createEffect(
    on(
      () => props.initialValue,
      (value) => {
        if (value) {
          view.updateState(
            EditorState.create({
              ...config,
              doc: value[0]
                ? markdownToProseMirrorModel(value[0], client())
                : blankModel(),
            }),
          );

          setValue(value[0]);
        }
      },
      // {
      //   defer: true,
      // },
    ),
  );

  createEffect(
    on(
      () => props.nodeReplacement,
      (value) => {
        if (value) {
          view.dom.focus();

          if (value instanceof Node) {
            view.updateState(
              view.state.applyTransaction(
                view.state.tr.replaceSelectionWith(value),
              ).state,
            );

            const text = markdownFromProseMirrorModel(view.state.doc);
            setValue(text);
            props.onChange(text);
          }
        }
      },
      {
        defer: true,
      },
    ),
  );

  function onClick() {
    if (!focused()) {
      view.dom.focus();
    }
  }

  proseMirror.addEventListener("click", onClick);

  onCleanup(() => proseMirror.removeEventListener("click", onClick));

  // auto focus on mount
  onMount(
    () =>
      props.autoFocus &&
      setTimeout(() => {
        view.dom.focus();

        // ensure the cursor is at the end
        view.updateState(
          view.state.apply(
            view.state.tr.setSelection(Selection.atEnd(view.state.doc)),
          ),
        );
      }, 0),
  );

  return (
    <>
      <AutoSizer initialWidth={0}>
        {(size) => {
          createEffect(() => {
            proseMirror.style.minWidth = "0";
            proseMirror.style.maxWidth = size.width + "px";
            proseMirror.style.width = "100%";
            proseMirror.style.height = "100%";
            proseMirror.style.display = "flex";
          });

          return proseMirror;
        }}
      </AutoSizer>
      <Portal mount={document.getElementById("floating")!}>
        <Show when={autoComplete()}>
          <Suggestions
            state={autoComplete}
            selectAutoCompleteItem={selectAutoCompleteItem}
            confirmAutoCompleteItem={confirmAutoCompleteItem}
          />
        </Show>
      </Portal>
    </>
  );
}

/**
 * Get a list of active marks in a range
 * @param doc Document
 * @param start Start of range
 * @param end End of range
 */
function activeMarks(doc: Node, start: number, end: number) {
  return Object.values(schema.marks)
    .filter((mark) => doc.rangeHasMark(start, end, mark))
    .map((mark) => mark.create());
}

/**
 * Component to render all of the auto complete suggestions
 *
 * (AC5.) include visual rendering for auto complete
 */
function Suggestions(props: {
  state: Accessor<AutoCompleteView | undefined>;
  selectAutoCompleteItem: (idx: number) => void;
  confirmAutoCompleteItem: () => void;
}) {
  const element = () => props.state()!.element;
  const [floating, setFloating] = createSignal<HTMLDivElement>();
  const state = useState();

  const position = useFloating(element, floating, {
    placement: "top-start",
    middleware: [flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  return (
    <div
      class={base()}
      ref={setFloating}
      style={{
        position: position.strategy,
        top: `${position.y ?? 0}px`,
        left: `${position.x ?? 0}px`,
        "z-index": "999",
      }}
    >
      <Switch>
        <Match when={props.state()!.result.type === "emoji"}>
          <For each={props.state()!.result.matches as MatchEmoji[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Switch
                  fallback={
                    <>
                      <UnicodeEmoji
                        emoji={(match as { codepoint: string }).codepoint}
                        pack={state.settings.getValue(
                          "appearance:unicode_emoji",
                        )}
                      />{" "}
                      <Name>:{match.name}:</Name>
                    </>
                  }
                >
                  <Match when={match.type === "custom"}>
                    <CustomEmoji id={(match as { id: string }).id} />{" "}
                    <Name>:{match.name}:</Name>
                  </Match>
                </Switch>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "user"}>
          <For each={props.state()!.result.matches as MatchUser[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Avatar src={match.animatedAvatarURL} size={24} />{" "}
                <Name>{match.displayName}</Name>
                {match instanceof ServerMember &&
                  match.displayName !== match.user?.username && (
                    <>
                      {" "}
                      @{match.user?.username}#{match.user?.discriminator}
                    </>
                  )}
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "role"}>
          <For each={props.state()!.result.matches as ServerRole[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Name>{match.name}</Name>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state()!.result.type === "channel"}>
          <For each={props.state()!.result.matches as Channel[]}>
            {(match, idx) => (
              <Entry
                selected={props.state()!.selected === idx()}
                onMouseEnter={() => props.selectAutoCompleteItem(idx())}
                onMouseDown={(e) => e.preventDefault()} // don't lose editor focus
                onClick={props.confirmAutoCompleteItem}
              >
                <Name>#{match.name}</Name>
              </Entry>
            )}
          </For>
        </Match>
      </Switch>
    </div>
  );
}

/**
 * Individual auto complete entry
 */
const Entry = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",

    cursor: "pointer",
    gap: "var(--gap-md)",
    background: "transparent",
    padding: "var(--gap-sm) var(--gap-md)",
  },
  variants: {
    selected: {
      true: {
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
      },
    },
  },
});

/**
 * Entry name
 */
const Name = styled("div", {
  base: {
    fontSize: "0.9em",
  },
});

/**
 * Auto complete container
 */
const base = cva({
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md) 0",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-xs)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",
  },
});
