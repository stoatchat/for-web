import { For, Show, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { createFormControl, createFormGroup } from "solid-forms";
import { API, Server, ServerRole } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import {
  Button,
  CategoryButton,
  ColouredText,
  Column,
  Form2,
  Ripple,
  Text,
  typography,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";
import { createMaterialColourVariables } from "@revolt/ui/themes";

import { useSettingsNavigation } from "../../Settings";
import { ChannelPermissionsEditor } from "../../channel/permissions/ChannelPermissionsEditor";

const ROLE_COLOUR_PALETTE = [
  [
    "#fca5a5",
    "#fdba74",
    "#fcd34d",
    "#86efac",
    "#6ee7b7",
    "#67e8f9",
    "#93c5fd",
    "#c4b5fd",
    "#f0abfc",
    "#f9a8d4",
    "#cbd5e1",
  ],
  [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#22c55e",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
    "#64748b",
  ],
  [
    "#991b1b",
    "#9a3412",
    "#92400e",
    "#166534",
    "#065f46",
    "#155e75",
    "#1e40af",
    "#5b21b6",
    "#86198f",
    "#9d174d",
    "#1e293b",
  ],
] as const;

const ROLE_COLOUR_VALUES: ReadonlySet<string> = new Set(
  ROLE_COLOUR_PALETTE.flat(),
);

function RoleColourPicker(props: {
  colour: string | null;
  roleName: string;
  onChange: (colour: string | null) => void;
}) {
  const { t } = useLingui();
  const state = useState();
  const [pickerRef, setPickerRef] = createSignal<HTMLInputElement>();

  const colourPreviews = createMemo(() => {
    const theme = state.theme.activeTheme;

    return [
      {
        label: t`Light`,
        colours: createMaterialColourVariables(
          { ...theme, darkMode: false },
          "",
        ),
      },
      {
        label: t`Dark`,
        colours: createMaterialColourVariables(
          { ...theme, darkMode: true },
          "",
        ),
      },
    ];
  });

  function isSelectedColour(colour: string) {
    return props.colour?.toLowerCase() === colour;
  }

  function isCustomColour() {
    const colour = props.colour?.toLowerCase();
    return !!colour && !ROLE_COLOUR_VALUES.has(colour);
  }

  return (
    <RoleColourControls>
      <ColourSelector gap="md">
        <Text class="label">
          <Trans>Role Colour</Trans>
        </Text>

        <ColourPalette>
          <For each={ROLE_COLOUR_PALETTE}>
            {(row) => (
              <For each={row}>
                {(colour) => (
                  <ColourSwatch
                    type="button"
                    selected={isSelectedColour(colour)}
                    aria-label={t`Set role colour to ${colour}`}
                    aria-pressed={isSelectedColour(colour)}
                    style={{ background: colour }}
                    onClick={() => props.onChange(colour)}
                  >
                    <Ripple />
                  </ColourSwatch>
                )}
              </For>
            )}
          </For>
        </ColourPalette>

        <ColourActions>
          <Button
            size="sm"
            variant={isCustomColour() ? "tonal" : "outlined"}
            onPress={() => pickerRef()?.click()}
          >
            <ColourActionContent>
              <Show
                when={isCustomColour()}
                fallback={
                  <Symbol size={20} marginRight="var(--gap-sm)">
                    palette
                  </Symbol>
                }
              >
                <CustomColourIndicator
                  style={{ background: props.colour ?? "transparent" }}
                />
              </Show>{" "}
              <Trans>Custom colour</Trans>
            </ColourActionContent>
          </Button>
          <input
            ref={setPickerRef}
            type="color"
            value={props.colour ?? "#ffffff"}
            onInput={(event) => props.onChange(event.currentTarget.value)}
            style={{
              position: "absolute",
              opacity: 0,
              width: "0px",
              height: "0px",
              padding: 0,
              border: "none",
            }}
          />
          <Button
            size="sm"
            variant={props.colour === null ? "tonal" : "outlined"}
            onPress={() => props.onChange(null)}
          >
            <ColourActionContent>
              <NoColourIndicator /> <Trans>Default</Trans>
            </ColourActionContent>
          </Button>
        </ColourActions>
      </ColourSelector>

      <ColourPreview>
        <Text class="label">
          <Trans>Preview</Trans>
        </Text>
        <For each={colourPreviews()}>
          {(preview) => (
            <PreviewSurface
              role="group"
              aria-label={preview.label}
              style={{
                background: preview.colours["surface-container-lowest"],
                color: preview.colours["on-surface"],
                "border-color": preview.colours["outline-variant"],
              }}
            >
              <PreviewMessage>
                <PreviewAvatar
                  style={{
                    background: preview.colours["surface-container-highest"],
                  }}
                />
                <PreviewMessageContent>
                  <PreviewUsername>
                    <ColouredText
                      colour={props.colour ?? preview.colours["on-surface"]}
                    >
                      {props.roleName.trim() || t`Role Name`}
                    </ColouredText>
                  </PreviewUsername>
                  <PreviewBody>
                    <Trans>Stoat rocks!</Trans>
                  </PreviewBody>
                </PreviewMessageContent>
              </PreviewMessage>
            </PreviewSurface>
          )}
        </For>
      </ColourPreview>
    </RoleColourControls>
  );
}

/**
 * Role editor
 */
export function ServerRoleEditor(props: { context: Server; roleId: string }) {
  const { t } = useLingui();
  const client = useClient();
  const { openModal } = useModals();
  const { navigate } = useSettingsNavigation();
  const instance = useInstance();

  const role = createMemo(
    () =>
      props.context.orderedRoles.find(
        (r) => r.id == props.roleId,
      ) as ServerRole,
  );

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    name: createFormControl(role()?.name || ""),
    icon: createFormControl<string | File[] | null>(role()?.icon?.originalUrl),
    colour: createFormControl(role()?.colour || null),
    hoist: createFormControl(role()?.hoist == true),
  });
  /* eslint-enable solid/reactivity */

  function selectColour(colour: string | null) {
    editGroup.controls.colour.setValue(colour);
    editGroup.controls.colour.markDirty(true);
  }

  async function onSubmit() {
    const changes: API.DataEditRole = {
      remove: [],
    };

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.icon.isDirty) {
      if (!editGroup.controls.icon.value) {
        changes.remove!.push("Icon");
      } else if (Array.isArray(editGroup.controls.icon.value)) {
        changes.icon = await client().uploadFile(
          "icons",
          editGroup.controls.icon.value[0],
          instance.mediaUrl,
        );
      }
    }

    if (editGroup.controls.hoist.isDirty) {
      changes.hoist = editGroup.controls.hoist.value;
    }

    if (editGroup.controls.colour.isDirty) {
      if (editGroup.controls.colour.value === null) {
        changes.remove!.push("Colour");
      } else {
        changes.colour = editGroup.controls.colour.value;
      }
    }

    await props.context.editRole(props.roleId, changes);
  }

  function onReset() {
    editGroup.controls.name.setValue(role()?.name || "");
    editGroup.controls.icon.setValue(role()?.icon?.originalUrl || null);
    editGroup.controls.hoist.setValue(role()?.hoist || false);
    editGroup.controls.colour.setValue(role()?.colour || null);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column>
      <form onSubmit={(event) => event.preventDefault()}>
        <Column gap="lg">
          <Form2.TextField
            minlength={1}
            maxlength={32}
            counter
            name="name"
            control={editGroup.controls.name}
            label={t`Role Name`}
          />
          <RoleColourPicker
            colour={editGroup.controls.colour.value}
            roleName={editGroup.controls.name.value}
            onChange={selectColour}
          />

          <Form2.FileInput
            control={editGroup.controls.icon}
            accept="image/*"
            label={t`Role Icon`}
            imageJustify={false}
            maxSize={instance.limits().file_upload_size_limits["icons"]}
          />

          <Column>
            <Text class="label">
              <Trans>Hoist Role</Trans>
            </Text>
            <Form2.Checkbox control={editGroup.controls.hoist}>
              <Trans>
                Display users with this role separately in the member list
              </Trans>
            </Form2.Checkbox>
          </Column>
        </Column>
      </form>
      <Divider />
      <ChannelPermissionsEditor
        type="server_role"
        context={props.context}
        roleId={props.roleId}
        saveLabel={t`Save`}
        additionalActions={{
          isDirty: () => editGroup.isDirty,
          isPending: () => editGroup.isPending,
          canSave: () => Form2.canSubmit(editGroup),
          save: () => submit(new Event("submit")),
          reset: () => Form2.reset(editGroup, onReset),
        }}
      />
      <Column>
        <CategoryButton
          action="chevron"
          icon={<Symbol size={20}>content_copy</Symbol>}
          onClick={() => navigator.clipboard.writeText(`${props.roleId}`)}
        >
          <Trans>Copy role ID</Trans>
        </CategoryButton>
        <CategoryButton
          action="chevron"
          icon={<Symbol size={20}>delete</Symbol>}
          onClick={() =>
            openModal({
              type: "delete_role",
              role: role(),
              cb: () => navigate("roles"),
            })
          }
        >
          <Trans>Delete Role</Trans>
        </CategoryButton>
      </Column>
    </Column>
  );
}

export const Divider = styled("div", {
  base: {
    height: "1px",
    margin: "var(--gap-sm) 0",
    background: "var(--md-sys-color-outline-variant)",
  },
});

const NoColourIndicator = styled("span", {
  base: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    borderRadius: "var(--borderRadius-full)",
    border: "2px dashed var(--md-sys-color-on-surface-variant)",
    marginRight: "var(--gap-sm)",
  },
});

const CustomColourIndicator = styled("span", {
  base: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    borderRadius: "50%",
    marginRight: "var(--gap-sm)",
  },
});

const RoleColourControls = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: "var(--gap-lg)",
  },
});

const ColourSelector = styled(Column, {
  base: {
    width: "fit-content",
    maxWidth: "100%",
    flexShrink: 0,
  },
});

const ColourPreview = styled("div", {
  base: {
    width: "220px",
    maxWidth: "100%",
    flex: "0 1 220px",
    display: "grid",
    gridTemplateRows: "auto repeat(2, minmax(0, 1fr))",
    gap: "var(--gap-md)",
  },
});

const PreviewSurface = styled("div", {
  base: {
    minHeight: "72px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "var(--gap-md)",
    paddingInline: "var(--gap-l)",
    border: "1px solid",
    borderRadius: "var(--borderRadius-md)",
  },
});

const PreviewMessage = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
  },
});

const PreviewAvatar = styled("span", {
  base: {
    width: "28px",
    height: "28px",
    flexShrink: 0,
    borderRadius: "50%",
  },
});

const PreviewMessageContent = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
});

const PreviewUsername = styled("span", {
  base: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    ...typography.raw({ class: "label", size: "large" }),
  },
});

const PreviewBody = styled("span", {
  base: {
    ...typography.raw({ class: "_messages" }),
  },
});

const ColourPalette = styled("div", {
  base: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(11, minmax(0, 36px))",
    gap: "var(--gap-sm)",
  },
});

const ColourSwatch = styled("button", {
  base: {
    width: "100%",
    aspectRatio: "1 / 1",
    padding: 0,
    border: 0,
    borderRadius: "50%",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "border-radius 200ms cubic-bezier(0.2, 0, 0, 1)",

    _focusVisible: {
      outline: "2px solid var(--md-sys-color-on-surface)",
      outlineOffset: "2px",
    },
  },
  variants: {
    selected: {
      true: {
        borderRadius: "var(--borderRadius-md)",
      },
    },
  },
});

const ColourActions = styled("div", {
  base: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "var(--gap-sm)",
    position: "relative",
  },
});

const ColourActionContent = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--gap-sm)",

    "& svg": {
      width: "20px",
      height: "20px",
    },
  },
});
