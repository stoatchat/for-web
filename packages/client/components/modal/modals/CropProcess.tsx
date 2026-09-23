import { type JSX, createSignal, onCleanup, Show } from "solid-js";

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
  ): JSX.Element => {
    const file = files[0];
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
        resolve([cropped]);
      } catch (e: unknown) {
        if (e instanceof CropSizeError) {
          // Keep the dialog open (don't resolve) so the user can shrink
          // the crop area and try again instead of starting the pick over.
          setSizeError(e);
          return;
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
        show
        onClose={() => resolve(null)}
        title={options.dialogTitle ?? <Trans>Crop image</Trans>}
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
              }
            },
          },
        ]}
      >
        <ImageCropper
          src={objectUrl}
          sourceFile={file}
          maxSize={maxSize}
          ratio={options.ratio}
          ratioLabel={options.ratioLabel}
          circularMask={options.circularMask}
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
        <Show when={hardError()}>
          {(e) => (
            <p
              style={{
                color: "var(--md-sys-color-error)",
                "font-size": "13px",
                "margin-top": "8px",
              }}
            >
              <Trans>An error occurred while processing the image: {e()}</Trans>
            </p>
          )}
        </Show>
      </Dialog>
    );
  };
}
