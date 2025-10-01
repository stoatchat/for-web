import type { JSX } from "solid-js";
import { splitProps } from "solid-js";

import "mdui/components/chip.js";

// [TODO] Better type definition for chip props, use https://www.mdui.org/en/docs/2/components/chip#attributes as reference

type Props = Omit<
  JSX.HTMLAttributes<HTMLInputElement>,
  "onChange" | "onInput"
> & {
  variant: "assist" | "filter" | "input" | "suggestion";
  children: JSX.Element;
  elevated?: boolean;
  icon?: JSX.Element;
  iconSelected?: JSX.Element;
  iconEnd?: JSX.Element;
  disabled?: boolean;
  loading?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  value?: any;
};

/**
 * Chips are compact elements that represent an input, attribute, or action.
 *
 * @library MDUI
 * @specification https://m3.material.io/components/chips
 */
export function Chip(props: Props) {
  const [local, others] = splitProps(props, ["children"]);
  return <mdui-chip {...others}>{local.children}</mdui-chip>;
}
