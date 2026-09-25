import { type JSX, createSignal, onCleanup, Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import {
  type ImageCropperHandle,
  CropSizeError,
  Dialog,
  DialogProps,
  humanFileSize,
  ImageCropper,
} from "@revolt/ui";

import { isAnimatedWebP } from "@revolt/ui/components/utils/isAnimatedWebp";
import { Modals } from "../types";

export interface CropProcessOptions {
  ratio: number;
  ratioLabel: string;
  openModal: (props: Modals) => void;
  /** Defaults to true — the mode toggle is always shown, there's just no way to skip cropping entirely. */
  allowModeToggle?: boolean;
  circularMask?: boolean;
  dialogTitle?: JSX.Element;
}

/**
 * Produces a `process` callback for FileInput that crops the selected image to a given aspect ratio.
 *```tsx
 *   <Form2.FileInput
 *     control={editGroup.controls.avatar}
 *     maxSize={instance.limits().file_upload_size_limits["avatars"]}
 *     process={cropProcess({ ratio: 1, ratioLabel: "Square", allowModeToggle: false })}
 *   />
 *```
 */
export function cropProcess(options: CropProcessOptions) {
  return (
    files: File[],
    resolve: (files: File[] | null) => void,
    maxSize: number | undefined,
  ): void => {
    // Safeguard bad usage
    if (files.length === 0) {
      return;
    }
    const file = files[0];

    if (file && file.type === "image/gif") {
      resolve([file]);
      return;
    }

    if (file && file.type === "image/webp") {
      isAnimatedWebP(file)
        .then((animated) => {
          if (animated) {
            resolve([file]);
          } else {
            options.openModal({
              type: "crop",
              options,
              files,
              resolve,
              maxSize,
            });
          }
        })
        // If for some reason the animated webp check fails, just fall back to using the cropper modal.
        // This may cause bugs with a small subset of webp's, so future readers beware. Here be dragons.
        .catch(() =>
          options.openModal({ type: "crop", options, files, resolve, maxSize }),
        );
      return;
    }

    options.openModal({ type: "crop", options, files, resolve, maxSize });
  };
}

export function CropModal(props: DialogProps & Modals & { type: "crop" }) {
  const file = props.files[0];

  const objectUrl = URL.createObjectURL(file);
  const [sizeError, setSizeError] = createSignal<CropSizeError | null>(null);
  const [hardError, setHardError] = createSignal<string | null>(null);
  let cropHandle: ImageCropperHandle | undefined;

  onCleanup(() => {
    URL.revokeObjectURL(objectUrl);
  });

  async function confirm() {
    if (!cropHandle) return;
    try {
      const { file: cropped } = await cropHandle.crop();
      URL.revokeObjectURL(objectUrl);
      props.resolve([cropped]);
    } catch (e: unknown) {
      // Keep the dialog open (don't resolve) so the user can shrink
      // the crop area and try again instead of starting the pick over.
      if (e instanceof CropSizeError) {
        setSizeError(e);
      }
      if (e instanceof Error) {
        setHardError(e.message);
      } else {
        setHardError("An unknown error occurred");
      }
      throw e;
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={() => {
        props.resolve(null);
        props.onClose();
      }}
      title={props.options.dialogTitle ?? <Trans>Crop image</Trans>}
      minWidth={360}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Crop</Trans>,
          onClick: async () => {
            try {
              await confirm();
            } catch (e: unknown) {
              if (e instanceof Error) {
                setHardError(e.message);
              } else {
                setHardError("An unknown error occurred");
              }
              throw e;
            }
          },
        },
      ]}
    >
      <ImageCropper
        src={objectUrl}
        sourceFile={file}
        maxSize={props.maxSize}
        ratio={props.options.ratio}
        ratioLabel={props.options.ratioLabel}
        circularMask={props.options.circularMask}
        allowModeToggle={props.options.allowModeToggle ?? true}
        ref={(h) => (cropHandle = h)}
      />
      <Show when={sizeError()}>
        {(e) => (
          <p
            style={{
              color: "var(--md-sys-color-error)",
              "font-size": "13px",
              "margin-top": "8px",
              "max-width": cropHandle?.displaySize().w + "px",
            }}
          >
            <Trans>
              Cropped image is too large — try a smaller crop area (max.{" "}
              {humanFileSize(e().maxSize)})
            </Trans>
          </p>
        )}
      </Show>
      <Show when={hardError()}>
        {(e) => (
          <p
            style={{
              color: "var(--md-sys-color-error)",
              "font-size": "13px",
              "margin-top": "8px",
              "max-width": cropHandle?.displaySize().w + "px",
            }}
          >
            <Trans>An error occurred while processing the image: {e()}</Trans>
          </p>
        )}
      </Show>
    </Dialog>
  );
}
