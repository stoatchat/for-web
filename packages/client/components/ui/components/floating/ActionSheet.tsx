import {
  type JSX,
  createContext,
  createEffect,
  createSignal,
  on,
  onCleanup,
  Show,
  useContext,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion } from "solid-motionone";

import { Symbol } from "@revolt/ui/components";
import { styled } from "styled-system/jsx";

interface SheetPage {
  /** function, so the title is created fresh instead of stealing the row's DOM node */
  title: () => JSX.Element;
  content: () => JSX.Element;
}

const ActionSheetContext = createContext<{ push: (page: SheetPage) => void }>();

/** Defined only when rendered inside a mobile action sheet */
export const useActionSheet = () => useContext(ActionSheetContext);

/**
 * Bottom sheet presentation for context menus on touch devices
 *
 * Unlike a desktop context menu (which is anchored to the pointer), an action
 * sheet slides up from the bottom of the screen and presents full-width rows
 * that are easy to tap.
 *
 * @specification https://m3.material.io/components/bottom-sheets
 */
export function ActionSheet(props: {
  onClose: () => void;
  children: JSX.Element;
}) {
  const [dragY, setDragY] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  const [pages, setPages] = createSignal<SheetPage[]>([]);
  const page = () => pages().at(-1);
  const push = (p: SheetPage) => setPages((s) => [...s, p]);
  const pop = () => setPages((s) => s.slice(0, -1));

  let startY = 0;
  let pointerId: number | undefined;

  /**
   * Fraction of the sheet height that must be dragged before dismissing
   */
  const DISMISS_THRESHOLD = 0.25;

  /**
   * Begin dragging the sheet from the grabber
   */
  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return;

    pointerId = e.pointerId;
    startY = e.clientY;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    e.stopImmediatePropagation();
  }

  /**
   * Track the drag distance, only allowing downward movement
   */
  function onPointerMove(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return;
    setDragY(Math.max(0, e.clientY - startY));
  }

  /**
   * Release the drag, dismissing the sheet if dragged far enough
   */
  function onPointerUp(e: PointerEvent) {
    if (!dragging() || e.pointerId !== pointerId) return;

    setDragging(false);
    pointerId = undefined;

    const handle = e.currentTarget as HTMLElement;
    if (handle.hasPointerCapture(e.pointerId)) {
      handle.releasePointerCapture(e.pointerId);
    }

    const sheetHeight = handle.parentElement!.getBoundingClientRect().height;

    if (dragY() > sheetHeight * DISMISS_THRESHOLD) {
      props.onClose();
    } else {
      setDragY(0);
    }
  }

  /** A cancelled gesture should never dismiss, just snap back */
  function onPointerCancel(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    setDragging(false);
    pointerId = undefined;
    setDragY(0);
  }

  onCleanup(() => setDragging(false));

  let stage: HTMLDivElement | undefined;
  let previousDepth = 0;

  createEffect(
    on(
      () => pages().length,
      (depth) => {
        const direction = depth > previousDepth ? 1 : -1;
        previousDepth = depth;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          return;

        stage?.animate(
          [
            { opacity: 0, transform: `translateX(${direction * 24}px)` },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 200, easing: "cubic-bezier(0.05, 0.7, 0.1, 1)" },
        );
      },
      { defer: true },
    ),
  );

  return (
    <Portal mount={document.getElementById("floating")!}>
      <Scrim
        onPointerDown={(e) => e.stopImmediatePropagation()}
        onClick={(e) => {
          e.stopPropagation();
          props.onClose();
        }}
      >
        <Motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ duration: 0.25, easing: [0.05, 0.7, 0.1, 1.0] }}
          style={{
            width: "100%",
            display: "flex",
            "justify-content": "center",
          }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              "justify-content": "center",
              transform: `translateY(${dragY()}px)`,
              transition: dragging() ? "none" : "transform 0.2s ease-out",
            }}
          >
            <Sheet
              class="action_sheet"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopImmediatePropagation()}
            >
              <Grabber
                aria-hidden="true"
                onClick={(e) => e.stopImmediatePropagation()}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerCancel}
              />
              <ActionSheetContext.Provider value={{ push }}>
                <div ref={stage}>
                  <div
                    data-page
                    style={{ display: page() ? "none" : "contents" }}
                  >
                    {props.children}
                  </div>

                  <Show when={page()}>
                    {(p) => (
                      <>
                        <BackRow
                          onClick={(e) => {
                            e.stopImmediatePropagation(); // don't hit the document click-dismiss
                            pop();
                          }}
                        >
                          <Symbol>arrow_back</Symbol>
                          <span>{p().title()}</span>
                        </BackRow>
                        <div>{p().content()}</div>
                      </>
                    )}
                  </Show>
                </div>
              </ActionSheetContext.Provider>
            </Sheet>
          </div>
        </Motion.div>
      </Scrim>
    </Portal>
  );
}

const Scrim = styled("div", {
  base: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "fixed",
    zIndex: "999",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",

    // keep the sheet clear of the home indicator and rounded display corners
    paddingInline: "max(var(--inset-left), 0px) max(var(--inset-right), 0px)",
    "--sheet-bottom":
      "max(var(--inset-bottom), env(keyboard-inset-height, 0px))",
    paddingBottom: "var(--sheet-bottom)",

    "--background": "rgba(0, 0, 0, 0.4)",
    animationName: "scrimFadeIn",
    animationDuration: "0.1s",
    animationFillMode: "forwards",
  },
});

const Sheet = styled("div", {
  base: {
    width: "100%",
    maxWidth: "560px",
    maxHeight:
      "min(80dvh, calc(100dvh - var(--inset-top) - var(--sheet-bottom) - 16px))",
    overflowY: "auto",
    overflowX: "hidden",
    overscrollBehavior: "contain",

    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-sm) 0 var(--gap-lg) 0",

    borderRadius: "var(--borderRadius-lg) var(--borderRadius-lg) 0 0",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    boxShadow: "0 -2px 8px var(--md-sys-color-shadow)",

    userSelect: "none",

    // The context menu renders its own surface; flatten it into the sheet
    "& [data-page] > div": {
      padding: 0,
      borderRadius: 0,
      background: "transparent",
      boxShadow: "none",
      overflow: "visible",
    },

    // Give every row in the sheet a comfortable touch target
    "& a": {
      padding: "var(--gap-lg) var(--gap-xl)",
    },
    "& a span:not([aria-hidden='true'])": {
      flexGrow: 1,
    },
  },
});

const Grabber = styled("div", {
  base: {
    // Enlarge the hit area beyond the visible 4px bar for a comfortable grab
    width: "56px",
    height: "24px",
    flexShrink: 0,
    alignSelf: "center",
    marginTop: "-6px",
    marginBottom: "calc(var(--gap-md) - 6px)",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",

    cursor: "grab",
    touchAction: "none",

    _active: {
      cursor: "grabbing",
    },

    "&::before": {
      content: '""',
      width: "32px",
      height: "4px",
      borderRadius: "var(--borderRadius-full)",
      background: "var(--md-sys-color-outline-variant)",
    },
  },
});

const BackRow = styled("a", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    cursor: "pointer",
    fontWeight: 500,
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    "&:active": {
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent)",
    },
  },
});
