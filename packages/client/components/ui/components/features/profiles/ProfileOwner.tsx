import { Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";

import { Avatar, Ripple, Text } from "../../design";

import { Trans } from "@lingui/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { Row } from "../../layout";
import { ProfileCard } from "./ProfileCard";

export function ProfileOwner(props: { bot: { owner: string } }) {
  const client = useClient();
  const { openModal } = useModals();

  const query = useQuery(() => ({
    queryKey: ["owner", props.bot.owner],
    queryFn: async () => {
      const clnt = client();

      return (
        clnt.users.get(props.bot.owner) ??
        (await clnt.users.fetch(props.bot.owner))
      );
    },
  }));

  function OpenOwnerProfile() {
    openModal({
      type: "user_profile",
      user: query.data!,
    });
  }

  return (
    <>
      <Show when={props.bot.owner}>
        <ProfileCard isLink onClick={OpenOwnerProfile}>
          <Ripple />
          <Text class="title" size="large">
            <Trans>Owner</Trans>
          </Text>
          <Row>
            <Avatar
              src={query.data?.animatedAvatarURL}
              fallback={query.data?.displayName}
              size={20}
            />

            <Text>
              {query.data?.displayName ??
                `${query.data?.username}#${query.data?.discriminator}`}
            </Text>
          </Row>
        </ProfileCard>
      </Show>
    </>
  );
}

const Grid = styled("div", {
  base: {
    gap: "var(--gap-md)",
    display: "flex",
    flexWrap: "wrap",
  },
});
