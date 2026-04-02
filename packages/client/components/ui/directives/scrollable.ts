import { type Accessor, type JSX, onCleanup } from "solid-js";

import { cva } from "styled-system/css";

export const scrollableStyles = cva({
  base: {
    willChange: "transform",
    scrollbarColor: "var(--md-sys-color-primary) transparent",
  },
  variants: {
    direction: {
      x: {
        overflowX: "auto",
        overflowY: "hidden",
      },
      y: {
        overflowY: "auto",
        overflowX: "hidden",
      },
    },
    showOnHover: {
      true: {
        overflow: "hidden !important",
        // Do NOT set scrollbarGutter: "stable" here — it reserves space for
        // the scrollbar track even when content doesn't overflow, causing
        // scrollbar carets to appear on hover with no content to scroll.
        // The hover handlers below apply overflow: scroll only when needed.
      },
    },
  },
  defaultVariants: {
    direction: "y",
    showOnHover: false,
  },
});

const hoverStyles = cva({
  variants: {
    direction: {
      x: {
        overflowX: "scroll !important",
        overflowY: "hidden !important",
      },
      y: {
        overflowY: "scroll !important",
        overflowX: "hidden !important",
      },
    },
  },
  defaultVariants: {
    direction: "y",
  },
});

/**
 * Add styles and events for a scrollable container
 * @param el Element
 * @param accessor Parameters
 */
export function scrollable(
  el: HTMLDivElement,
  accessor: Accessor<JSX.Directives["scrollable"] & object>,
) {
  const props = accessor();
  if (!props) return;

  if (props.offsetTop) {
    el.style.paddingTop = props.offsetTop + "px";
  }

  el.classList.add(
    ...scrollableStyles({
      direction: props.direction,
      showOnHover: props.showOnHover,
    }).split(" "),
  );

  if (props.class) {
    props.class.split(" ").forEach((cls) => el.classList.add(cls));
  }

  if (props.showOnHover) {
    const showClass = hoverStyles({ direction: props.direction }).split(" ");

    /**
     * Handle mouse entry — only show scrollbar if content actually overflows.
     * This prevents scrollbar carets from appearing when there's nothing to scroll.
     */
    const onMouseEnter = () => {
      const isOverflowing =
        props.direction === "x"
          ? el.scrollWidth > el.clientWidth
          : el.scrollHeight > el.clientHeight;
      if (isOverflowing) {
        el.classList.add(...showClass);
      }
    };

    /**
     * Handle mouse leave
     */
    const onMouseLeave = () => {
      el.classList.remove(...showClass);
    };

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);

    onCleanup(() => {
      el.removeEventListener("mouseenter", onMouseEnter);
      el.removeEventListener("mouseleave", onMouseLeave);
    });
  }
}
