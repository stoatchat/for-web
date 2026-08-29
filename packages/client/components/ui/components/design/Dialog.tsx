import type { JSX } from "solid-js";
import { For, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { styled } from "styled-system/jsx";

import { Button } from "./Button";
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

  /** Set to true if the dialog body has a scrollable. Do not set height on
   * the scrollable (use `minHeight` dialog prop), and ensure it is at
   * root-level of children or wrapped in a `<form>` only. */
  hasScroll?: boolean;

  scrimBackground?: string;
  minWidth?: number;
  minHeight?: number;
  padding?: number;
};

/**
 * Dialogs provide important prompts in a user flow
 *
 * @specification https://m3.material.io/components/dialogs
 */
export function Dialog(props: Props) {
  return (
    <Portal mount={document.getElementById("floating")!}>
      <Dialog.Scrim
        show={props.show}
        onClick={props.onClose}
        scroll={props.hasScroll}
        style={{
          "--diag-w":
            props.minWidth || props.hasScroll
              ? `${props.minWidth ?? 500}px`
              : undefined,
          "--diag-h":
            props.minHeight || props.hasScroll
              ? `${props.minHeight ?? 320}px`
              : undefined,
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
                  padding: props.padding ? `${props.padding}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Show when={props.icon}>
                  <Icon>{props.icon}</Icon>
                </Show>
                <Show when={props.title}>
                  <Title withIcon={typeof props.icon !== "undefined"}>
                    {props.title}
                  </Title>
                </Show>
                {props.children}
                <Show when={props.actions}>
                  <Actions>
                    <For each={props.actions}>
                      {(action) => (
                        <Button
                          variant="text"
                          size="small"
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
    "scroll",
  ]);

  return (
    <Scrim {...remote} class="dialog_scrim">
      <ScrimSurface {...local} class={typography()} />
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
    paddingBottom: "env(keyboard-inset-height)",

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
  },
  defaultVariants: {
    show: true,
    dark: false,
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
    color: "var(--md-sys-color-on-surface-variant)",

    "& > *": {
      minHeight: "var(--diag-h)",
    },
    "& form": {
      display: "contents",
    },
    "& form > *:not(:last-child)": {
      marginBottom: "var(--gap-md)",
    },
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
    scroll: {
      true: {
        alignItems: "stretch",
        "& > *": {
          display: "flex",
          alignItems: "center",
          width: "min(var(--diag-w), 100%)",
        },
        "& > * > *": {
          maxHeight: "100%",
          width: "100%",
        },
      },
      false: {
        "& > *": {
          minWidth: "var(--diag-w)",
        },
      },
    },
  },
  defaultVariants: {
    padding: true,
    overflow: true,
  },
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
});

const Icon = styled("div", {
  base: {
    alignSelf: "center",
    marginBottom: "16px",
    fill: "var(--md-sys-color-on-surface)",
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

const Actions = styled("div", {
  base: {
    gap: "8px",
    display: "flex",
    justifyContent: "end",
    marginBlockStart: "24px",
  },
});
