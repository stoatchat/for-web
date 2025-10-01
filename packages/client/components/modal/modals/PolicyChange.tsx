import { For, createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";

import {
  Checkbox,
  Column,
  Dialog,
  DialogProps,
  List,
  Row,
  Text,
  Time,
} from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdPolicy from "@material-design-icons/svg/outlined/policy.svg?component-solid";

import { useModals } from "..";
import { Modals } from "../types";

let shownForSession = false;

export function PolicyChangeModal(
  props: DialogProps & Modals & { type: "policy_change" },
) {
  const { showError } = useModals();
  const [confirm, setConfirm] = createSignal(false);

  // automatically close if we've already shown this modal in this session
  const allowDisplay = !shownForSession;
  shownForSession = true;
  onMount(() => !allowDisplay && props.onClose());

  return (
    <Dialog
      icon={<MdPolicy />}
      show={allowDisplay && props.show}
      onClose={props.onClose}
      title={<Trans>Review policy changes</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Acknowledge</Trans>,
          isDisabled: !confirm(),
          async onClick() {
            await props.acknowledge().catch(showError);
          },
        },
      ]}
    >
      <Trans>
        Click on the items below to learn more about different changes!
      </Trans>
      <List>
        <For each={props.changes}>
          {(change) => (
            <List.Item onClick={() => window.open(change.url, "_blank")}>
              <Row align>
                <Column gap="none" grow>
                  <Text class="title">{change.description}</Text>
                  <Text class="label">
                    <Trans>
                      Effective{" "}
                      <Time format="iso8601" value={change.effective_time} /> (
                      <Time format="relative" value={change.effective_time} />)
                    </Trans>
                  </Text>
                </Column>
                <Symbol>open_in_new</Symbol>
              </Row>
            </List.Item>
          )}
        </For>
      </List>
      <Checkbox
        checked={confirm()}
        onChange={() => setConfirm((checked) => !checked)}
      >
        I've read and reviewed the changes.
      </Checkbox>
    </Dialog>
  );
}
