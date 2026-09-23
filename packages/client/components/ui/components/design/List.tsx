import { JSXElement, Show, splitProps } from "solid-js";

import "mdui/components/list-item.js";
import "mdui/components/list-subheader.js";
import "mdui/components/list.js";
import { cva } from "styled-system/css";
import { Collapse } from "../utils";

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
    paddingInline: "var(--gap-lg)",
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

function CollapseListItem(props: {
  id?: string;
  children: JSXElement;
  header?: JSXElement;
  rounded?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const [local, remote] = splitProps(props, ["children", "header"]);

  return (
    <Collapse.Item value={props.id}>
      <Show when={local.header}>
        <mdui-list-item slot="header" {...remote}>
          {local.header}
        </mdui-list-item>
      </Show>
      {local.children}
    </Collapse.Item>
  );
}

List.Collapse = CollapseListItem;
