import {
  BiSolidFile,
  BiSolidFileImage,
  BiSolidFileTxt,
  BiSolidVideoRecording,
} from "solid-icons/bi";
import {
  Match,
  Show,
  Switch,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion } from "solid-motionone";

import { Plural } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";

// import { typography } from "../../design";
import { PreviewStack } from "../PreviewStack";

interface Props {
  /**
   * Callback for dropped files
   * @param files List of files
   */
  onFiles: (files: File[]) => void;

  /**
   * Whether to allow dropping files while in a modal
   */
  allowInModal?: boolean;
}

/**
 * Stack container
 */
const Container = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    display: "grid",
    position: "fixed",
    placeItems: "center",
    pointerEvents: "none",

    // on dim background
    color: "white",
  },
});

/**
 * Dim the screen when dropping files
 */
const DimScreen = styled("div", {
  base: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    position: "fixed",
    background: "rgba(0, 0, 0, 0.8)",
  },
});

/**
 * File drop information
 */
const DropText = styled("div", {
  base: {
    marginTop: "48px",
    whiteSpace: "nowrap",

    // ...typography.raw({ class: "label" }),
  },
});

/**
 * Collect files that are dropped anywhere in the page
 */
export function FileDropAnywhereCollector(props: Props) {
  const { isOpen } = useModals();
  const [showIndicator, setShowIndicator] = createSignal(false, {
    name: "showIndicator",
  });
  const [items, setItems] = createSignal<DataTransferItem[]>([]);

  /**
   * Since we get events from the whole DOM tree, we want to
   * check if we get a dragOver event immediately after dragLeave,
   * if so: cancel the update to prevent updating preview.
   */
  let deferredHide: number | undefined;

  /**
   * Handle item drag event
   * @param event Drag event
   */
  function onDragOver(event: DragEvent) {
    if (isOpen()) return;

    event.preventDefault();
    clearTimeout(deferredHide);

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
      const files = [...event.dataTransfer.items].filter(
        (i) => i.kind === "file",
      );
      if (files.length === 0) return; // We only want files

      if (!showIndicator()) {
        setShowIndicator(true);
        setItems(files);
      }
    }
  }

  /**
   * Handle cancelled drag event
   */
  function onDragLeave() {
    // Make sure the timeout is properly cleaned up
    if (deferredHide) {
      clearTimeout(deferredHide);
      deferredHide = undefined;
    }

    deferredHide = setTimeout(() => {
      setShowIndicator(false);
      setItems([]);
      deferredHide = undefined;
    }, 300) as never;
  }

  /**
   * Handle item drop event
   * @param event Drag event
   */
  function onDrop(event: DragEvent) {
    event.preventDefault();

    const files = event.dataTransfer?.files;
    if (files) {
      props.onFiles([...files]);
    }

    setShowIndicator(false);
    setItems([]);
  }

  onMount(() => {
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragleave", onDragLeave);
    document.addEventListener("drop", onDrop);
  });

  onCleanup(() => {
    document.removeEventListener("dragover", onDragOver);
    document.removeEventListener("dragleave", onDragLeave);
    document.removeEventListener("drop", onDrop);
  });

  /**
   * Generate list of preview items
   */
  const previewItems = () =>
    items().map(
      (item, index) =>
        [
          item,
          index * (80 / items().length) -
            (items().length - 1) * (40 / items().length),
        ] as [DataTransferItem, number],
    );

  return (
    <Show when={showIndicator()}>
      <Portal>
        <DimScreen />
        <Container>
          <PreviewStack
            items={previewItems()}
            overlay={
              <DropText>
                <Motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plural
                    value={items().length}
                    one="Drop a file"
                    other="Drop # files"
                  />
                </Motion.div>
              </DropText>
            }
          >
            {(item) => (
              <Switch fallback={<BiSolidFile size={64} />}>
                <Match when={item.type.startsWith("text/")}>
                  <BiSolidFileTxt size={64} />
                </Match>
                <Match when={item.type.startsWith("image/")}>
                  <BiSolidFileImage size={64} />
                </Match>
                <Match when={item.type.startsWith("video/")}>
                  <BiSolidVideoRecording size={64} />
                </Match>
              </Switch>
            )}
          </PreviewStack>
        </Container>
      </Portal>
    </Show>
  );
}
