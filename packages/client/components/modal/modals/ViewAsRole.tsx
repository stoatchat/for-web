import { For, createSignal } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import { useClient } from "@revolt/client";
import { Checkbox, Column, Dialog, DialogProps } from "@revolt/ui";

import { Modals } from "../types";

/**
 * Modal to choose which roles to view the server as
 */
export function ViewAsRoleModal(
  props: DialogProps & Modals & { type: "view_as_role" },
) {
  const client = useClient();

  // Start from the roles we are already previewing, if any
  const [selected, setSelected] = createSignal(
    // eslint-disable-next-line solid/reactivity
    props.server.previewRoles?.map((role) => role.id) ?? [],
  );

  // Only roles ranked below our own can be previewed
  const roles = () =>
    props.server.orderedRoles.filter(
      (role) => role.rank! > (props.server.member?.realRanking ?? Infinity),
    );

  function toggle(id: string) {
    setSelected((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>View server as</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>View</Trans>,
          onClick: () => client().setViewAs(props.server.id, selected()),
        },
      ]}
    >
      <Column>
        <For each={roles()}>
          {(role) => (
            <Checkbox
              checked={selected().includes(role.id)}
              onChange={() => toggle(role.id)}
            >
              {role.name}
            </Checkbox>
          )}
        </For>
      </Column>
    </Dialog>
  );
}
