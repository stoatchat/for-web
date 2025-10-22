import { Show } from "solid-js";

import { User } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useTime } from "@revolt/i18n";
import { Avatar, CategoryButton, IconButton, iconSize } from "@revolt/ui";

import MdCakeFill from "@material-design-icons/svg/filled/cake.svg?component-solid";
import MdEdit from "@material-design-icons/svg/outlined/edit.svg?component-solid";

export function UserSummary(props: {
  user: User;
  showBadges?: boolean;
  bannerUrl?: string;
  onEdit?: () => void;
}) {
  const dayjs = useTime();
  const bannerStyle = () =>
    props.bannerUrl
      ? {
          "background-image": `linear-gradient(color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent), color-mix(in srgb, var(--md-sys-color-surface-container-low) 70%, transparent)), url("${props.bannerUrl}")`,
          color: "black",
        }
      : {
          background: `var(--md-sys-color-primary-container)`,
          color: "var(--md-sys-color-on-primary)",
        };

  return (
    <CategoryButton.Group>
      <AccountBox style={bannerStyle()}>
        <ProfileDetails>
          <Avatar src={props.user.animatedAvatarURL} size={58} />
          <Username>
            <span>{props.user.displayName}</span>
            <span>
              {props.user.username}#{props.user.discriminator}
            </span>
          </Username>
          <Show when={props.onEdit}>
            <IconButton variant="filled" shape="square" onPress={props.onEdit}>
              <MdEdit />
            </IconButton>
          </Show>
        </ProfileDetails>
        <Show when={props.showBadges}>
          <BottomBar>
            <DummyPadding />
            {/* <ProfileBadges>
              <MdDraw {...iconSize(20)} />
              <MdDraw {...iconSize(20)} />
              <MdDraw {...iconSize(20)} />
            </ProfileBadges> */}
            <ProfileBadges>
              <span
                use:floating={{
                  tooltip: {
                    placement: "top",
                    // todo
                    content: dayjs(props.user.createdAt).format(
                      "[Account created] Do MMMM YYYY [at] HH:mm",
                    ),
                  },
                }}
              >
                <MdCakeFill {...iconSize(14)} />
              </span>
            </ProfileBadges>
          </BottomBar>
        </Show>
      </AccountBox>
    </CategoryButton.Group>
  );
}

const AccountBox = styled("div", {
  base: {
    display: "flex",
    padding: "var(--gap-lg)",
    flexDirection: "column",

    backgroundSize: "cover",
    backgroundPosition: "center",
  },
});

const ProfileDetails = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-lg)",
    alignItems: "center",
  },
});

const Username = styled("div", {
  base: {
    flexGrow: 1,

    display: "flex",
    flexDirection: "column",

    color: "var(--md-sys-color-on-secondary-container)",

    // Display Name
    "& :nth-child(1)": {
      fontSize: "18px",
      fontWeight: 600,
    },

    // Username#Discrim
    "& :nth-child(2)": {
      fontSize: "14px",
      fontWeight: 400,
    },
  },
});

const BottomBar = styled("div", {
  base: {
    display: "flex",
  },
});

const DummyPadding = styled("div", {
  base: {
    flexShrink: 0,
    // Matches with avatar size
    width: "58px",
    // Matches with ProfileDetails
    marginInlineEnd: "var(--gap-lg)",
  },
});

const ProfileBadges = styled("div", {
  base: {
    display: "flex",
    gap: "var(--gap-sm)",
    width: "fit-content",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-md)",

    fill: "var(--md-sys-color-on-secondary)",
    background: "var(--md-sys-color-secondary)",
  },
});
