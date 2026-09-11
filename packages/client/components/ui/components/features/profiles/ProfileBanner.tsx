import { Show, createSignal } from "solid-js";

import { ServerMember, User } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useLingui } from "@lingui/solid/macro";
import { OverflowingText, Tooltip } from "@revolt/ui";
import { Avatar, Ripple, UserStatus, typography } from "../../design";
import { Row } from "../../layout";

export function ProfileBanner(props: {
  user: User;
  member?: ServerMember;
  bannerUrl?: string;
  onClick?: (e: MouseEvent) => void;
  onClickAvatar?: (e: MouseEvent) => void;
  width: 2 | 3;
  /**
   * Discord-style layout: avatar overlaps the bottom edge of the banner
   * and the name block is rendered underneath, instead of inline.
   */
  overlap?: boolean;
}) {
  const { t } = useLingui();

  const [isCopied, setIsCopied] = createSignal(false);

  function copyUsername() {
    navigator.clipboard.writeText(
      `${props.user.username}#${props.user.discriminator}`,
    );
  }

  function onUsernameClick(e: MouseEvent) {
    e.stopPropagation();
    copyUsername();
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }

  const pronouns = () => props.member?.pronouns ?? props.user.pronouns;

  const showDisplayName = () =>
    (props.member?.displayName ?? props.user.displayName) !==
    props.user.username;

  const usernameBlock = (
    <Row>
      <UsernameContainer>
        <Tooltip
          content={isCopied() ? t`Copied!` : t`Click to copy username`}
          placement="top"
        >
          <Username onClick={onUsernameClick}>
            {props.user.username}
            <LowEmphasis>#{props.user.discriminator}</LowEmphasis>
          </Username>
        </Tooltip>
      </UsernameContainer>
      <Pronouns>
        <OverflowingText>
          <LowEmphasis>{pronouns() ?? ""}</LowEmphasis>
        </OverflowingText>
      </Pronouns>
    </Row>
  );

  if (props.overlap) {
    return (
      <OverlapWrap>
        <FlatBanner
          style={{
            "background-image": `url('${props.bannerUrl}')`,
          }}
          isLink={typeof props.onClick !== "undefined"}
          onClick={props.onClick}
        >
          <Show when={typeof props.onClick !== "undefined"}>
            <Ripple />
          </Show>
        </FlatBanner>

        <AvatarRing>
          <Avatar
            src={props.user.animatedAvatarURL}
            size={80}
            holepunch="bottom-right"
            onClick={props.onClickAvatar}
            interactive={props.user.avatar && !!props.onClickAvatar}
            overlay={<UserStatus.Graphic status={props.user.presence} />}
          />
        </AvatarRing>

        <Show when={props.user.status?.text}>
          <StatusBubble>{props.user.status?.text}</StatusBubble>
        </Show>

        <OverlapDetails>
          <Show when={showDisplayName()}>
            <span class={css({ fontWeight: 700, fontSize: "1.1rem" })}>
              {props.member?.displayName ?? props.user.displayName}
            </span>
          </Show>
          {usernameBlock}
        </OverlapDetails>
      </OverlapWrap>
    );
  }

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
        <UserDetails>
          <Show when={showDisplayName()}>
            <span class={css({ fontWeight: 600 })}>
              {props.member?.displayName ?? props.user.displayName}
            </span>
          </Show>
          {usernameBlock}
        </UserDetails>
      </Row>
    </Banner>
  );
}

const OverlapWrap = styled("div", {
  base: {
    position: "relative",
  },
});

const FlatBanner = styled("div", {
  base: {
    position: "relative",
    height: "100px",
    backgroundColor: "var(--md-sys-color-surface-container-highest)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderRadius: "var(--borderRadius-lg) var(--borderRadius-lg) 0 0",
  },
  variants: {
    isLink: {
      true: {
        cursor: "pointer",
      },
    },
  },
});

const AvatarRing = styled("div", {
  base: {
    position: "absolute",
    top: "60px",
    left: "var(--gap-lg)",
    display: "flex",
    padding: "4px",
    borderRadius: "var(--borderRadius-circle)",
    background: "var(--md-sys-color-surface-container-high)",
  },
});

const StatusBubble = styled("div", {
  base: {
    position: "absolute",
    top: "56px",
    left: "calc(var(--gap-lg) + 96px)",
    maxWidth: "170px",
    zIndex: 1,

    padding: "6px 10px",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container-highest)",
    boxShadow: "0 4px 12px -4px rgba(0, 0, 0, 0.4)",

    fontSize: "0.8125rem",
    lineHeight: "1.1rem",
    overflowWrap: "anywhere",
    userSelect: "text",

    "&::after": {
      content: "''",
      position: "absolute",
      left: "-6px",
      top: "16px",
      width: 0,
      height: 0,
      borderTop: "6px solid transparent",
      borderBottom: "6px solid transparent",
      borderRight: "6px solid var(--md-sys-color-surface-container-highest)",
    },
  },
});

const OverlapDetails = styled("div", {
  base: {
    ...typography.raw(),

    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)",

    padding: "var(--gap-lg)",
    paddingTop: "44px",
  },
});

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

const UserDetails = styled("div", {
  base: {
    ...typography.raw(),

    flexGrow: 1,
    display: "flex",
    lineHeight: "1rem",
    gap: "var(--gap-xs)",
    flexDirection: "column",
  },
});

const UsernameContainer = styled("div", {
  base: {
    flexShrink: 0,
  },
});

const Username = styled("span", {
  base: {
    _hover: {
      textDecoration: "underline",
    },
  },
});

const LowEmphasis = styled("span", {
  base: {
    fontWeight: 200,
  },
});

const Pronouns = styled("div", {
  base: {
    ...typography.raw(),
    minWidth: 0,
    flexGrow: 1,
    lineHeight: "1rem",
    gap: "var(--gap-xs)",
    textAlign: "right",
  },
});
