import type { JSX } from "solid-js";
import { For, Show, createEffect, on, splitProps } from "solid-js";
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

  scrimBackground?: string;

  minWidth?: number;
  padding?: number;
};

/**
 * Dialogs provide important prompts in a user flow
 *
 * @specification https://m3.material.io/components/dialogs
 */
/**
 * Elements inside a dialog that can receive keyboard focus
 */
const FOCUSABLE_SELECTOR = [
  "mdui-text-field",
  "mdui-radio",
  "mdui-checkbox",
  "mdui-switch",
  "mdui-select",
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Fields that should receive focus first when a dialog opens
 */
const INITIAL_FIELD_SELECTOR = "mdui-text-field, input, textarea";

export function Dialog(props: Props) {
  let container: HTMLDivElement | undefined;

  /**
   * Collect the currently focusable elements within the dialog
   */
  function focusableElements() {
    if (!container) return [];

    return [
      ...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ].filter(
      (element) =>
        !element.hasAttribute("disabled") && element.offsetParent !== null,
    );
  }

  /**
   * Move focus into the dialog once it is shown.
   *
   * Text fields win over buttons so that a dialog asking for a name is
   * immediately typeable; dialogs without any field fall back to the container
   * itself, which keeps the focus trap below effective.
   */
  function focusInitialElement() {
    if (!container) return;

    const field = container.querySelector<HTMLElement>(INITIAL_FIELD_SELECTOR);
    (field ?? focusableElements()[0] ?? container).focus();
  }

  /**
   * Keep Tab navigation inside the dialog by wrapping around at both ends
   */
  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Tab" || !container) return;

    const focusable = focusableElements();
    if (!focusable.length) {
      // Nothing to cycle through, but focus must not escape either
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Wait a frame so the entrance animation has mounted the container and any
  // custom elements inside it have been upgraded before we focus them.
  createEffect(
    on(
      () => props.show,
      (show) => {
        if (show) requestAnimationFrame(focusInitialElement);
      },
    ),
  );

  return (
    <Portal mount={document.getElementById("floating")!}>
      <Dialog.Scrim
        show={props.show}
        onClick={props.onClose}
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
                ref={container}
                tabIndex={-1}
                style={{
                  "min-width": props.minWidth
                    ? `${props.minWidth}px`
                    : undefined,
                  padding: props.padding ? `${props.padding}px` : undefined,
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={onKeyDown}
              >
                <Show when={props.icon}>
                  <Icon>{props.icon}</Icon>
                </Show>
                <Show when={props.title}>
                  <Title withIcon={typeof props.icon !== "undefined"}>
                    {props.title}
                  </Title>
                </Show>
                <Content class={typography()}>{props.children}</Content>
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
  ]);

  return (
    <Scrim {...remote} class="dialog_scrim">
      <ScrimSurface {...local} />
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

const Content = styled("div", {
  base: {
    color: "var(--md-sys-color-on-surface-variant)",
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
