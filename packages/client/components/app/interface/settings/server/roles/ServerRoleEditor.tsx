import { createFormControl, createFormGroup } from "solid-forms";
import { For, Show, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { API, Server, ServerRole } from "stoat.js";
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

import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MDPalette from "@material-design-icons/svg/outlined/palette.svg?component-solid";

import { useSettingsNavigation } from "../../Settings";
import { ChannelPermissionsEditor } from "../../channel/permissions/ChannelPermissionsEditor";

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

  const editGroup = createFormGroup({
    name: createFormControl(role()?.name || ""),
    colour: createFormControl(role()?.colour || null),
    hoist: createFormControl(role()?.hoist == true),
  });

  const [pickerRef, setPickerRef] = createSignal<HTMLDivElement>();

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

  return (
    <Column>
      <form onSubmit={Form2.submitHandler(editGroup, onSubmit, onReset)}>
        <Column gap="lg">
          <Column>
            <Form2.TextField
              name="name"
              control={editGroup.controls.name}
              label={t`Role Name`}
            />
          </Column>
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
                        groupActive={editGroup.controls.colour.value === colour}
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
                        groupActive={editGroup.controls.colour.value === colour}
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
