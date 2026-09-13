import { dndzone } from "solid-dnd-directive";
import {
  Accessor,
  For,
  JSX,
  Setter,
  createEffect,
  createSignal,
} from "solid-js";

interface Props<T> {
  type?: string;
  items: Item<T>[];
  disabled?: boolean;
  dragHandles?: boolean;
  children: (item: {
    item: T;
    dragDisabled: Accessor<boolean>;
    setDragDisabled: Setter<boolean>;
  }) => JSX.Element;
  onChange: (ids: string[]) => void;
  minimumDropAreaHeight?: string;
}

type Item<T> = { id: string } & T;

/**
 * The dnd zone library requires you to have an id key
 */
interface ContainerItem<T> {
  id: string;
  item: T;
}

interface DragHandleEvent<T> {
  detail: {
    items: ContainerItem<T>[];
  };
  type: "consider" | "finalize";
}

/**
 * Typescript removes dndzone because it thinks that it is not being used.
 * This trick prevents that from happening.
 * https://github.com/solidjs/solid/issues/1005#issuecomment-1134778606
 */
void dndzone;

/**
 * Draggable list container
 */
export function Draggable<T>(props: Props<T>) {
  const [dragDisabled, setDragDisabled] = createSignal(
    // eslint-disable-next-line solid/reactivity
    props.dragHandles || false,
  );

  // start off with the items we were given; filling this in from the effect
  // below leaves the list empty for a frame, which loses the scroll position
  const [containerItems, setContainerItems] = createSignal<ContainerItem<T>[]>(
    // eslint-disable-next-line solid/reactivity
    props.items.map((item) => ({ id: item.id, item })),
  );

  createEffect(() => setDragDisabled(props.dragHandles || false));

  createEffect(() => {
    const newContainerItems = props.items.map((item) => ({
      id: item.id,
      item,
    }));

    setContainerItems(newContainerItems);
  });

  /**
   * Handle DND event from solid-dnd-directive
   * @param e
   */
  function handleDndEvent(e: DragHandleEvent<T>) {
    setDragDisabled(props.dragHandles || false);

    const { items: newContainerItems } = e.detail;
    setContainerItems(newContainerItems);

    if (e.type === "finalize") {
      props.onChange(
        newContainerItems.map((containerItems) => containerItems.id),
      );
    }
  }

  function isDisabled() {
    return props.disabled || dragDisabled();
  }

  return (
    <div
      use:dndzone={{
        type: props.type,
        items: containerItems,
        dragDisabled: isDisabled,
        flipDurationMs: 0,
        // transformDraggedElement: (el?: HTMLElement) => {
        //   if (el) {
        //     el.style.cursor = "grabbing !important";
        //     el.style.outline = "1px solid red";
        //   }
        // },
        dropTargetStyle: {
          outline:
            "2px solid color-mix(in srgb, 40% var(--md-sys-color-primary), transparent)",
          borderRadius: "4px",
          outlineOffset: "-2px",
          minHeight: "24px",
        },
      }}
      // @ts-expect-error missing jsx typing
      on:consider={handleDndEvent}
      on:finalize={handleDndEvent}
    >
      <For each={containerItems()}>
        {(containerItem) =>
          props.children({
            item: containerItem.item,
            dragDisabled,
            setDragDisabled,
          })
        }
      </For>
    </div>
  );
}

export function createDragHandle(
  dragDisabled: Accessor<boolean>,
  setDragDisabled: Setter<boolean>,
) {
  function startDrag(e: Event) {
    e.preventDefault();
    setDragDisabled(false);
  }

  function endDrag() {
    setDragDisabled(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.key === "Enter" || e.key === " ") && dragDisabled())
      setDragDisabled(false);
  }

  return {
    tabindex: dragDisabled() ? 0 : -1,
    onmouseenter: startDrag,
    ontouchstart: startDrag,
    onmouseleave: endDrag,
    onkeydown: handleKeyDown,
    "aria-label": "drag-handle",
  };
}
