import { Component, Match, Show, Switch, createMemo } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import { useClient } from "@revolt/client";
import { useDevice } from "@revolt/common";
import { Navigate, useParams } from "@revolt/routing";
import { Column, Text } from "@revolt/ui";
import { styled } from "styled-system/jsx";

import { ViewAsBanner } from "./navigation/channels/ViewAsBanner";

/**
 * Server home component
 */
export const ServerHome: Component = () => {
  const params = useParams();
  const client = useClient();
  const device = useDevice();
  const server = createMemo(() => client()!.servers.get(params.server)!);

  return (
    // TODO: port the nice fallback
    <Switch fallback="No channels!">
      <Match when={!server()}>
        <Navigate href={"/"} />
      </Match>
      <Match when={server().defaultChannel}>
        <Navigate href={`channel/${server().defaultChannel!.id}`} />
      </Match>
      <Match when={server().previewRoles}>
        <Column grow>
          <Show when={device.layout() === "phone"}>
            <ViewAsBanner server={server()} />
          </Show>
          <EmptyMessage>
            <Text class="body" size="large">
              <Trans>This role can't see any channels.</Trans>
            </Text>
          </EmptyMessage>
        </Column>
      </Match>
    </Switch>
  );
};

const EmptyMessage = styled("div", {
  base: {
    padding: "var(--gap-md) var(--gap-lg)",
  },
});
