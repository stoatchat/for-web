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
  TextField,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Add members to an existing group
 */
export function AddMembersToGroupModal(
  props: DialogProps & Modals & { type: "add_members_to_group" },
) {
  const { t } = useLingui();
  const client = useClient();
  const { showError } = useModals();

  const group = createFormGroup({
    users: createFormControl([] as string[], { required: true }),
  });

  async function onSubmit() {
    try {
      for (const user of group.controls.users.value) {
        await props.group.addMember(user);
      }

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
      .filter((user) => !props.group.recipientIds.has(user.id))
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
      title={<Trans>Add friends to group</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Add</Trans>,
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
