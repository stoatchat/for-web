import type { ComponentProps } from "solid-js";

import "mdui/components/fab.js";

type Props = ComponentProps<"mdui-fab">;

/**
 * Floating action buttons help people take primary actions
 *
 * @library MDUI
 * @specification https://m3.material.io/components/floating-action-button
 */
export function Fab(props: Props) {
  return <mdui-fab {...props} />;
}
