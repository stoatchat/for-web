import {
  Accessor,
  Show,
  createEffect,
  createSignal,
  onCleanup,
} from "solid-js";

import { Plural, Trans } from "@lingui/solid/macro";
import { Motion, Presence } from "solid-motionone";
import { cva } from "styled-system/css";

import { typography } from "../../design";
import { Symbol } from "../../utils/Symbol";

type Side = "above" | "onScreen" | "below";

interface UnreadRow {
  element: HTMLElement;
  side: Side;
  mentions: number;
}

interface Callout {
  direction: "above" | "below";
  mentions: number;
}

function resolveElementSide(entry: IntersectionObserverEntry): Side {
  if (entry.isIntersecting || !entry.rootBounds) return "onScreen";

  return entry.boundingClientRect.bottom <= entry.rootBounds.top
    ? "above"
    : "below";
}

function selectRelevantRows(rows: UnreadRow[]) {
  const mentioned = rows.filter((row) => row.mentions);
  return mentioned.length ? mentioned : rows;
}

function calloutFor(rows: UnreadRow[]): Callout | undefined {
  const relevant = selectRelevantRows(rows);

  if (relevant.some((row) => row.side === "onScreen")) return;

  const above = relevant.filter((row) => row.side === "above");
  const below = relevant.filter((row) => row.side === "below");
  const offScreen = above.length ? above : below;

  if (!offScreen.length) return;

  return {
    direction: above.length ? "above" : "below",
    mentions: offScreen.reduce((total, row) => total + row.mentions, 0),
  };
}

function inDocumentOrder(row: UnreadRow, next: UnreadRow) {
  const position = row.element.compareDocumentPosition(next.element);
  return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

export function useUnreadCallout(list: Accessor<HTMLElement | undefined>) {
  const [callout, setCallout] = createSignal<Callout | undefined>(undefined, {
    equals: (previous, next) =>
      previous?.direction === next?.direction &&
      previous?.mentions === next?.mentions,
  });

  const sideByRow = new Map<HTMLElement, Side>();

  function unreadRows(): UnreadRow[] {
    return [...sideByRow].map(([element, side]) => ({
      element,
      side,
      mentions: Number(element.dataset.mentions ?? 0),
    }));
  }

  function refreshCallout() {
    setCallout(calloutFor(unreadRows()));
  }

  function scrollToUnread() {
    const current = callout();
    if (!current) return;

    const candidates = selectRelevantRows(unreadRows())
      .filter((row) => row.side === current.direction)
      .sort(inDocumentOrder);

    const nearest =
      current.direction === "above" ? candidates.at(-1) : candidates.at(0);

    nearest?.element.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  createEffect(() => {
    const element = list();
    if (!element) return;

    const sideObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          sideByRow.set(entry.target as HTMLElement, resolveElementSide(entry));
        }

        refreshCallout();
      },
      { root: element },
    );

    const trackUnreadRows = () => {
      const rows = new Set(
        element.querySelectorAll<HTMLElement>("[data-unread]"),
      );

      for (const row of sideByRow.keys()) {
        if (rows.has(row)) continue;

        sideObserver.unobserve(row);
        sideByRow.delete(row);
      }

      for (const row of rows) {
        if (sideByRow.has(row)) continue;

        sideByRow.set(row, "onScreen");
        sideObserver.observe(row);
      }

      refreshCallout();
    };

    trackUnreadRows();

    const rowObserver = new MutationObserver(trackUnreadRows);
    rowObserver.observe(element, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-unread", "data-mentions"],
    });

    onCleanup(() => {
      sideObserver.disconnect();
      rowObserver.disconnect();
      sideByRow.clear();
    });
  });

  return { callout, scrollToUnread };
}

export function UnreadCallout(props: {
  list: Accessor<HTMLElement | undefined>;
}) {
  const { callout, scrollToUnread } = useUnreadCallout(() => props.list());

  return (
    <Presence>
      <Show when={callout()}>
        {(current) => (
          <Motion.button
            class={calloutStyles({
              placement: current().direction === "above" ? "top" : "bottom",
              mentions: current().mentions > 0,
            })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={scrollToUnread}
          >
            <Symbol size={16}>
              {current().direction === "above" ? "expand_less" : "expand_more"}
            </Symbol>
            <Show
              when={current().mentions}
              fallback={<Trans>New unreads</Trans>}
            >
              {(mentions) => (
                <Plural
                  value={mentions()}
                  one="# new mention"
                  other="# new mentions"
                />
              )}
            </Show>
          </Motion.button>
        )}
      </Show>
    </Presence>
  );
}

const calloutStyles = cva({
  base: {
    position: "absolute",
    zIndex: 1,
    insetInline: 0,
    marginInline: "auto",
    width: "fit-content",

    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",

    paddingBlock: "var(--gap-sm)",
    paddingInline: "var(--gap-md)",
    borderRadius: "var(--borderRadius-full)",

    cursor: "pointer",
    userSelect: "none",
    backdropFilter: "var(--effects-blur-md)",

    ...typography.raw({ class: "label", size: "small" }),
  },
  variants: {
    placement: {
      top: {
        top: "var(--gap-sm)",
      },
      bottom: {
        bottom: "var(--gap-sm)",
      },
    },
    mentions: {
      true: {
        fill: "var(--md-sys-color-on-error)",
        color: "var(--md-sys-color-on-error)",
        background: "var(--md-sys-color-error)",
      },
      false: {
        fill: "var(--md-sys-color-on-primary)",
        color: "var(--md-sys-color-on-primary)",
        background: "var(--md-sys-color-primary)",
      },
    },
  },
});
