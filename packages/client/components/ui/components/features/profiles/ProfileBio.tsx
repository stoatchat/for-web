import { Show } from "solid-js";

import { styled } from "styled-system/jsx";

import { Markdown } from "@revolt/markdown";

import { Ripple, Text, typography } from "../../design";

import { ProfileCard } from "./ProfileCard";

interface Props {
  full?: boolean;
  content?: string;
  onClick?: () => void;
  /** Full width, height fits content (used in the floating user card) */
  fluid?: boolean;
}

/**
 * Profile biography
 */
export function ProfileBio(props: Props) {
  return (
    <Show when={props.content}>
      <ProfileCard
        onClick={props.onClick}
        isLink={typeof props.onClick !== "undefined"}
        width={props.fluid ? "full" : props.full ? 3 : 2}
        constraint={props.fluid || props.full ? undefined : "half"}
      >
        <Show when={props.onClick}>
          <Ripple />
        </Show>

        <Text class="title" size={props.fluid ? "small" : "large"}>
          Bio
        </Text>

        <Bio>
          <Markdown content={props.content} />
        </Bio>
      </ProfileCard>
    </Show>
  );
}

const Bio = styled("span", {
  base: {
    ...typography.raw({ class: "_messages" }),
    userSelect: "text",
  },
});
