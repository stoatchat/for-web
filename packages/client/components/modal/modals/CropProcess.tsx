import { type JSX, createSignal, Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import {
  type ImageCropperHandle,
  CropSizeError,
  Dialog,
  humanFileSize,
  ImageCropper,
} from "@revolt/ui";

export interface CropProcessOptions {
  ratio: number;
  ratioLabel: string;
  /** Defaults to true — the mode toggle is always shown, there's just no way to skip cropping entirely. */
  allowModeToggle?: boolean;
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
  ): JSX.Element => {
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);
    const [sizeError, setSizeError] = createSignal<CropSizeError | null>(null);
    let cropHandle: ImageCropperHandle | undefined;

    function cancel() {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    }

    async function confirm() {
      if (!cropHandle) return;
      try {
        const { file: cropped } = await cropHandle.crop();
        URL.revokeObjectURL(objectUrl);
        resolve([cropped]);
      } catch (e) {
        if (e instanceof CropSizeError) {
          // Keep the dialog open (don't resolve) so the user can shrink
          // the crop area and try again instead of starting the pick over.
          setSizeError(e);
          return;
        }
        throw e;
      }
    }

    return (
      <Dialog
        show
        onClose={cancel}
        title={options.dialogTitle ?? <Trans>Crop image</Trans>}
        minWidth={360}
        actions={[
          { text: <Trans>Cancel</Trans>, onClick: cancel },
          { text: <Trans>Crop</Trans>, onClick: () => confirm() },
        ]}
      >
        <ImageCropper
          src={objectUrl}
          sourceFile={file}
          maxSize={maxSize}
          ratio={options.ratio}
          ratioLabel={options.ratioLabel}
          allowModeToggle={options.allowModeToggle ?? true}
          ref={(h) => (cropHandle = h)}
        />
        <Show when={sizeError()}>
          {(e) => (
            <p
              style={{
                color: "var(--md-sys-color-error)",
                "font-size": "13px",
                "margin-top": "8px",
              }}
            >
              <Trans>
                Cropped image is too large — try a smaller crop area (max.{" "}
                {humanFileSize(e().maxSize)})
              </Trans>
            </p>
          )}
        </Show>
      </Dialog>
    );
  };
}
