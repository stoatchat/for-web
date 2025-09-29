import { Accessor, JSXElement, Setter } from "solid-js";

import "mdui/components/navigation-rail-item.js";
import "mdui/components/navigation-rail.js";
import { cva } from "styled-system/css";

interface Props {
  children: JSXElement;
  contained: boolean;
  value: Accessor<string>;
  onValue: Setter<string>;
}

/**
 * Navigation rails let people switch between UI views on mid-sized devices
 *
 * @library MDUI
 * @specification https://m3.material.io/components/navigation-rail
 */
export function NavigationRail(props: Props) {
  return (
    <mdui-navigation-rail
      class={rail()}
      value={props.value()}
      onChange={(e: Event & { currentTarget: HTMLInputElement }) =>
        props.onValue(e.currentTarget.value)
      }
      contained={props.contained}
    >
      {props.children}
    </mdui-navigation-rail>
  );
}

const rail = cva({
  base: {
    background: "transparent",
    paddingBlock: "8px",
    width: "56px",
  },
});

const Icon = cva({
  base: {
    fill: "var(--md-sys-color-on-surface-variant)",
  },
});

interface ItemProps {
  value: string;
  icon: JSXElement;
  children: JSXElement;
}

/**
 * An item used in the navigation rail
 */
function NavigationRailItem(props: ItemProps) {
  return (
    <mdui-navigation-rail-item value={props.value}>
      {props.children}{" "}
      <div slot="icon" class={Icon()}>
        {props.icon}
      </div>
    </mdui-navigation-rail-item>
  );
}

NavigationRail.Item = NavigationRailItem;
