import { useQuery } from "@tanstack/solid-query";
import { JSX, onMount, Show } from "solid-js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useDevice } from "@revolt/common";
import { useModals } from "@revolt/modal";

import { Profile } from "../features";

/**
 * Base element for the card
 */
const base = cva({
  base: {
    // padding: "var(--gap-md)",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-high)",
    boxShadow:
      "0 24px 48px -16px rgba(0, 0, 0, 0.55), 0 0 0 1px var(--md-sys-color-outline-variant)",

    width: "340px",

    borderRadius: "var(--borderRadius-lg)",
    overflow: "hidden",
  },
});

/**
 * User Card
 */
export function UserCard(
  props: JSX.Directives["floating"]["userCard"] &
    object & { onClose: () => void },
) {
  const { isMobile } = useDevice();
  const { openModal } = useModals();
  const query = useQuery(() => ({
    queryKey: ["profile", props.user.id],
    queryFn: () => props.user.fetchProfile(),
  }));

  function openFull() {
    if (props.user.self) {
      openModal({
        type: "settings",
        config: "user",
        context: { page: "profile" },
      });
    } else {
      openModal({
        type: "user_profile",
        user: props.user,
        member: props.member,
      });
    }
    props.onClose();
  }

  onMount(() => {
    if (isMobile) openFull();
  });

  return (
    <Show when={!isMobile}>
      <div
        class={base()}
        on:pointerdown={(e) => {
          e.preventDefault();
        }}
      >
        <TopArea>
          <Profile.Banner
            overlap
            width={2}
            user={props.user}
            member={props.member}
            bannerUrl={query.data?.animatedBannerURL}
            onClick={openFull}
          />
          <ActionsOverlay>
            <Profile.Actions
              user={props.user}
              member={props.member}
              onClose={props.onClose}
              width={2}
              compact
            />
          </ActionsOverlay>
        </TopArea>

        <Stack>
          <Profile.Bio
            content={query.data?.content}
            onClick={openFull}
            fluid
          />
          <Profile.Roles member={props.member} fluid />
          <Profile.Badges user={props.user} fluid />
          <Show when={props.bot}>
            <Profile.Owner bot={props.bot!} fluid />
          </Show>
          <Profile.Joined user={props.user} member={props.member} fluid />
        </Stack>
      </div>
    </Show>
  );
}

const TopArea = styled("div", {
  base: {
    position: "relative",
  },
});

const ActionsOverlay = styled("div", {
  base: {
    position: "absolute",
    top: "var(--gap-sm)",
    right: "var(--gap-sm)",

    padding: "4px",
    borderRadius: "var(--borderRadius-full)",
    background: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(4px)",
  },
});

const Stack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-lg)",
    padding: "var(--gap-md)",
  },
});
