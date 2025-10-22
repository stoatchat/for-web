import { createFormControl, createFormGroup } from "solid-forms";
import { createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { useClient } from "@revolt/client";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Row,
  Text,
  TextField,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Create a new group and optionally add members
 */
export function CreateGroupModal(
  props: DialogProps & Modals & { type: "create_group" },
) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const group = createFormGroup({
    name: createFormControl("", { required: true }),
    users: createFormControl([] as string[]),
  });

  async function onSubmit() {
    try {
      await props.client.channels.createGroup(
        group.controls.name.value,
        group.controls.users.value,
      );

      props.onClose();
    } catch (err) {
      showError(err);
    }
  }

  const [filter, setFilter] = createSignal("");

  const filterLowercase = createMemo(() => filter().toLowerCase());

  const users = createMemo(() =>
    client()
      .users.filter((user) => user.relationship === "Friend")
      .filter((user) =>
        user.displayName.toLowerCase().includes(filterLowercase()),
      )
      .toSorted((a, b) => a.displayName.localeCompare(b.displayName))
      .map((user) => ({ item: user, value: user.id })),
  );

  return (
    <Dialog
      minWidth={420}
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Create a new group</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Create</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Form2.TextField
            name="name"
            control={group.controls.name}
            label={t`Group Name`}
          />

          <Text class="label">
            <Trans>Select members to add</Trans>
          </Text>

          <TextField
            value={filter()}
            variant="filled"
            placeholder={t`Search for users...`}
            onKeyUp={(e) => setFilter(e.currentTarget.value)}
          />

          <Form2.VirtualSelect
            items={users()}
            control={group.controls.users}
            multiple
          >
            {(item) => (
              <Row align>
                <Avatar
                  src={item.animatedAvatarURL}
                  fallback={item.displayName}
                  size={24}
                />{" "}
                <span>{item.displayName}</span>
              </Row>
            )}
          </Form2.VirtualSelect>
        </Column>
      </form>
    </Dialog>
  );
}
