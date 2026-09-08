import { type IFormControl } from "solid-forms";
import { type JSX, createSignal, For, Show } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { css } from "styled-system/css";

import { useError } from "@revolt/i18n";

import { Dialog } from "@revolt/ui/components";
import { Text, typography } from "../design";
import { Column } from "../layout";
import { FileInput, humanFileSize } from "../utils/files";

import ImageCropper, { type ImageCropperHandle } from "./ImageCropper";

interface CropFileInputProps {
  control: IFormControl<string | File[] | null>;
  label?: string;
  maxSize?: number;
  hideErrors?: boolean;

  accept?: "image/*";
  imageAspect?: string;
  imageRounded?: boolean;
  imageJustify?: boolean;
  allowRemoval?: boolean;

  ratio: number;
  ratioLabel: string;
  /** Defaults to true — the mode toggle is always shown, there's just no way to skip cropping entirely. */
  allowModeToggle?: boolean;
  dialogTitle?: JSX.Element;
}

/**
 * Drop-in replacement for Form2.FileInput on image fields that must always
 * be cropped before they're accepted (avatar, banner, etc).
 *
 * Unlike a "watch control.value after the fact" approach, this intercepts
 * the raw pick at the FileInput's own onFiles callback and deliberately
 * does NOT write it into `control` yet. That means:
 *   - the picker's background preview never flashes the uncropped file
 *   - cancelling the crop dialog has nothing to undo — control.value was
 *     never touched, so it just reverts to whatever it already was
 *   - control.value only ever becomes File[] once, already cropped
 */
export function CropFileInput(props: CropFileInputProps) {
  const err = useError();
  const { t } = useLingui();

  const [pendingRaw, setPendingRaw] = createSignal<{
    file: File;
    objectUrl: string;
  } | null>(null);
  let cropHandle: ImageCropperHandle | undefined;

  function onFiles(files: File[] | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (props.maxSize && file.size > props.maxSize) {
      props.control.setErrors({
        error: new Error(
          t`File must be smaller than ${humanFileSize(props.maxSize)}`,
        ),
      });
      props.control.markTouched(true);
      return;
    }

    props.control.setErrors(null);
    setPendingRaw({ file, objectUrl: URL.createObjectURL(file) });
  }

  function cancel() {
    const p = pendingRaw();
    if (!p) return;
    URL.revokeObjectURL(p.objectUrl);
    setPendingRaw(null);
    cropHandle = undefined;
  }

  async function confirm() {
    const p = pendingRaw();
    if (!p || !cropHandle) return;
    const { blob } = await cropHandle.crop();
    const cropped = new File([blob], p.file.name, { type: blob.type });

    props.control.setValue(null);
    props.control.setValue([cropped]);
    props.control.markDirty(true);

    URL.revokeObjectURL(p.objectUrl);
    setPendingRaw(null);
    cropHandle = undefined;
  }

  return (
    <>
      <Show when={props.label}>
        <Text class="label">{props.label}</Text>
      </Show>
      <FileInput
        file={props.control.value}
        onFiles={onFiles}
        accept={props.accept}
        imageAspect={props.imageAspect}
        imageRounded={props.imageRounded}
        imageJustify={props.imageJustify}
        allowRemoval={props.allowRemoval}
        required={props.control.isRequired}
        disabled={props.control.isDisabled}
      />
      <Show when={props.maxSize}>
        <span class={typography({ class: "label", size: "small" })}>
          (max. {humanFileSize(props.maxSize!)})
        </span>
      </Show>
      <Show
        when={
          !props.hideErrors && props.control.isTouched && !props.control.isValid
        }
      >
        <Column gap="sm">
          <For each={Object.keys(props.control.errors!)}>
            {(errorMsg: string) => (
              <span
                class={css(typography.raw({ class: "label", size: "small" }), {
                  color: "var(--md-sys-color-error)",
                })}
              >
                {err(props.control.errors![errorMsg])}
              </span>
            )}
          </For>
        </Column>
      </Show>

      <Show when={pendingRaw()}>
        {(p) => (
          <Dialog
            show
            onClose={cancel}
            title={props.dialogTitle ?? <Trans>Crop image</Trans>}
            minWidth={360}
            actions={[
              { text: <Trans>Cancel</Trans>, onClick: cancel },
              { text: <Trans>Crop</Trans>, onClick: () => confirm() },
            ]}
          >
            <ImageCropper
              src={p().objectUrl}
              ratio={props.ratio}
              ratioLabel={props.ratioLabel}
              allowModeToggle={props.allowModeToggle ?? true}
              ref={(h) => (cropHandle = h)}
            />
          </Dialog>
        )}
      </Show>
    </>
  );
}
