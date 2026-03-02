import { useFloating } from "solid-floating-ui";
import {
  JSX,
  Show,
  children as accessChildren,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { autoUpdate, flip, offset, shift, size } from "@floating-ui/dom";
import { MenuItem } from "mdui/components/menu-item";
import { styled } from "styled-system/jsx";

type FloatingSelectProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  value?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: "filled" | "outlined";
  children: JSX.Element;
  onChange?: (
    event: Event & { currentTarget: HTMLElement; target: Element },
  ) => void;
};

/**
 * Custom Select component using floating-ui for proper positioning in modals
 *
 * This component solves the issue where MDUI's mdui-select uses position:fixed
 * which breaks when inside modals with CSS transforms.
 *
 * @see https://github.com/zdhxiong/mdui/issues/296
 */
export function FloatingSelect(props: FloatingSelectProps) {
  const [local, others] = splitProps(props, [
    "value",
    "label",
    "required",
    "disabled",
    "variant",
    "children",
    "onChange",
  ]);

  const [isOpen, setIsOpen] = createSignal(false);
  const [anchor, setAnchor] = createSignal<HTMLButtonElement>();
  const [dropdown, setDropdown] = createSignal<HTMLDivElement>();

  const childrenAccessor = accessChildren(() => local.children);

  const selectedText = () => {
    const items = childrenAccessor.toArray() as MenuItem[];
    const selected = items.find((item: MenuItem) => {
      return !!item.value && item.value === local.value;
    });
    return selected?.textContent || selected?.innerText || "";
  };

  const position = useFloating(anchor, dropdown, {
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(4),
      flip(),
      shift({ padding: 8 }),
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            minWidth: `${rects.reference.width}px`,
          });
        },
      }),
    ],
  });

  function handleClickOutside(e: MouseEvent) {
    if (!isOpen()) return;

    const target = e.target as Node;
    const anchorEl = anchor();
    const dropdownEl = dropdown();

    if (
      anchorEl &&
      !anchorEl.contains(target) &&
      dropdownEl &&
      !dropdownEl.contains(target)
    ) {
      setIsOpen(false);
    }
  }

  onMount(() => document.addEventListener("mousedown", handleClickOutside));
  onCleanup(() =>
    document.removeEventListener("mousedown", handleClickOutside),
  );

  function handleItemClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const menuItem: MenuItem | undefined =
      target.closest("mdui-menu-item") ??
      (event
        .composedPath()
        .find(
          (el) => el instanceof HTMLElement && el.tagName === "MDUI-MENU-ITEM",
        ) as MenuItem);

    if (menuItem) {
      const value = menuItem.getAttribute("value");
      if (value !== null && local.onChange) {
        // Create a synthetic event that matches the expected interface
        const syntheticEvent = {
          ...event,
          currentTarget: menuItem as HTMLElement,
          target: menuItem as Element,
        };
        local.onChange(
          syntheticEvent as Event & {
            currentTarget: HTMLElement;
            target: Element;
          },
        );
      }
      setIsOpen(false);
    }
  }

  return (
    <>
      <SelectTrigger
        ref={setAnchor}
        type="button"
        open={isOpen()}
        disabled={local.disabled}
        onClick={() => !local.disabled && setIsOpen(!isOpen())}
        {...others}
      >
        <SelectLabel floating={!!local.value || isOpen()}>
          {local.label}
          {local.required && " *"}
        </SelectLabel>
        <SelectValue>{selectedText()}</SelectValue>
        <ArrowIcon open={isOpen()} viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" />
        </ArrowIcon>
      </SelectTrigger>

      <Portal mount={document.getElementById("floating")!}>
        <Presence>
          <Show when={isOpen()}>
            <Motion
              ref={setDropdown}
              style={{
                position: position.strategy,
                top: `${position.y ?? 0}px`,
                left: `${position.x ?? 0}px`,
                "z-index": "1000",
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, easing: [0.87, 0, 0.13, 1] }}
            >
              <DropdownMenu onClick={handleItemClick}>
                {local.children}
              </DropdownMenu>
            </Motion>
          </Show>
        </Presence>
      </Portal>
    </>
  );
}

const SelectTrigger = styled("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: "56px",
    padding: "8px 16px",
    borderRadius: "4px 4px 0 0",
    border: "none",
    borderBottom: "1px solid var(--md-sys-color-outline)",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    position: "relative",
    textAlign: "left",
    fontSize: "16px",
    fontFamily: "inherit",
    transition: "border-color 0.2s",

    "&:hover": {
      borderBottomColor: "var(--md-sys-color-on-surface)",
    },

    "&:focus": {
      outline: "none",
      borderBottomColor: "var(--md-sys-color-primary)",
      borderBottomWidth: "2px",
    },
  },
  variants: {
    open: {
      true: {
        borderBottomColor: "var(--md-sys-color-primary)",
        borderBottomWidth: "2px",
      },
    },
    disabled: {
      true: {
        cursor: "not-allowed",
        opacity: 0.38,
      },
    },
  },
});

const SelectLabel = styled("label", {
  base: {
    position: "absolute",
    transition: "ease-in-out 0.2s",
    left: "16px",
    color: "var(--md-sys-color-on-surface-variant)",
    pointerEvents: "none",
    transformOrigin: "left top",
  },
  variants: {
    floating: {
      true: {
        top: "8px",
        fontSize: "12px",
        transform: "translateY(0)",
      },
      false: {
        top: "50%",
        fontSize: "16px",
        transform: "translateY(-50%)",
      },
    },
  },
});

const SelectValue = styled("span", {
  base: {
    flex: 1,
    paddingTop: "16px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const DropdownMenu = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "40vh",
    overflowY: "auto",
    scrollbarWidth: "none",
    borderRadius: "4px",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
    padding: "8px 0",

    "& mdui-menu-item": {
      cursor: "pointer",
      padding: "0px 1.5rem",
      transition: "background 0.2s",
      height: "3rem",

      "&:hover": {
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
      },
    },
  },
});

const ArrowIcon = styled("svg", {
  base: {
    width: "24px",
    height: "24px",
    fill: "var(--md-sys-color-on-surface-variant)",
    transition: "transform 0.2s",
  },
  variants: {
    open: {
      true: {
        transform: "rotate(180deg)",
      },
    },
  },
});
