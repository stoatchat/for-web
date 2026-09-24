import {
  JSX,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Titlebar } from "@revolt/app/interface/desktop/Titlebar";
import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
} from "@revolt/app/menus/ContextMenu";
import { useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { A, useLocation } from "@revolt/routing";
import { useState } from "@revolt/state";
import { IconButton, iconSize } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdDarkMode from "@material-design-icons/svg/filled/dark_mode.svg?component-solid";

import Wordmark from "../../../public/assets/web/wordmark.svg?component-solid";
import { AppUpsell } from "./AppUpsell";
import { BubbleMood, BubbleProvider, FlowBase, FlowBubble } from "./flows/Flow";

import Bluesky from "./flows/bluesky.svg?component-solid";
import GitHub from "./flows/github.svg?component-solid";

const Root = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    minHeight: 0,
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface)",
    overflowX: "hidden",
    overflowY: "auto",
  },
});

const Page = styled("main", {
  base: {
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "minmax(420px, 0.92fr) minmax(500px, 1.08fr)",
    gap: "clamp(18px, 3vw, 48px)",
    width: "100%",
    height: "100%",
    minHeight: "620px",
    padding: "clamp(18px, 2.5vw, 36px)",

    "@media (max-width: 980px)": {
      gridTemplateColumns: "minmax(320px, 0.78fr) minmax(440px, 1.22fr)",
      gap: "18px",
      padding: "18px",
    },

    "@media (max-width: 900px)": {
      display: "block",
      height: "auto",
      minHeight: "calc(100% - 32px)",
      padding: 0,
    },
  },
});

const Hero = styled("section", {
  base: {
    position: "relative",
    isolation: "isolate",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    overflow: "hidden",
    padding: "clamp(32px, 4vw, 62px)",
    color: "#fff",
    background:
      "linear-gradient(145deg, #33294b 0%, #262038 62%, #211b31 100%)",
    borderRadius: "clamp(28px, 3vw, 48px)",

    "@media (max-width: 980px)": {
      padding: "38px",
    },

    "@media (max-width: 900px)": {
      display: "none",
    },
  },
});

const Brand = styled("div", {
  base: {
    position: "relative",
    zIndex: 1,
    width: "132px",
    height: "auto",

    "& svg": {
      width: "100%",
      height: "auto",
      fill: "currentColor",
    },
  },
  variants: {
    mobile: {
      true: {
        display: "none",

        "@media (max-width: 900px)": {
          display: "block",
          width: "104px",
          color: "var(--md-sys-color-on-surface)",
        },

        "@media (max-width: 460px)": {
          width: "92px",
        },
      },
    },
  },
});

const Content = styled("section", {
  base: {
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    minWidth: 0,
    minHeight: 0,
    padding: "8px clamp(12px, 2.5vw, 42px) 4px",

    "@media (max-width: 980px)": {
      paddingInline: "20px",
    },

    "@media (max-width: 900px)": {
      minHeight: "calc(100vh - 32px)",
      padding: "20px clamp(20px, 6vw, 44px) 14px",
    },

    "@media (max-width: 460px)": {
      paddingInline: "20px",
    },
  },
});

const Topbar = styled("header", {
  base: {
    display: "flex",
    alignItems: "center",
    minHeight: "48px",
    justifyContent: "flex-end",

    "@media (max-width: 900px)": {
      justifyContent: "space-between",
    },
  },
});

const TopbarActions = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "14px",

    "@media (max-width: 460px)": {
      gap: "8px",
    },
  },
});

const AccountSwitch = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "0.875rem",
    whiteSpace: "nowrap",

    "& span": {
      color: "var(--md-sys-color-on-surface-variant)",
    },

    "& a": {
      padding: "10px 16px",
      color: "var(--md-sys-color-primary)",
      border: "1px solid var(--md-sys-color-outline-variant)",
      borderRadius: "999px",
      fontWeight: 650,
      textDecoration: "none",
      transition: "background 150ms ease, border-color 150ms ease",
    },

    "& a:hover": {
      background: "var(--md-sys-color-surface-container)",
      borderColor: "var(--md-sys-color-primary)",
    },

    "@media (max-width: 900px)": {
      "& span": {
        display: "none",
      },

      "& a": {
        padding: "8px 12px",
      },
    },

    "@media (max-width: 460px)": {
      "& a": {
        fontSize: "0.78rem",
      },
    },
  },
});

const FlowWrap = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
    overflowY: "auto",
    padding: "32px 0",

    "@media (max-width: 900px)": {
      padding: "42px 0",
    },
  },
});

const FlowStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    maxWidth: "440px",
    margin: "auto 0",
  },
});

const Footer = styled("footer", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: "42px",
    color: "var(--md-sys-color-on-surface-variant)",
    fontSize: "0.78rem",

    "& nav": {
      display: "flex",
      alignItems: "center",
      gap: "18px",
    },

    "& a": {
      color: "inherit",
      textDecoration: "none",
    },

    "& a:hover": {
      color: "var(--md-sys-color-primary)",
    },

    "@media (max-width: 460px)": {
      flexDirection: "column",
      gap: "14px",
      paddingTop: "12px",
    },
  },
});

const Socials = styled("nav", {
  base: {
    "& a": {
      display: "grid",
      height: "28px",
      placeItems: "center",
    },

    "& svg": {
      color: "inherit",
    },
  },
});

let hasMountedAuthFlow = false;

/**
 * How long after the last keystroke the bubble keeps showing typing
 */
const TYPING_IDLE_MS = 1000;

/**
 * How long the bubble shows an error before settling again
 */
const ERROR_FLASH_MS = 900;

/**
 * How long the bubble shows a success before settling again
 */
const SUCCESS_FLASH_MS = 1400;

/**
 * Shared layout for every logged-out account flow.
 */
export function AuthPage(props: { children: JSX.Element }) {
  const state = useState();
  const location = useLocation();
  const { lifecycle } = useClientLifecycle();
  const isCreate = () => location.pathname.includes("/login/create");

  const [typing, setTyping] = createSignal(false);
  const [pendingSubmits, setPendingSubmits] = createSignal(0);
  const [erroring, setErroring] = createSignal(false);
  const [succeeding, setSucceeding] = createSignal(false);
  const [errorCount, setErrorCount] = createSignal(0);
  let typingTimer: ReturnType<typeof setTimeout> | undefined;
  let errorTimer: ReturnType<typeof setTimeout> | undefined;
  let successTimer: ReturnType<typeof setTimeout> | undefined;

  onCleanup(() => {
    clearTimeout(typingTimer);
    clearTimeout(errorTimer);
    clearTimeout(successTimer);
  });

  // most important first: errors, waiting on the server, success, typing
  const bubbleMood = createMemo<BubbleMood>(() => {
    if (erroring()) return "error";
    if (pendingSubmits() > 0 || lifecycle.state() === State.LoggingIn)
      return "submitting";
    if (succeeding()) return "success";
    if (typing()) return "typing";
    return "idle";
  });

  const bubbleControls = {
    beginSubmit() {
      setPendingSubmits((count) => count + 1);

      let finished = false;
      return () => {
        if (finished) return;
        finished = true;
        setPendingSubmits((count) => count - 1);
      };
    },
    flashError() {
      clearTimeout(successTimer);
      setSucceeding(false);
      setErroring(true);
      setErrorCount((count) => count + 1);
      clearTimeout(errorTimer);
      errorTimer = setTimeout(() => setErroring(false), ERROR_FLASH_MS);
    },
    flashSuccess() {
      clearTimeout(errorTimer);
      setErroring(false);
      setSucceeding(true);
      clearTimeout(successTimer);
      successTimer = setTimeout(() => setSucceeding(false), SUCCESS_FLASH_MS);
    },
  };

  /**
   * Dev-only: keep typing for a couple of seconds
   */
  function debugType() {
    const smash = setInterval(onFlowInput, 150);
    setTimeout(() => clearInterval(smash), 2000);
  }

  /**
   * Dev-only: pretend the server takes a while to answer
   */
  function debugSubmit() {
    setTimeout(bubbleControls.beginSubmit(), 2500);
  }

  /**
   * Dev-only: play every mood back to back
   */
  function debugChaos() {
    onFlowInput();
    setTimeout(() => {
      const finish = bubbleControls.beginSubmit();
      setTimeout(() => {
        finish();
        bubbleControls.flashError();
        setTimeout(() => {
          const finishAgain = bubbleControls.beginSubmit();
          setTimeout(() => {
            finishAgain();
            bubbleControls.flashSuccess();
          }, 1500);
        }, 800);
      }, 1500);
    }, 900);
  }

  /**
   * Treat any input inside the current flow as typing
   */
  function onFlowInput() {
    setTyping(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => setTyping(false), TYPING_IDLE_MS);
  }
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let flowElement: HTMLDivElement | undefined;
  let bubbleElement: HTMLDivElement | undefined;
  let activeFlowAnimation: Animation | undefined;
  let activeBubbleAnimation: Animation | undefined;
  let bubbleTop: number | undefined;
  // until the first layout settles (e.g. web fonts swapping in), the bubble
  // snaps to its position instead of gliding into view
  let bubbleSettled = false;

  /**
   * Glide the shared bubble to its new position when the flow below it
   * changes height, starting from wherever it is currently drawn.
   */
  function followFlowHeight() {
    if (!bubbleElement) return;

    const nextTop = bubbleElement.offsetTop;
    const previousTop = bubbleTop;
    bubbleTop = nextTop;

    if (
      !bubbleSettled ||
      previousTop === undefined ||
      previousTop === nextTop ||
      reduceMotion
    )
      return;

    // offset of an in-flight glide, relative to the previous position
    const inFlight = new DOMMatrixReadOnly(
      getComputedStyle(bubbleElement).transform,
    ).m42;

    activeBubbleAnimation?.cancel();
    activeBubbleAnimation = bubbleElement.animate(
      [
        { transform: `translateY(${previousTop + inFlight - nextTop}px)` },
        { transform: "translateY(0)" },
      ],
      {
        duration: 140,
        easing: "cubic-bezier(0.2, 0, 0, 1)",
      },
    );
  }

  onMount(() => {
    followFlowHeight();

    const observer = new ResizeObserver(followFlowHeight);
    observer.observe(flowElement!);
    onCleanup(() => observer.disconnect());

    document.fonts.ready.then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          bubbleTop = bubbleElement?.offsetTop;
          bubbleSettled = true;
        }),
      ),
    );
  });

  createEffect(
    on(
      () => location.pathname,
      () => {
        const shouldAnimate = hasMountedAuthFlow;
        hasMountedAuthFlow = true;

        if (shouldAnimate && !reduceMotion) {
          requestAnimationFrame(() => {
            activeFlowAnimation?.cancel();
            activeFlowAnimation = flowElement?.animate(
              [
                {
                  opacity: 0,
                  transform: "translate3d(20px, 6px, 0)",
                },
                {
                  opacity: 1,
                  transform: "translate3d(0, 0, 0)",
                },
              ],
              {
                duration: 280,
                easing: "cubic-bezier(0.05, 0.7, 0.1, 1)",
              },
            );
          });
        }
      },
    ),
  );

  return (
    <Root>
      <Titlebar />
      <Page>
        <Hero>
          <Brand aria-hidden="true">
            <Wordmark />
          </Brand>
          <AppUpsell />
        </Hero>

        <Content>
          <Topbar>
            <Brand mobile>
              <Wordmark />
            </Brand>

            <TopbarActions>
              <AccountSwitch>
                <Show
                  when={isCreate()}
                  fallback={
                    <>
                      <span>
                        <Trans>New to Stoat?</Trans>
                      </span>
                      <A href="/login/create">
                        <Trans>Create account</Trans>
                      </A>
                    </>
                  }
                >
                  <span>
                    <Trans>Already have an account?</Trans>
                  </span>
                  <A href="/login/auth">
                    <Trans>Log in</Trans>
                  </A>
                </Show>
              </AccountSwitch>

              <IconButton
                variant="tonal"
                aria-label="Toggle color theme"
                onPress={() =>
                  state.theme.setMode(
                    state.theme.activeTheme.darkMode ? "light" : "dark",
                  )
                }
              >
                <MdDarkMode {...iconSize("20px")} />
              </IconButton>
            </TopbarActions>
          </Topbar>

          <FlowWrap>
            <FlowStack>
              <FlowBubble
                ref={bubbleElement}
                mood={bubbleMood()}
                errorCount={errorCount()}
                contextMenu={
                  import.meta.env.DEV
                    ? () => (
                        <ContextMenu>
                          <ContextMenuButton
                            icon={<Symbol size={16}>keyboard</Symbol>}
                            onClick={debugType}
                          >
                            Typing
                          </ContextMenuButton>
                          <ContextMenuButton
                            icon={<Symbol size={16}>hourglass_empty</Symbol>}
                            onClick={debugSubmit}
                          >
                            Submitting
                          </ContextMenuButton>
                          <ContextMenuButton
                            icon={<Symbol size={16}>error</Symbol>}
                            onClick={() => bubbleControls.flashError()}
                          >
                            Error
                          </ContextMenuButton>
                          <ContextMenuButton
                            icon={<Symbol size={16}>check_circle</Symbol>}
                            onClick={() => bubbleControls.flashSuccess()}
                          >
                            Success
                          </ContextMenuButton>
                          <ContextMenuDivider />
                          <ContextMenuButton
                            icon={<Symbol size={16}>play_arrow</Symbol>}
                            onClick={debugChaos}
                          >
                            Play all
                          </ContextMenuButton>
                        </ContextMenu>
                      )
                    : undefined
                }
              />
              <div
                ref={flowElement}
                style={{ width: "100%" }}
                onInput={onFlowInput}
              >
                <BubbleProvider value={bubbleControls}>
                  <FlowBase>{props.children}</FlowBase>
                </BubbleProvider>
              </div>
            </FlowStack>
          </FlowWrap>

          <Footer>
            <nav aria-label="Legal">
              <a href="https://stoat.chat/terms" target="_blank">
                <Trans>Terms</Trans>
              </a>
              <a href="https://stoat.chat/privacy" target="_blank">
                <Trans>Privacy</Trans>
              </a>
              <a href="https://support.stoat.chat/" target="_blank">
                <Trans>Help</Trans>
              </a>
            </nav>
            <Socials aria-label="Social links">
              <a
                href="https://github.com/stoatchat"
                target="_blank"
                aria-label="GitHub"
              >
                <GitHub width={20} height={20} />
              </a>
              <a
                href="https://bsky.app/profile/stoat.chat"
                target="_blank"
                aria-label="Bluesky"
              >
                <Bluesky width={20} height={20} />
              </a>
            </Socials>
          </Footer>
        </Content>
      </Page>
    </Root>
  );
}
