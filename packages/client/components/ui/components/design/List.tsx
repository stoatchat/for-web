import { JSXElement } from "solid-js";

import "mdui/components/list-item.js";
import "mdui/components/list-subheader.js";
import "mdui/components/list.js";
import { cva } from "styled-system/css";

/**
 * Lists are continuous, vertical indexes of text and images
 *
 * @library MDUI
 * @specification https://m3.material.io/components/lists
 */
export function List(props: { children: JSXElement }) {
  return <mdui-list>{props.children}</mdui-list>;
}

/**
 * A subheader used in a list
 */
function ListSubheader(props: { children: JSXElement }) {
  return (
    <mdui-list-subheader class={subheader()}>
      {props.children}
    </mdui-list-subheader>
  );
}

List.Subheader = ListSubheader;

const subheader = cva({
  base: {
    paddingInline: "var(--space-200)",
  },
});

/**
 * An item that appears in a list
 */
function ListItem(props: {
  children: JSXElement;
  rounded?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return <mdui-list-item class={listitem()} {...props} />;
}

List.Item = ListItem;

const listitem = cva({
  base: {
    minHeight: 0,
  },
});
