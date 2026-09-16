import { For, JSX, onMount } from "solid-js";

import { styled } from "styled-system/jsx";

interface Props<T> {
  /**
   * Items to display with degrees
   */
  items: [T, number][];

  /**
   * Render each child
   * @param item Item
   * @returns Element
   */
  children: (item: T) => JSX.Element;

  /**
   * Animate the stack to closure
   */
  hideStack?: boolean;

  /**
   * Additional elements to display on the stack
   */
  overlay?: JSX.Element;
}

/**
 * Preview stack layout component
 */
export function PreviewStack<T>(props: Props<T>) {
  return (
    <Base hideStack={props.hideStack}>
      <For each={props.items}>
        {(item) => <StackElement item={item} children={props.children} />}
      </For>
      <Overlay>{props.overlay}</Overlay>
    </Base>
  );
}

/**
 * Individual layered element
 */
function StackElement<T>(props: {
  item: [T, number];
  children: (item: T) => JSX.Element;
}) {
  let ref: HTMLDivElement | undefined;

  onMount(() =>
    setTimeout(() => {
      if (ref) {
        ref.style.transform = `translate(-50%, -50%) rotate(${props.item[1]}deg) translate(0, -30px)`;
      }
    }),
  );

  return <Child ref={ref}>{props.children(props.item[0])}</Child>;
}

/**
 * Element centre positioning
 */
const Overlay = styled("div", {
  base: {
    top: "50%",
    left: "50%",
    position: "absolute",
    transform: "translate(-50%, -50%)",
  },
});

/**
 * Default transform used for children
 */
const DEFAULT_TRANSFORM = "translate(-50%, -50%) scale(0.001)";

/**
 * Dynamic child positioning
 */
const Child = styled(Overlay, {
  base: {
    opacity: 0.9,
    transform: DEFAULT_TRANSFORM,
    transition: "var(--transitions-fast) all",
  },
});

/**
 * Container element to provide position reference
 */
const Base = styled("div", {
  base: {
    position: "relative",
    margin: "auto",
    background: "gray",
  },
  variants: {
    hideStack: {
      true: {
        "& > svg": {
          transform: `${DEFAULT_TRANSFORM} !important`,
        },
      },
    },
  },
});
