import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { ServerMember, User } from "stoat.js";

import { timeLocale, useTime } from "@revolt/i18n";

import { Text } from "../../design";
import { OverflowingText } from "../../utils";

import { ProfileCard } from "./ProfileCard";

export function ProfileJoined(props: {
  user: User;
  member?: ServerMember;
  /** Full width, height fits content (used in the floating user card) */
  fluid?: boolean;
}) {
  const dayjs = useTime();

  return (
    <Show when={!props.fluid || props.member}>
      <ProfileCard width={props.fluid ? "full" : undefined}>
        <Text class="title" size={props.fluid ? "small" : "large"}>
          <Trans>Joined</Trans>
        </Text>
        <Show when={!props.fluid}>
          <Text class="label">
            <OverflowingText>Stoat</OverflowingText>
            {/* <Trans>Account Created</Trans> */}
          </Text>
          <Text>
            {dayjs(props.user.createdAt).format(
              timeLocale()[1]
                .formats.L?.replace("MM", "MMM")
                .replaceAll("/", " ")
                .replaceAll("-", " "),
            )}
          </Text>
        </Show>
        <Show when={props.member}>
          <Text class="label">
            <OverflowingText>{props.member!.server!.name}</OverflowingText>
            {/* <Trans>Member Since</Trans> */}
          </Text>
          <Text>
            {dayjs(props.member!.joinedAt).format(
              timeLocale()[1]
                .formats.L?.replace("MM", "MMM")
                .replaceAll("/", " ")
                .replaceAll("-", " "),
            )}
          </Text>
        </Show>
      </ProfileCard>
    </Show>
  );
}
