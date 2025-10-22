import { Show } from "solid-js";

import { ServerMember, User } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Avatar, Ripple, UserStatus, typography } from "../../design";
import { Row } from "../../layout";

export function ProfileBanner(props: {
  user: User;
  member?: ServerMember;
  bannerUrl?: string;
  onClick?: (e: MouseEvent) => void;
  onClickAvatar?: (e: MouseEvent) => void;
  width: 2 | 3;
}) {
  return (
    <Banner
      style={{
        "background-image": `linear-gradient(rgba(0, 0, 0, 0.2),rgba(0, 0, 0, 0.7)), url('${props.bannerUrl}')`,
      }}
      isLink={typeof props.onClick !== "undefined"}
      onClick={props.onClick}
      width={props.width}
    >
      <Show when={typeof props.onClick !== "undefined"}>
        <Ripple />
      </Show>

      <Row align gap="lg">
        <Avatar
          src={props.user.animatedAvatarURL}
          size={48}
          holepunch="bottom-right"
          onClick={props.onClickAvatar}
          interactive={props.user.avatar && !!props.onClickAvatar}
          overlay={<UserStatus.Graphic status={props.user.presence} />}
        />
        <UserShort>
          <Show
            when={
              (props.member?.displayName ?? props.user.displayName) !==
              props.user.username
            }
          >
            <span class={css({ fontWeight: 600 })}>
              {props.member?.displayName ?? props.user.displayName}
            </span>
          </Show>
          <span>
            {props.user.username}
            <span class={css({ fontWeight: 200 })}>
              #{props.user.discriminator}
            </span>
          </span>
        </UserShort>
      </Row>
    </Banner>
  );
}

const Banner = styled("div", {
  base: {
    // for <Ripple />:
    position: "relative",

    userSelect: "none",

    height: "120px",
    padding: "var(--gap-lg)",

    display: "flex",
    flexDirection: "column",
    justifyContent: "end",

    backgroundSize: "cover",
    backgroundPosition: "center",

    borderRadius: "var(--borderRadius-xl)",

    color: "white",
  },
  variants: {
    width: {
      3: {
        gridColumn: "1 / 4",
      },
      2: {
        gridColumn: "1 / 3",
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
      },
    },
  },
});

const UserShort = styled("div", {
  base: {
    ...typography.raw(),

    display: "flex",
    lineHeight: "1em",
    gap: "var(--gap-xs)",
    flexDirection: "column",
  },
});
