import { type IFormControl, IFormGroup } from "solid-forms";
import {
  ComponentProps,
  For,
  type JSX,
  Match,
  Show,
  Switch,
  splitProps,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import {
  Button,
  Checkbox,
  Radio2,
  Text,
  TextEditor,
  TextField,
} from "../design";
import { TextEditor2 } from "../features/texteditor/TextEditor2";

import { FileInput } from "./files";

/**
 * Form wrapper for TextField
 */
const FormTextField = (
  props: {
    control: IFormControl<string>;
  } & ComponentProps<typeof TextField>,
) => {
  const [local, remote] = splitProps(props, ["control"]);

  return (
    <>
      <TextField
        {...remote}
        value={local.control.value}
        oninput={(e) => {
          local.control.setValue(e.currentTarget.value);
        }}
        onchange={() => local.control.markDirty(true)}
        required={local.control.isRequired}
        disabled={local.control.isDisabled}
      />

      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </>
  );
};

/**
 * Form wrapper for TextEditor
 *
 * You must manage the lifecycle of the `initialValue`
 */
const FormTextEditor = (
  props: {
    control: IFormControl<string>;
  } & Omit<ComponentProps<typeof TextEditor>, "onChange">,
) => {
  const [local, remote] = splitProps(props, ["control"]);

  return (
    <EditorBox>
      <TextEditor2
        {...remote}
        onChange={(value) => {
          local.control.setValue(value);
          local.control.markDirty(true);
        }}
        // todo: required={local.control.isRequired}
        // todo: disabled={local.control.isDisabled}
      />

      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </EditorBox>
  );
};

const EditorBox = styled("div", {
  base: {
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface-container)",
    borderRadius: "var(--borderRadius-sm)",
    padding: "var(--gap-md)",
  },
});

/**
 * Form wrapper for TextField.Select
 */
FormTextField.Select = (
  props: {
    control: IFormControl<string>;
  } & ComponentProps<typeof TextField.Select>,
) => {
  const [local, remote] = splitProps(props, ["control"]);

  return (
    <>
      <TextField.Select
        {...remote}
        value={local.control.value}
        onChange={(e) => {
          local.control.setValue(e.currentTarget.value);
          local.control.markDirty(true);
        }}
        required={local.control.isRequired}
        disabled={local.control.isDisabled}
      />

      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </>
  );
};

/**
 * Form wrapper for, single file, FileInput
 */
const FormFileInput = (
  props: {
    label?: string;
    control: IFormControl<File[] | string | null>;
  } & Pick<
    ComponentProps<typeof FileInput>,
    "accept" | "imageAspect" | "imageRounded" | "imageJustify" | "allowRemoval"
  >,
) => {
  const [local, remote] = splitProps(props, ["label", "control"]);

  return (
    <>
      <Show when={local.label}>
        <Text class="label">{local.label}</Text>
      </Show>
      <FileInput
        {...remote}
        file={local.control.value}
        onFiles={(files) => {
          // TODO: do validation of files here

          local.control.setValue(files);
          local.control.markDirty(true);
        }}
        required={local.control.isRequired}
        disabled={local.control.isDisabled}
      />
      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </>
  );
};

/**
 * Form wrapper for Checkbox
 */
const FormCheckbox = (
  props: {
    control: IFormControl<boolean>;
  } & ComponentProps<typeof Checkbox>,
) => {
  const [local, remote] = splitProps(props, ["control"]);

  return (
    <>
      <Checkbox
        {...remote}
        checked={local.control.value}
        onChange={(event) => {
          local.control.setValue(event.currentTarget.checked);
          local.control.markDirty(true);
        }}
        required={local.control.isRequired}
        disabled={local.control.isDisabled}
      />

      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </>
  );
};

/**
 * Form wrapper for Radio2
 */
const FormRadio = (
  props: {
    control: IFormControl<string>;
  } & ComponentProps<typeof Radio2>,
) => {
  const [local, remote] = splitProps(props, ["control"]);

  return (
    <>
      <Radio2
        {...remote}
        value={local.control.value}
        onChange={(event) => {
          local.control.setValue(event.currentTarget.value);
          local.control.markDirty(true);
        }}
        required={local.control.isRequired}
        disabled={local.control.isDisabled}
      />

      <Show when={local.control.isTouched && !local.control.isValid}>
        <For each={Object.keys(local.control.errors!)}>
          {(errorMsg: string) => <small>{errorMsg}</small>}
        </For>
      </Show>
    </>
  );
};

/**
 * Form element for virtual selection
 */
function FormVirtualSelect<K, T>(props: {
  control: IFormControl<K[]>;
  items: { item: T; value: K }[];
  children: (item: T, selected?: boolean) => JSX.Element;
  itemHeight?: number;
  selectHeight?: string;
  multiple?: boolean;
}) {
  let ref;

  return (
    <div
      ref={ref}
      use:scrollable
      style={{
        height: props.selectHeight ?? "320px",
      }}
    >
      <VirtualContainer
        items={props.items}
        scrollTarget={ref}
        itemSize={{ height: props.itemHeight ?? 40 }}
      >
        {(item) => (
          <div
            style={{
              ...item.style,
              width: "100%",
            }}
            onClick={() => {
              if (!props.multiple) {
                props.control.setValue(
                  props.control.value[0] === item.item.value
                    ? []
                    : [item.item.value],
                );
              }
            }}
          >
            <Switch
              fallback={props.children(
                item.item.item,
                props.control.value.includes(item.item.value),
              )}
            >
              <Match when={props.multiple}>
                <Checkbox
                  class={css({ width: "100%" })}
                  onChange={(checked) =>
                    props.control.setValue([
                      ...props.control.value.filter(
                        (entry) => entry !== item.item.value,
                      ),
                      ...(checked ? [item.item.value] : []),
                    ])
                  }
                  checked={props.control.value.includes(item.item.value)}
                >
                  {props.children(item.item.item)}
                </Checkbox>
              </Match>
            </Switch>
          </div>
        )}
      </VirtualContainer>
    </div>
  );
}

/**
 * Form reset button
 */
const FormResetButton = (props: {
  group: IFormGroup;
  onReset: () => void;
  children?: JSX.Element;
}) => {
  return (
    <Button
      variant="text"
      onPress={() => {
        resetGeneric(props.group, true);
        props.onReset();
      }}
      isDisabled={!props.group.isDirty}
    >
      {props.children ?? <Trans>Reset</Trans>}
    </Button>
  );
};

/**
 * Form submission button
 */
const FormSubmitButton = (props: {
  group: IFormGroup;
  children: JSX.Element;
  requireDirty?: boolean;
}) => {
  return (
    <Button
      type="submit"
      isDisabled={
        !canSubmit(props.group) || !props.requireDirty || !props.group.isDirty
      }
    >
      {props.children}
    </Button>
  );
};

/**
 * Compute whether we can submit this group
 * @param group Group
 * @returns Whether we can submit
 */
function canSubmit(group: IFormGroup) {
  if (group.isDisabled || group.isPending || !group.isValid) return false;

  for (const control in group.controls) {
    const element = group.controls[control];
    if (element.isRequired) {
      const value = element.value;

      if (Array.isArray(value) && value.length === 0) {
        return false;
      } else if (!value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generic 'reset' of form group
 * @param group Form Group
 * @param includingFields Whether to also reset fields
 */
function resetGeneric(group: IFormGroup, includingFields: boolean) {
  if (includingFields) {
    for (const control of Object.values(group.controls)) {
      control.markDirty(false);
      control.markTouched(false);
    }
  }

  group.markPending(false);
  group.markSubmitted(true);
}

/**
 * Create a new submission handler
 * @param group Form Group
 * @param handler Handler for submission
 * @param onReset Handler to reset form state
 * @returns Function for onSubmit handler of form
 */
function submitHandler(
  group: IFormGroup,
  handler: () => Promise<void> | void,
  onReset?: () => void,
) {
  return async (e: Event) => {
    e.preventDefault();

    for (const control of Object.values(group.controls)) {
      control.markTouched(true);
    }

    if (!canSubmit(group)) return;

    group.markPending(true);

    try {
      await handler();
      resetGeneric(group, true);
      onReset?.();
    } catch (err) {
      group.setErrors({
        error: err,
      });

      resetGeneric(group, false);
    } finally {
      group.markPending(false);
    }
  };
}

export const Form2 = {
  TextField: FormTextField,
  TextEditor: FormTextEditor,
  FileInput: FormFileInput,
  Checkbox: FormCheckbox,
  Radio: FormRadio,
  VirtualSelect: FormVirtualSelect,
  Reset: FormResetButton,
  Submit: FormSubmitButton,
  canSubmit,
  submitHandler,
};
