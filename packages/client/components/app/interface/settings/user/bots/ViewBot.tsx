import { Trans } from "@lingui-solid/solid/macro";
import { Bot } from "stoat.js";

import { createProfileResource } from "@revolt/client/resources";
import { useModals } from "@revolt/modal";
import { CategoryButton, Column, iconSize } from "@revolt/ui";

import MdContentCopy from "@material-design-icons/svg/outlined/content_copy.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdKey from "@material-design-icons/svg/outlined/key.svg?component-solid";
import MdLink from "@material-design-icons/svg/outlined/link.svg?component-solid";
import MdPersonAdd from "@material-design-icons/svg/outlined/person_add.svg?component-solid";
import MdPublic from "@material-design-icons/svg/outlined/public.svg?component-solid";
import MdToken from "@material-design-icons/svg/outlined/token.svg?component-solid";

import { UserSummary } from "../account/index";
import { UserProfileEditor } from "../profile/UserProfileEditor";

/**
 * View a specific bot
 */
export function ViewBot(props: { bot: Bot }) {
  // `bot` will never change, so we don't care about reactivity here
  // eslint-disable-next-line solid/reactivity
  const profile = createProfileResource(props.bot.user!);
  const { openModal } = useModals();

  return (
    <Column gap="lg">
      <UserSummary
        user={props.bot.user!}
        showBadges
        bannerUrl={profile.data?.animatedBannerURL}
      />

      <UserProfileEditor user={props.bot.user!} />
      {/* <ErrorBoundary fallback={<>Failed to load profile</>}>
        <Suspense fallback={<>loading...</>}>{profile.data?.content}</Suspense>
      </ErrorBoundary> */}

      <CategoryButton.Group>
        <CategoryButton
          description={
            <Trans>Generate a new token if it gets lost or compromised</Trans>
          }
          icon={<MdToken {...iconSize(22)} />}
          action="chevron"
          onClick={() => openModal({ type: "reset_bot_token", bot: props.bot })}
        >
          <Trans>Reset Token</Trans>
        </CategoryButton>
        <CategoryButton
          description={
            <Trans>
              Allow others to add your bot to their servers from Discover
            </Trans>
          }
          icon={<MdPublic {...iconSize(22)} />}
          action="chevron"
        >
          <Trans>Submit to Discover</Trans>
        </CategoryButton>
      </CategoryButton.Group>

      <CategoryButton.Group>
        <CategoryButton
          icon={<MdPersonAdd {...iconSize(22)} />}
          action="chevron"
          onClick={() =>
            openModal({
              type: "add_bot",
              invite: props.bot.publicBot,
            })
          }
        >
          <Trans>Invite Bot</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<MdLink {...iconSize(22)} />}
          action="copy"
          onClick={() =>
            navigator.clipboard.writeText(
              new URL(`/bot/${props.bot.id}`, window.origin).toString(),
            )
          }
        >
          <Trans>Copy Invite URL</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<MdContentCopy {...iconSize(22)} />}
          action="copy"
          onClick={() => navigator.clipboard.writeText(props.bot.id)}
        >
          <Trans>Copy ID</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<MdKey {...iconSize(22)} />}
          action="copy"
          onClick={() => navigator.clipboard.writeText(props.bot.token)}
        >
          <Trans>Copy Token</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<MdDelete {...iconSize(22)} />}
          action="chevron"
          onClick={() => openModal({ type: "delete_bot", bot: props.bot })}
        >
          <Trans>Delete Bot</Trans>
        </CategoryButton>
      </CategoryButton.Group>
    </Column>
  );
}
