import {
  Accessor,
  batch,
  createEffect,
  For,
  JSX,
  on,
  onCleanup,
  Show,
} from "solid-js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";
import { Column, Row } from "../layout";

export interface ListView2Update {
  /**
   * Element that we should anchor scroll position to
   */
  scrollAnchorId: string | null;

  /**
   * Callback to apply changes to DOM
   */
  commitToDOM(): void;
}

interface Props {
  /**
   * Handle when the top of the list is reached
   * @returns Update hints and callback
   */
  fetchTop(): Promise<ListView2Update | undefined>;

  /**
   * Handle when the bottom of the list is reached
   * @returns Update hints and callback
   */
  fetchBottom(): Promise<ListView2Update | undefined>;

  /**
   * Render the list itself
   */
  children: JSX.Element;

  /**
   * Whether we've reached the start of the list
   */
  atStart: Accessor<boolean>;

  /**
   * Whether we've reached the end of the list
   */
  atEnd: Accessor<boolean>;

  /**
   * Whether the skeletons should be listening
   */
  permitFetching: Accessor<boolean>;
}

/**
 * Dynamic list view with ability to move through history
 *
 * This component only provides the scrolling behaviour
 */
export function ListView2(props: Props) {
  let ref: HTMLDivElement | undefined;
  let contentRef: HTMLDivElement | undefined;

  let suppressSnap = false;
  let wasSnapped = true;
  let contentMutating = false;

  function isNewestMessageVisible() {
    if (!ref || !contentRef) return false;

    const messages = contentRef.querySelectorAll<HTMLElement>("[id]");
    const newest = messages[messages.length - 1];
    if (!newest) return false;

    const containerRect = ref.getBoundingClientRect();
    const msgRect = newest.getBoundingClientRect();

    return (
      msgRect.top < containerRect.bottom && msgRect.bottom > containerRect.top
    );
  }

  function consumeDOMUpdate(update?: ListView2Update) {
    if (!update) return;

    suppressSnap = true;

    const currentRect = update.scrollAnchorId
      ? document.getElementById(update.scrollAnchorId)?.getBoundingClientRect()
      : null;

    batch(() => {
      update.commitToDOM();
    });

    if (currentRect) {
      queueMicrotask(() => {
        const updatedRect = update.scrollAnchorId
          ? document
              .getElementById(update.scrollAnchorId)
              ?.getBoundingClientRect()
          : null;

        if (updatedRect) {
          ref?.scrollTo({
            top: ref.scrollTop + (updatedRect.top - currentRect.top),
          });
        }
        suppressSnap = false;
      });
    } else {
      suppressSnap = false;
    }
  }

  async function loadStart() {
    consumeDOMUpdate(await props.fetchTop());
  }

  async function loadEnd() {
    consumeDOMUpdate(await props.fetchBottom());
  }

  createEffect(() => {
    const el = ref;
    if (!el) return;

    const onScroll = () => {
      if (!suppressSnap && !contentMutating) {
        wasSnapped = isNewestMessageVisible();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    onCleanup(() => el.removeEventListener("scroll", onScroll));
  });

  createEffect(() => {
    const el = contentRef;
    if (!el) return;

    const mutationObserver = new MutationObserver(() => {
      contentMutating = true;
    });

    mutationObserver.observe(el, { childList: true, subtree: true });

    const resizeObserver = new ResizeObserver(() => {
      contentMutating = false;
      if (!suppressSnap && ref && wasSnapped && ref.scrollTop < 0) {
        ref.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    resizeObserver.observe(el);
    onCleanup(() => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    });
  });

  return (
    <div
      ref={ref}
      use:scrollable={{
        direction: "y",
        class: container({
          parent: true,
        }),
      }}
    >
      <div class={container()}>
        <div ref={contentRef}>
          <Show when={!props.atStart()}>
            <Skeleton
              align="end"
              onVisible={loadStart}
              containerRef={ref}
              permitFetching={props.permitFetching}
            />
          </Show>
          {props.children}
          <Show when={!props.atEnd()}>
            <Skeleton
              align="start"
              onVisible={loadEnd}
              containerRef={ref}
              permitFetching={props.permitFetching}
            />
          </Show>
        </div>
      </div>
    </div>
  );
}

function Skeleton(props: {
  onVisible(): void;
  containerRef: HTMLDivElement | undefined;
  permitFetching: Accessor<boolean>;
  align: "start" | "end";
}) {
  let ref: HTMLDivElement | undefined;

  function onEvent([entry]: IntersectionObserverEntry[]) {
    if (entry) {
      if (entry.isIntersecting) {
        props.onVisible();
      }
    }
  }

  createEffect(
    on(
      () => [ref, props.containerRef, props.permitFetching()] as const,
      ([ref, containerRef, permitFetching]) => {
        if (ref && containerRef && permitFetching) {
          const observer = new IntersectionObserver(onEvent, {
            root: containerRef,
          });

          observer.observe(ref);

          onCleanup(() => observer.disconnect());
        }
      },
    ),
  );

  return (
    <SkeletonBase ref={ref} align={props.align}>
      <For each={new Array(30).fill(0)}>
        {() => (
          <Column gap="none">
            <Row>
              <AvatarFrame>
                <Frame shape="avatar" />
              </AvatarFrame>
              <Column gap="sm">
                <Frame
                  shape="username"
                  style={{
                    width: `${Math.floor(Math.random() * 5 + 5)}em`,
                  }}
                />
                <For each={new Array(Math.ceil(Math.random() * 3)).fill(0)}>
                  {() => (
                    <Frame
                      shape="content"
                      style={{
                        width: `${Math.floor(Math.random() * 10 + 15)}em`,
                      }}
                    />
                  )}
                </For>
              </Column>
            </Row>
          </Column>
        )}
      </For>
    </SkeletonBase>
  );
}

const SkeletonBase = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--message-group-spacing)",

    height: "100rem",
    overflow: "hidden",
    pointerEvents: "none",
  },
  variants: {
    align: {
      start: {
        justifyContent: "start",
      },
      end: {
        justifyContent: "end",
      },
    },
  },
});

const AvatarFrame = styled("div", {
  base: {
    width: "52px",
    alignSelf: "start",

    display: "flex",
    justifyContent: "end",
    paddingInline: "var(--gap-sm)",
  },
});

const Frame = styled("div", {
  base: {
    background:
      "linear-gradient(90deg, var(--md-sys-color-surface-container-highest) 25%, var(--md-sys-color-surface-container-high) 50%, var(--md-sys-color-surface-container-highest) 75%)",
    backgroundSize: "200% 100%",
    backgroundAttachment: "fixed",
    animation: "skeletonShimmer 1.5s infinite",
  },
  variants: {
    shape: {
      avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "var(--borderRadius-full)",
      },
      username: {
        height: "0.8em",
        borderRadius: "var(--borderRadius-sm)",
      },
      content: {
        height: "var(--message-size)",
        marginTop: "var(--gap-sm)",
        borderRadius: "var(--borderRadius-sm)",
      },
    },
  },
});

const container = cva({
  base: {
    display: "flex",
    flexDirection: "column-reverse",
  },
  variants: {
    parent: {
      true: {
        height: "100%",
        flexGrow: 1,
      },
    },
  },
});
