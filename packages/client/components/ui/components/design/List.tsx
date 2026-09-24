import { createSignal, JSXElement, Show, splitProps } from "solid-js";

import { Collapse, Symbol } from "@revolt/ui";
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
  nonclickable?: boolean;
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

const collapseList = cva({
  base: {
    "& [slot='end-icon']": {
      transition: "transform var(--transitions-fast)",
      "&.open": {
        transform: "rotate(180deg)",
      },
    },
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
  const [open, setOpen] = createSignal(false, { name: "open" });

  return (
    <Collapse.Item
      value={props.id}
      onOpen={() => {
        console.log("open");
        setOpen(true);
      }}
      onClose={() => {
        console.log("close");
        setOpen(false);
      }}
    >
      <Show when={local.header}>
        <mdui-list-item class={collapseList()} slot="header" {...remote}>
          {local.header}
          <div class={open() ? "open" : ""} slot="end-icon">
            <Symbol>arrow_drop_down</Symbol>
          </div>
        </mdui-list-item>
      </Show>
      {local.children}
    </Collapse.Item>
  );
}

List.Collapse = CollapseListItem;
