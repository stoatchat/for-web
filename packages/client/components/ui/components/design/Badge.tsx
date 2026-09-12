import { JSXElement } from "solid-js";

import "mdui/components/badge.js";
import { cva } from "styled-system/css";

interface Props {
  slot: string;
  children: JSXElement;
  variant: "small" | "large";
}

/**
 * Badges show notifications, counts, or status information on navigation items and icons
 *
 * @library MDUI
 * @specification https://m3.material.io/components/badges/overview
 */
export function Badge(props: Props) {
  return (
    <mdui-badge slot={props.slot ?? "badge"} class={badge()}>
      {props.children}
    </mdui-badge>
  );
}

const badge = cva({
  base: {
    padding: "var(--space-50)",
  },
});
