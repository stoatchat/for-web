import { useFloating } from "solid-floating-ui";
import {
  Component,
  ComponentProps,
  JSX,
  Show,
  createSignal,
  splitProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { autoUpdate, offset, shift } from "@floating-ui/dom";
import { styled } from "styled-system/jsx";

import { Text, iconSize, symbolSize } from "@revolt/ui";

import MdChevronRight from "@material-design-icons/svg/outlined/chevron_right.svg?component-solid";

const Base = styled("div", {
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

    userSelect: "none",
  },
});

export function ContextMenu(props: ComponentProps<typeof Base>) {
  return (
    <Base
      // prevent context menu closing itself before click event
      onpointerdown={(e) => e.stopImmediatePropagation()}
      {...props}
    />
  );
}

export const ContextMenuDivider = styled("div", {
  base: {
    height: "1px",
    margin: "var(--gap-sm) 0",
    background: "var(--md-sys-color-outline-variant)",
  },
});

export const ContextMenuItem = styled("a", {
  base: {
    display: "flex",
    gap: "var(--gap-md)",
    alignItems: "center",
    padding: "var(--gap-md) var(--gap-lg)",

    "&:hover": {
      background:
        "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
    },

    "& span": {
      flexGrow: 1,
    },
  },
  variants: {
    selected: {
      true: {
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
      },
      false: {},
    },
    action: {
      true: {
        cursor: "pointer",
      },
    },
    button: {
      true: {
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "var(--gap-md)",
        "& span": {
          marginTop: "1px",
        },
      },
    },
    _titleCase: {
      true: {},
      false: {},
    },
    destructive: {
      true: {
        fill: "var(--md-sys-color-error)",
        color: "var(--md-sys-color-error)",
      },
    },
  },
  defaultVariants: {
    _titleCase: true,
    selected: false,
  },
  compoundVariants: [
    {
      _titleCase: true,
      button: true,
      css: {
        textTransform: "capitalize",
      },
    },
  ],
});

type ButtonProps = ComponentProps<typeof ContextMenuItem> & {
  icon?: JSX.Element | Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  symbol?: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  destructive?: boolean;
  actionIcon?: JSX.Element | Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  actionSymbol?: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
};

export function ContextMenuButton(props: ButtonProps) {
  const [local, remote] = splitProps(props, [
    "icon",
    "symbol",
    "actionIcon",
    "actionSymbol",
    "children",
  ]);

  return (
    <ContextMenuItem button {...remote}>
      {typeof local.icon === "function"
        ? local.icon?.(iconSize(16))
        : local.icon}
      {local.symbol?.(symbolSize(16))}
      <Text>{local.children}</Text>
      {typeof local.actionIcon === "function"
        ? local.actionIcon?.(iconSize(20))
        : local.actionIcon}
      {local.actionSymbol?.(symbolSize(20))}
    </ContextMenuItem>
  );
}

export function ContextMenuSubMenu(
  props: Omit<
    ButtonProps,
    "ref" | "onClick" | "onMouseEnter" | "onMouseLeave"
  > & {
    buttonContent: JSX.Element;
    onClick?: () => void;
  },
) {
  const [anchor, setAnchor] = createSignal<HTMLDivElement>();
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const [show, setShow] = createSignal<"hide" | "show" | boolean>(false);
  const [local, buttonProps] = splitProps(props, [
    "children",
    "buttonContent",
    "onClick",
  ]);

  function isShowing() {
    return show() === true || show() === "show";
  }

  const position = useFloating(anchor, ref, {
    placement: "right-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), shift()],
  });

  return (
    <>
      <ContextMenuButton
        ref={setAnchor}
        selected={isShowing()}
        actionIcon={MdChevronRight}
        onpointerdown={(e) => {
          e.stopImmediatePropagation();
        }}
        onClick={(e) => {
          if (local.onClick) {
            local.onClick();
          } else {
            e.stopImmediatePropagation();
            setShow(isShowing() ? false : "show");
          }
        }}
        onMouseEnter={() => setShow((show) => (show === "hide" ? show : true))}
        {...buttonProps}
      >
        {local.buttonContent}
      </ContextMenuButton>
      <Portal mount={document.getElementById("floating")!}>
        <Presence>
          <Show when={isShowing()}>
            <Motion
              ref={setRef}
              style={{
                position: position.strategy,
                top: `${position.y ?? 0}px`,
                left: `${position.x ?? 0}px`,
                "z-index": 1000,
              }}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, easing: [0.87, 0, 0.13, 1] }}
              onMouseLeave={() =>
                setShow((show) => (show === true ? false : show))
              }
              // stop submenu from closing context menu
              onpointerdown={(e) => e.stopImmediatePropagation()}
            >
              <div
                onClick={(e) => {
                  if (local.onClick) {
                    local.onClick();
                  } else {
                    // prevent submenu trigger from closing context menu
                    e.stopImmediatePropagation();
                    setShow((show) => (show ? "hide" : true));
                  }
                }}
                // float a virtual element to ensure the mouseLeave event covers
                // both the anchor/button we attached to and the newly created context menu
                style={{
                  position: "fixed",
                  top: 0,
                  left: `-${(anchor()?.clientWidth ?? 0) + 5}px`,
                  width: `${(anchor()?.clientWidth ?? 0) + 5}px`,
                  height: `${anchor()?.clientHeight ?? 0}px`,
                  cursor: "pointer",
                }}
              />
              <ContextMenu>{local.children}</ContextMenu>
            </Motion>
          </Show>
        </Presence>
      </Portal>
    </>
  );
}
