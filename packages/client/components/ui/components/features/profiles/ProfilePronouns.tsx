import { Trans } from "@lingui-solid/solid/macro";
import { Show } from "solid-js";
import { styled } from "styled-system/jsx";
import { Text, typography } from "../../design";
import { ProfileCard } from "./ProfileCard";

interface Props {
  content?: string;
}

export function ProfilePronouns(props: Props) {
  return (
    <Show when={props.content}>
      <ProfileCard>
        <Text class="title" size="large">
          <Trans>Pronouns</Trans>
        </Text>
        <Pronouns>{props.content}</Pronouns>
      </ProfileCard>
    </Show>
  );
}

const Pronouns = styled("span", {
  base: {
    ...typography.raw(),
    userSelect: "text",
  },
});
