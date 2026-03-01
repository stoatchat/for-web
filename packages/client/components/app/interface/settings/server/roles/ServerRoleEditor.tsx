import { createFormControl, createFormGroup } from "solid-forms";
import { For, Index, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { createStore, produce } from "solid-js/store";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { API, Server, ServerRole } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import {
  Button,
  CategoryButton,
  CircularProgress,
  Column,
  Form2,
  IconButton,
  Row,
  Text,
} from "@revolt/ui";

import MdAdd from "@material-design-icons/svg/outlined/add.svg?component-solid";
import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";
import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MDPalette from "@material-design-icons/svg/outlined/palette.svg?component-solid";

import { useSettingsNavigation } from "../../Settings";
import { ChannelPermissionsEditor } from "../../channel/permissions/ChannelPermissionsEditor";

/** Direction presets for linear gradients */
const DIRECTIONS = [
  { label: "→", value: "to right" },
  { label: "↘", value: "to bottom right" },
  { label: "↓", value: "to bottom" },
  { label: "↙", value: "to bottom left" },
  { label: "←", value: "to left" },
  { label: "↖", value: "to top left" },
  { label: "↑", value: "to top" },
  { label: "↗", value: "to top right" },
] as const;

/** Preset gradient values */
const GRADIENT_PRESETS = [
  "linear-gradient(to right, #7B68EE, #3498DB)",
  "linear-gradient(to right, #E91E63, #FF7F50)",
  "linear-gradient(to right, #1ABC9C, #3498DB)",
  "linear-gradient(to right, #F1C40F, #E91E63)",
  "linear-gradient(to right, #D468EE, #7B68EE)",
  "linear-gradient(to right, #FF424F, #F1C40F)",
  "linear-gradient(to right, #1ABC9C, #D468EE)",
  "linear-gradient(to right, #3498DB, #E91E63, #F1C40F)",
] as const;

interface GradientStop {
  color: string;
}

interface GradientState {
  type: "linear" | "radial";
  direction: string;
  stops: GradientStop[];
}

/** Build a CSS gradient string from the editor state */
function buildGradientCSS(state: GradientState): string {
  const colors = state.stops.map((s) => s.color).join(", ");
  if (state.type === "radial") {
    return `radial-gradient(circle, ${colors})`;
  }
  return `linear-gradient(${state.direction}, ${colors})`;
}

/** Try to parse an existing gradient string into editor state */
function parseGradient(value: string | null): GradientState | null {
  if (!value || !value.includes("gradient")) return null;

  const isRadial = value.startsWith("radial-gradient");
  const type: "linear" | "radial" = isRadial ? "radial" : "linear";

  // Extract the content inside the parentheses
  const match = value.match(/gradient\((.+)\)$/);
  if (!match) return null;

  const inner = match[1];
  // Split by commas, but respect nested parens
  const parts = inner.split(",").map((s) => s.trim());

  let direction = "to right";
  const colorParts: string[] = [];

  for (const part of parts) {
    if (part.startsWith("#") || part.startsWith("rgb")) {
      colorParts.push(part);
    } else if (part.startsWith("to ")) {
      direction = part;
    } else if (part === "circle") {
      // radial keyword, skip
    } else if (part.match(/^#/)) {
      colorParts.push(part);
    } else {
      // Could be a color with position like "#FF0000 50%", extract color
      const colorMatch = part.match(/(#[0-9a-fA-F]{3,8})/);
      if (colorMatch) {
        colorParts.push(colorMatch[1]);
      }
    }
  }

  if (colorParts.length < 2) return null;

  return {
    type,
    direction,
    stops: colorParts.map((color) => ({ color })),
  };
}

/**
 * Role editor
 */
export function ServerRoleEditor(props: { context: Server; roleId: string }) {
  const { t } = useLingui();
  const { openModal } = useModals();
  const { navigate } = useSettingsNavigation();

  const role = createMemo(
    () =>
      props.context.orderedRoles.find(
        (r) => r.id == props.roleId,
      ) as ServerRole,
  );

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    name: createFormControl(role()?.name || ""),
    colour: createFormControl(role()?.colour || null),
    hoist: createFormControl(role()?.hoist == true),
  });
  /* eslint-enable solid/reactivity */

  // Determine initial color mode from existing value
  const initialColour = role()?.colour || null;
  const isGradient = initialColour?.includes("gradient") ?? false;

  const [colorMode, setColorMode] = createSignal<"solid" | "gradient">(
    isGradient ? "gradient" : "solid",
  );

  const [pickerRef, setPickerRef] = createSignal<HTMLDivElement>();

  // Gradient editor state
  const parsedGradient = parseGradient(initialColour);
  const [gradient, setGradient] = createStore<GradientState>(
    parsedGradient ?? {
      type: "linear",
      direction: "to right",
      stops: [{ color: "#7B68EE" }, { color: "#3498DB" }],
    },
  );

  /** Recompute gradient CSS and update the form control */
  function syncGradientToForm() {
    const value = buildGradientCSS(gradient);
    editGroup.controls.colour.setValue(value);
    editGroup.controls.colour.markDirty(true);
  }

  function setGradientType(type: "linear" | "radial") {
    setGradient("type", type);
    syncGradientToForm();
  }

  function setGradientDirection(direction: string) {
    setGradient("direction", direction);
    syncGradientToForm();
  }

  function setStopColor(index: number, color: string) {
    setGradient(
      produce((s) => {
        s.stops[index].color = color;
      }),
    );
    syncGradientToForm();
  }

  function addStop() {
    if (gradient.stops.length >= 5) return;
    setGradient(
      produce((s) => {
        s.stops.push({ color: "#FFFFFF" });
      }),
    );
    syncGradientToForm();
  }

  function removeStop(index: number) {
    if (gradient.stops.length <= 2) return;
    setGradient(
      produce((s) => {
        s.stops.splice(index, 1);
      }),
    );
    syncGradientToForm();
  }

  function applyPresetGradient(preset: string) {
    const parsed = parseGradient(preset);
    if (parsed) {
      setGradient("type", parsed.type);
      setGradient("direction", parsed.direction);
      setGradient(
        produce((s) => {
          s.stops = parsed.stops;
        }),
      );
    }
    editGroup.controls.colour.setValue(preset);
    editGroup.controls.colour.markDirty(true);
  }

  async function onSubmit() {
    const changes: API.DataEditRole = {};

    if (editGroup.controls.name.isDirty) {
      changes.name = editGroup.controls.name.value.trim();
    }

    if (editGroup.controls.hoist.isDirty) {
      changes.hoist = editGroup.controls.hoist.value;
    }

    if (editGroup.controls.colour.isDirty) {
      changes.colour = editGroup.controls.colour.value ?? null;
    }

    await props.context.editRole(props.roleId, changes);
  }

  function onReset() {
    editGroup.controls.name.setValue(role()?.name || "");
    editGroup.controls.hoist.setValue(role()?.hoist || false);
    editGroup.controls.colour.setValue(role()?.colour || null);
  }

  const submit = Form2.useSubmitHandler(editGroup, onSubmit, onReset);

  return (
    <Column>
      <form onSubmit={submit}>
        <Column gap="lg">
          <Column>
            <Form2.TextField
              name="name"
              control={editGroup.controls.name}
              label={t`Role Name`}
            />
          </Column>

          {/* Color mode tabs */}
          <Column gap="md">
            <Text class="label">
              <Trans>Role Colour</Trans>
            </Text>
            <Row>
              <Button
                size="sm"
                group="standard"
                groupActive={colorMode() === "solid"}
                onPress={() => setColorMode("solid")}
              >
                <Trans>Solid</Trans>
              </Button>
              <Button
                size="sm"
                group="standard"
                groupActive={colorMode() === "gradient"}
                onPress={() => setColorMode("gradient")}
              >
                <Trans>Gradient</Trans>
              </Button>
            </Row>
          </Column>

          {/* Solid colour picker */}
          <Show when={colorMode() === "solid"}>
            <Column>
              <Row align>
                <IconButton
                  ref={setPickerRef}
                  variant="filled"
                  shape="square"
                  size="lg"
                  onPress={() => pickerRef()?.click()}
                >
                  <MDPalette />
                </IconButton>
                <input
                  ref={setPickerRef}
                  type="color"
                  value={editGroup.controls.colour.value ?? "#ffffff"}
                  onInput={(e) => {
                    const colour = (e.currentTarget as HTMLInputElement).value;
                    editGroup.controls.colour.setValue(colour);
                    editGroup.controls.colour.markDirty(true);
                  }}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    width: "0px",
                    height: "0px",
                    padding: 0,
                    border: "none",
                  }}
                />
                <Column gap="lg">
                  <Row justify>
                    <For
                      each={[
                        "#7B68EE",
                        "#3498DB",
                        "#1ABC9C",
                        "#F1C40F",
                        "#FF7F50",
                        "#FD6671",
                        "#E91E63",
                        "#D468EE",
                      ]}
                    >
                      {(colour) => (
                        <Button
                          size="sm"
                          bg={colour}
                          group="standard"
                          groupActive={
                            editGroup.controls.colour.value === colour
                          }
                          onPress={() => {
                            editGroup.controls.colour.setValue(colour);
                            editGroup.controls.colour.markDirty(true);
                          }}
                        />
                      )}
                    </For>
                  </Row>

                  <Row justify>
                    <For
                      each={[
                        "#594CAD",
                        "#206694",
                        "#11806A",
                        "#C27C0E",
                        "#CD5B45",
                        "#FF424F",
                        "#AD1457",
                        "#954AA8",
                      ]}
                    >
                      {(colour) => (
                        <Button
                          size="sm"
                          bg={colour}
                          group="standard"
                          groupActive={
                            editGroup.controls.colour.value === colour
                          }
                          onPress={() => {
                            editGroup.controls.colour.setValue(colour);
                            editGroup.controls.colour.markDirty(true);
                          }}
                        />
                      )}
                    </For>
                  </Row>
                </Column>
              </Row>
            </Column>
          </Show>

          {/* Gradient editor */}
          <Show when={colorMode() === "gradient"}>
            <Column gap="md">
              {/* Live preview */}
              <GradientPreview
                style={{ background: buildGradientCSS(gradient) }}
              />

              {/* Gradient type */}
              <Row>
                <Button
                  size="sm"
                  group="standard"
                  groupActive={gradient.type === "linear"}
                  onPress={() => setGradientType("linear")}
                >
                  Linear
                </Button>
                <Button
                  size="sm"
                  group="standard"
                  groupActive={gradient.type === "radial"}
                  onPress={() => setGradientType("radial")}
                >
                  Radial
                </Button>
              </Row>

              {/* Direction (linear only) */}
              <Show when={gradient.type === "linear"}>
                <Column gap="sm">
                  <Text class="label">
                    <Trans>Direction</Trans>
                  </Text>
                  <Row>
                    <For each={DIRECTIONS}>
                      {(dir) => (
                        <DirectionButton
                          active={gradient.direction === dir.value}
                          onClick={() => setGradientDirection(dir.value)}
                        >
                          {dir.label}
                        </DirectionButton>
                      )}
                    </For>
                  </Row>
                </Column>
              </Show>

              {/* Color stops */}
              <Column gap="sm">
                <Text class="label">
                  <Trans>Colour Stops</Trans>
                </Text>
                <Index each={gradient.stops}>
                  {(stop, index) => (
                    <Row align>
                      <StopColorSwatch style={{ background: stop().color }} />
                      <input
                        type="color"
                        value={stop().color}
                        onInput={(e) =>
                          setStopColor(
                            index,
                            (e.currentTarget as HTMLInputElement).value,
                          )
                        }
                        class={colorInputClass}
                      />
                      <StopLabel>
                        {stop().color.toUpperCase()}
                      </StopLabel>
                      <Show when={gradient.stops.length > 2}>
                        <IconButton
                          size="sm"
                          variant="text"
                          onPress={() => removeStop(index)}
                        >
                          <MdClose />
                        </IconButton>
                      </Show>
                    </Row>
                  )}
                </Index>
                <Show when={gradient.stops.length < 5}>
                  <Button size="sm" variant="tonal" onPress={addStop}>
                    <MdAdd />
                    <Trans>Add Colour Stop</Trans>
                  </Button>
                </Show>
              </Column>

              {/* Preset gradients */}
              <Column gap="sm">
                <Text class="label">
                  <Trans>Presets</Trans>
                </Text>
                <Row justify>
                  <For each={[...GRADIENT_PRESETS]}>
                    {(preset) => (
                      <GradientPresetButton
                        style={{ background: preset }}
                        active={editGroup.controls.colour.value === preset}
                        onClick={() => applyPresetGradient(preset)}
                      />
                    )}
                  </For>
                </Row>
              </Column>
            </Column>
          </Show>

          <Column>
            <Text class="label">Hoist Role</Text>
            <Form2.Checkbox control={editGroup.controls.hoist}>
              Display this role above others
            </Form2.Checkbox>
          </Column>

          <Column>
            <Row>
              <Form2.Reset group={editGroup} onReset={onReset} />
              <Form2.Submit group={editGroup} requireDirty>
                <Trans>Save</Trans>
              </Form2.Submit>
              <Show when={editGroup.isPending}>
                <CircularProgress />
              </Show>
            </Row>
          </Column>
        </Column>
      </form>
      <Divider />
      <ChannelPermissionsEditor
        type="server_role"
        context={props.context}
        roleId={props.roleId}
      />
      <Column>
        <CategoryButton
          action="chevron"
          icon={<MdContentCopy />}
          onClick={() => navigator.clipboard.writeText(`${props.roleId}`)}
        >
          <Trans>Copy role ID</Trans>
        </CategoryButton>
        <CategoryButton
          action="chevron"
          icon={<MdDelete />}
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

const GradientPreview = styled("div", {
  base: {
    width: "100%",
    height: "40px",
    borderRadius: "var(--borderRadius-lg)",
    border: "1px solid var(--md-sys-color-outline-variant)",
  },
});

const DirectionButton = styled("button", {
  base: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container)",
    color: "var(--md-sys-color-on-surface)",
    cursor: "pointer",
    transition: "var(--transitions-medium) all",

    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
  variants: {
    active: {
      true: {
        background: "var(--md-sys-color-primary)",
        color: "var(--md-sys-color-on-primary)",
        borderColor: "var(--md-sys-color-primary)",
      },
    },
  },
});

const StopColorSwatch = styled("div", {
  base: {
    width: "28px",
    height: "28px",
    borderRadius: "var(--borderRadius-md)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    flexShrink: 0,
  },
});

const StopLabel = styled("span", {
  base: {
    fontFamily: "monospace",
    fontSize: "13px",
    color: "var(--md-sys-color-on-surface-variant)",
    userSelect: "all",
    flexGrow: 1,
  },
});

const colorInputClass = css({
  width: "32px",
  height: "32px",
  padding: 0,
  border: "none",
  background: "none",
  cursor: "pointer",
  flexShrink: 0,
});

const GradientPresetButton = styled("button", {
  base: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "2px solid transparent",
    cursor: "pointer",
    transition: "var(--transitions-medium) all",
    flexShrink: 0,

    "&:hover": {
      transform: "scale(1.1)",
    },
  },
  variants: {
    active: {
      true: {
        borderColor: "var(--md-sys-color-primary)",
        boxShadow: "0 0 0 2px var(--md-sys-color-primary)",
      },
    },
  },
});
