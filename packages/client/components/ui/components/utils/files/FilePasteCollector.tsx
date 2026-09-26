import { useModals } from "@revolt/modal";
import { onCleanup, onMount } from "solid-js";

interface Props {
  /**
   * Callback for pasted files
   * @param files List of files
   */
  onFiles: (files: File[]) => void;
}

/**
 * Utility for capturing pasted files
 */
export function FilePasteCollector(props: Props) {
  const { showError } = useModals();
  /**
   * Read clipboard items using the async clipboard API
   * See: @link{https://developer.chrome.com/blog/web-custom-formats-for-the-async-clipboard-api}
   */
  async function getFromClipboardFallback(): Promise<File[]> {
    const permissionStatus = await navigator.permissions.query({
      // @ts-expect-error - Why isn't this typed
      name: "clipboard-read",
      allowWithoutGesture: false,
    });

    if (permissionStatus.state === "denied")
      throw new Error("Failed to paste from clipboard: Permission denied.");

    const items = await navigator.clipboard.read();
    return (
      await Promise.all(
        items.map(async (item) => {
          const res = [];
          for (const type of item.types) {
            if (!type.startsWith("web ")) continue;
            const blob = await item.getType(type);

            // Ignore zero-size blobs
            if (blob.size === 0) continue;

            res.push(
              new File([blob], "file", {
                type: blob.type.replace("web ", ""),
              }),
            );
          }

          return res;
        }),
      )
    ).flat();
  }

  /**
   * Handle document paste event
   * @param event Event
   */
  async function onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    let files: File[] = [];
    if (typeof items === "undefined" || items.length === 0) {
      try {
        files = await getFromClipboardFallback();
      } catch (error) {
        showError(error);
        return;
      }
    } else {
      files = [...items]
        .filter((item) => !item.type.startsWith("text/"))
        .map((item) => item.getAsFile()!)
        .filter((item) => item);
    }

    if (files.length) {
      event.preventDefault();
      props.onFiles(files);
    }
  }

  onMount(() => document.addEventListener("paste", onPaste));
  onCleanup(() => document.removeEventListener("paste", onPaste));

  return <></>;
}
