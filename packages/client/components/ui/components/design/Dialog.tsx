import type { JSX } from "solid-js";
import { createUniqueId, For, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { styled } from "styled-system/jsx";

import { Layout, useDevice } from "@revolt/common";
import { Symbol } from "@revolt/ui";
import { cva } from "styled-system/css";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { typography } from "./Text";

export interface DialogProps {
  show: boolean;
  onClose: () => void;
}

export interface DialogAction {
  text: JSX.Element;
  onClick?: () => void | Promise<unknown> | true | false;
  isDisabled?: boolean;
}

type Props = DialogProps & {
  icon?: JSX.Element;
  title?: JSX.Element;
  children: JSX.Element;
  actions?: DialogAction[];
  isDisabled?: boolean;

  scrimBackground?: string;
  /**
   * Minimum breakpoint used to toggle fullscreen dialog.
   */
  fullscreen?: Layout;

  minWidth?: number;
  padding?: number;
};

/**
 * Dialogs provide important prompts in a user flow
 *
 * @specification https://m3.material.io/components/dialogs
 */
export function Dialog(props: Props) {
  const { layout } = useDevice();
  const shouldFullscreen = () =>
    props.fullscreen === "desktop"
      ? true
      : props.fullscreen === "tablet"
        ? layout() === "tablet" || layout() === "phone"
        : layout() === props.fullscreen;

  // used for labeledby
  const modalTitleId = createUniqueId();

  const hasCancel = () =>
    props.actions && props.actions.find((a) => a.onClick === undefined);

  return (
    <Portal mount={document.getElementById("floating")!}>
      <Dialog.Scrim
        show={props.show}
        onClick={props.onClose}
        padding={!shouldFullscreen()}
        fullscreen={shouldFullscreen()}
        style={{
          "--background": props.scrimBackground
            ? `url('${props.scrimBackground}'), rgba(0, 0, 0, 0.6)`
            : "rgba(0, 0, 0, 0.6)",
        }}
      >
        <Presence>
          <Show when={props.show}>
            <Motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, easing: [0.05, 0.7, 0.1, 1.0] }}
              class="dialog"
            >
              <Container
                style={{
                  "min-width": props.minWidth
                    ? `${props.minWidth}px`
                    : undefined,
                  padding: props.padding ? `${props.padding}px` : undefined,
                }}
                fullscreen={shouldFullscreen()}
                onClick={(e) => e.stopPropagation()}
              >
                <Show when={props.icon}>
                  <Icon>{props.icon}</Icon>
                </Show>
                <Show when={props.title}>
                  <Show
                    fallback={
                      <Title withIcon={typeof props.icon !== "undefined"}>
                        {props.title}
                      </Title>
                    }
                    when={shouldFullscreen()}
                  >
                    <div
                      role="region"
                      aria-labeledby={modalTitleId}
                      class={fsDialogHeader()}
                    >
                      <Show when={hasCancel()}>
                        <IconButton onPress={props.onClose}>
                          <Symbol>close</Symbol>
                        </IconButton>
                      </Show>
                      <h2
                        class={typography({ class: "headline", size: "small" })}
                        id={modalTitleId}
                      >
                        {props.title}
                      </h2>
                      <Show when={props.actions && shouldFullscreen()}>
                        <Actions fullscreen={shouldFullscreen()}>
                          <For each={props.actions}>
                            {(action) => (
                              <Show
                                when={
                                  !shouldFullscreen() ||
                                  (shouldFullscreen() && action.onClick)
                                }
                              >
                                <Button
                                  variant="text"
                                  size="sm"
                                  onPress={() => {
                                    if (action.isDisabled) return;

                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    const value = action.onClick?.() as any;
                                    if (value instanceof Promise) {
                                      value.then(props.onClose).catch(() => {});
                                    } else if (value !== false) {
                                      props.onClose();
                                    }
                                  }}
                                  isDisabled={
                                    action.isDisabled || props.isDisabled
                                  }
                                >
                                  {action.text}
                                </Button>
                              </Show>
                            )}
                          </For>
                        </Actions>
                      </Show>
                    </div>
                  </Show>
                </Show>
                <Content class={typography()} fullscreen={shouldFullscreen()}>
                  {props.children}
                </Content>
                <Show when={props.actions && !shouldFullscreen()}>
                  <Actions fullscreen={shouldFullscreen()}>
                    <For each={props.actions}>
                      {(action) => (
                        <Button
                          variant="text"
                          size="sm"
                          onPress={() => {
                            if (action.isDisabled) return;

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const value = action.onClick?.() as any;
                            if (value instanceof Promise) {
                              value.then(props.onClose).catch(() => {});
                            } else if (value !== false) {
                              props.onClose();
                            }
                          }}
                          isDisabled={action.isDisabled || props.isDisabled}
                        >
                          {action.text}
                        </Button>
                      )}
                    </For>
                  </Actions>
                </Show>
              </Container>
            </Motion.div>
          </Show>
        </Presence>
      </Dialog.Scrim>
    </Portal>
  );
}

/**
 * Full-screen scrim shown below dialogs
 *
 * @specification https://m3.material.io/components/dialogs
 */
Dialog.Scrim = (
  props: Omit<
    Parameters<typeof Scrim>[0] & Parameters<typeof ScrimSurface>[0],
    "class"
  >,
) => {
  const [local, remote] = splitProps(props, [
    "children",
    "padding",
    "overflow",
  ]);

  return (
    <Scrim {...remote} class="dialog_scrim">
      <ScrimSurface fullscreen={remote.fullscreen} {...local} />
    </Scrim>
  );
};

const Scrim = styled("div", {
  base: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "fixed",
    zIndex: "998",
    maxHeight: "100%",
    paddingTop: "var(--inset-top)",
    paddingInline: "var(--inset-left) var(--inset-right)",
    paddingBottom: "max(var(--inset-bottom), env(keyboard-inset-height, 0px))",

    animationName: "scrimFadeIn",
    animationDuration: "0.1s",
    animationFillMode: "forwards",
    transition: "var(--transitions-medium) all",
  },
  variants: {
    show: {
      false: {
        animationName: "unset",
        pointerEvents: "none",
        background: "transparent",
      },
    },
    dark: {
      true: {
        "--background": "rgba(0, 0, 0, 0.9)",
      },
      false: {
        "--background": "rgba(0, 0, 0, 0.6)",
      },
    },
    fullscreen: {
      true: {
        paddingTop: "0",
        paddingInline: "0",
        paddingBottom: "0",
      },
    },
  },
  defaultVariants: {
    show: true,
    dark: false,
    fullscreen: false,
  },
});

const ScrimSurface = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    display: "grid",
    userSelect: "none",
    placeItems: "center",
    pointerEvents: "all",
  },
  variants: {
    padding: {
      true: {
        padding: "80px",
        _phone: { padding: "30px" },
      },
    },
    overflow: {
      true: {
        overflowY: "auto",
      },
    },
    fullscreen: {
      true: {
        display: "block",
      },
    },
  },
  defaultVariants: {
    padding: true,
    overflow: true,
    fullscreen: false,
  },
  compoundVariants: [
    {
      fullscreen: true,
      overflow: true,
      css: {
        overflowX: "clip",
        overflowY: "clip",
      },
    },
  ],
});

const Container = styled("div", {
  base: {
    padding: "24px",
    minWidth: "280px",
    maxWidth: "560px",
    borderRadius: "28px",

    display: "flex",
    flexDirection: "column",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
  },
  variants: {
    fullscreen: {
      true: {
        width: "100vw",
        height: "100dvh",
        maxWidth: "none",
        borderRadius: "none",
        overflow: "hidden",
        padding: "0px",
      },
      false: {},
    },
  },
  defaultVariants: {
    fullscreen: false,
  },
});

const Icon = styled("div", {
  base: {
    alignSelf: "center",
    marginBottom: "16px",
    fill: "var(--md-sys-color-on-surface)",
  },
});

const fsDialogHeader = cva({
  base: {
    height: "3.5rem",
    marginLeft: "1rem",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    flexShrink: 0,
  },
});

const Title = styled("span", {
  base: {
    ...typography.raw({ class: "headline", size: "small" }),
    marginBlockEnd: "16px",
  },
  variants: {
    withIcon: {
      true: {
        textAlign: "center",
      },
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

const Content = styled("div", {
  base: {
    color: "var(--md-sys-color-on-surface-variant)",
    flex: 1,
    overflowY: "auto",
  },
  variants: {
    fullscreen: {
      true: {
        marginTop: "1.5rem",
        marginInline: "1.5rem",
      },
    },
  },
  defaultVariants: {
    fullscreen: false,
  },
});

const Actions = styled("div", {
  base: {
    gap: "8px",
    display: "flex",
    justifyContent: "end",
    marginBlockStart: "24px",
  },

  variants: {
    fullscreen: {
      true: {
        marginInlineStart: "auto",
        marginBlockStart: "unset",
      },
    },
  },

  defaultVariants: {
    fullscreen: false,
  },
});
