import { Show } from "solid-js";

import { Plural, Trans } from "@lingui/solid/macro";
import type { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { Button, Text } from "@revolt/ui";

/**
 * Banner shown while previewing the server as a role
 */
export function ViewAsBanner(props: { server: Server; compact?: boolean }) {
  const client = useClient();
  const { openModal } = useModals();

  // Channels we were never sent can't be previewed
  const hidden = () =>
    props.server.channelIds.size - props.server.channels.length;

  return (
    <Show when={props.server.previewRoles}>
      {(roles) => {
        const names = () =>
          roles()
            .map((role) => role.name)
            .join(", ");

        return (
          <Base>
            <Text class="label" size="large">
              <Show
                when={roles().length}
                fallback={<Trans>Viewing as no roles</Trans>}
              >
                <Trans>Viewing as {names()}</Trans>
              </Show>
            </Text>
            <Show when={!props.compact && hidden() > 0}>
              <Text class="body" size="small">
                <Plural
                  value={hidden()}
                  one="# channel you can't access isn't included, so this may not be a full picture"
                  other="# channels you can't access aren't included, so this may not be a full picture"
                />
              </Text>
            </Show>
            <Actions>
              <Button
                variant="text"
                onPress={() =>
                  openModal({ type: "view_as_role", server: props.server })
                }
              >
                <Trans>Change roles</Trans>
              </Button>
              <Button variant="text" onPress={() => client().setViewAs()}>
                <Trans>Stop viewing</Trans>
              </Button>
            </Actions>
          </Base>
        );
      }}
    </Show>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
  },
});

const Base = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "var(--gap-sm)",
    margin: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",
    color: "var(--md-sys-color-on-surface)",
    backgroundColor: "var(--md-sys-color-surface-variant)",
  },
});
