import { JSX } from "solid-js";

import { useQuery } from "@tanstack/solid-query";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

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
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",

    width: "340px",
    height: "400px",

    borderRadius: "var(--borderRadius-xl)",
  },
});

/**
 * User Card
 */
export function UserCard(
  props: JSX.Directives["floating"]["userCard"] &
    object & { onClose: () => void },
) {
  const { openModal } = useModals();
  const query = useQuery(() => ({
    queryKey: ["profile", props.user.id],
    queryFn: () => props.user.fetchProfile(),
  }));

  function openFull() {
    openModal({ type: "user_profile", user: props.user, member: props.member });
    props.onClose();
  }

  return (
    <div
      use:invisibleScrollable={{ class: base() }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
      }}
    >
      <Grid>
        <Profile.Banner
          width={2}
          user={props.user}
          member={props.member}
          bannerUrl={query.data?.animatedBannerURL}
          onClick={openFull}
        />

        <Profile.Actions user={props.user} member={props.member} width={2} />
        <Profile.Roles member={props.member} />
        <Profile.Badges user={props.user} />
        <Profile.Status user={props.user} />
        <Profile.Joined user={props.user} member={props.member} />
        <Profile.Bio content={query.data?.content} onClick={openFull} />
      </Grid>
    </div>
  );
}

const Grid = styled("div", {
  base: {
    display: "grid",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    gridTemplateColumns: "repeat(2, 1fr)",
  },
});
