import { BiSolidShield } from "solid-icons/bi";
import { Show } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { User, UserBadges } from "stoat.js";
import { styled } from "styled-system/jsx";

import badgeJoke1 from "../../../../../public/assets/badges/amog.svg";
import badgeJoke2 from "../../../../../public/assets/badges/amorbus.svg";
import badgeDeveloper from "../../../../../public/assets/badges/developer.svg";
import badgeEarlyAdopter from "../../../../../public/assets/badges/early_adopter.svg";
import badgeFounder from "../../../../../public/assets/badges/founder.svg";
import badgeModeration from "../../../../../public/assets/badges/moderation.svg";
import badgePaw from "../../../../../public/assets/badges/paw.svg";
import badgeRaccoon from "../../../../../public/assets/badges/raccoon.svg";
import badgeSupporter from "../../../../../public/assets/badges/supporter.svg";
import badgeTranslator from "../../../../../public/assets/badges/translator.svg";
import { Text } from "../../design";

import { ProfileCard } from "./ProfileCard";

export function ProfileBadges(props: { user: User }) {
  const { t } = useLingui();

  return (
    <Show when={props.user.badges}>
      <ProfileCard>
        <Text class="title" size="large">
          <Trans>Badges</Trans>
        </Text>

        <BadgeRow>
          <Show when={props.user.badges & UserBadges.Founder}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Stoat Founder`,
                },
              }}
              src={badgeFounder}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.Developer}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Stoat Developer`,
                },
              }}
              src={badgeDeveloper}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.Supporter}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Donated to Stoat`,
                },
              }}
              src={badgeSupporter}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.Translator}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Helped translate Stoat`,
                },
              }}
              src={badgeTranslator}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.EarlyAdopter}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`One of the first 1000 users!`,
                },
              }}
              src={badgeEarlyAdopter}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.PlatformModeration}>
            <span
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Platform Moderator`,
                },
              }}
            >
              <img src={badgeModeration} />
            </span>
          </Show>
          <Show when={props.user.badges & UserBadges.ResponsibleDisclosure}>
            <span
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`Responsibly disclosed security issues`,
                },
              }}
            >
              <BiSolidShield />
            </span>
          </Show>
          <Show
            when={props.user.badges & UserBadges.ReservedRelevantJokeBadge1}
          >
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`irrelevant joke badge 1`,
                },
              }}
              src={badgeJoke1}
            />
          </Show>
          <Show
            when={props.user.badges & UserBadges.ReservedRelevantJokeBadge1}
          >
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: t`irrelevant joke badge 2`,
                },
              }}
              src={badgeJoke2}
            />
          </Show>
          <Show when={props.user.badges & UserBadges.Paw}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: "🦊",
                },
              }}
              src={badgePaw}
            />
          </Show>
          <Show when={props.user.id === "01EX2NCWQ0CHS3QJF0FEQS1GR4"}>
            <img
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: "🦝",
                },
              }}
              src={badgeRaccoon}
            />
          </Show>
        </BadgeRow>
      </ProfileCard>
    </Show>
  );
}

const BadgeRow = styled("div", {
  base: {
    gap: "var(--gap-md)",
    display: "flex",
    flexWrap: "wrap",

    "& img, & svg": {
      width: "24px",
      height: "24px",
      aspectRatio: "1/1",
    },
  },
});
