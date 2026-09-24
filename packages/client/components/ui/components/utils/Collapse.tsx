import "mdui/components/collapse";
import "mdui/components/collapse-item";
import type { CollapseItem as MduiCollapseItem } from "mdui/components/collapse-item";

import {
  createEffect,
  createSignal,
  JSX,
  on,
  onCleanup,
  splitProps,
} from "solid-js";

type Props = {
  children: JSX.Element;

  /** Specifies the currently oppened collapse item */
  value?: string | string[];
  /** Whether only one item should be active at a time */
  accordion?: boolean;
  disabled?: boolean;
};

/**
 * Collapse panels are used to group and hide complex content areas,
 * improving page organization.
 *
 * @see {https://www.mdui.org/en/docs/2/components/collapse}
 */
function Collapse(props: Props) {
  const [local, remote] = splitProps(props, ["children"]);

  return <mdui-collapse {...remote}>{local.children}</mdui-collapse>;
}

type ItemProps = {
  children: JSX.Element;

  /**
   * ID of the current item, used for toggling this item from
   * the @link{Collapse} component.
   */
  value?: string;
  disabled?: boolean;

  onOpen?: () => void;
  onClose?: () => void;
};

function CollapseItem(props: ItemProps) {
  const [local, remote] = splitProps(props, ["children", "onOpen", "onClose"]);
  const [ref, setRef] = createSignal<MduiCollapseItem>();

  createEffect(
    on(ref, (ref) => {
      console.log("Mounted");
      if (local.onOpen) {
        ref!.addEventListener("open", local.onOpen);
      }
      if (local.onClose) {
        ref!.addEventListener("close", local.onClose);
      }
    }),
  );

  onCleanup(() => {
    if (local.onOpen) {
      ref()!.removeEventListener("open", local.onOpen);
    }
    if (local.onClose) {
      ref()!.removeEventListener("close", local.onClose);
    }
  });

  return (
    <mdui-collapse-item ref={setRef} {...remote}>
      {local.children}
    </mdui-collapse-item>
  );
}

Collapse.Item = CollapseItem;

export { Collapse };
