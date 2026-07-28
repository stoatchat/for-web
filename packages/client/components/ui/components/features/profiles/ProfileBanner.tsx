import { Show, createSignal } from "solid-js";

import { ServerMember, User } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useLingui } from "@lingui-solid/solid/macro";
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
        </UserDetails>
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
