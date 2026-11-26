import { Trans, useLingui } from "@lingui/solid/macro";
import { IFormControl } from "solid-forms";

import { Bot } from "stoat.js";

import { createProfileResource } from "@revolt/client/resources";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { CategoryButton, Column, Form2, Symbol, useSnackbar } from "@revolt/ui";

import { useSettingsNavigation } from "../../Settings";
import { Discoverable } from "../../shared/Discoverable";
import { UserSummary } from "../account/index";
import { UserProfileEditor } from "../profile/UserProfileEditor";

/**
 * View a specific bot
 */
export function ViewBot(props: { bot: Bot }) {
  // `bot` will never change, so we don't care about reactivity here
  // eslint-disable-next-line solid/reactivity
  const profile = createProfileResource(props.bot.user!);
  const instance = useInstance();
  const { openModal } = useModals();
  const snackbar = useSnackbar();
  const { t } = useLingui();
  const { navigate } = useSettingsNavigation();

  return (
    <Column gap="lg">
      <UserSummary
        user={props.bot.user!}
        showBadges
        bannerUrl={profile.data?.animatedBannerURL}
      />

      <UserProfileEditor
        user={props.bot.user!}
        profile={profile.data}
        attach={[
          {
            name: "public",
            value: props.bot.public,
          },
        ]}
        onSubmit={(g) => {
          props.bot.edit({
            public: (g.controls["public"] as IFormControl<boolean>).value,
          });
        }}
        onReset={(g) => {
          (g.controls["public"] as IFormControl<boolean>).setValue(
            props.bot.public || false,
          );
        }}
      >
        {(g) => (
          <Form2.Checkbox
            control={g.controls["public"] as IFormControl<boolean>}
          >
            <Trans>Allow others to invite your bot</Trans>
          </Form2.Checkbox>
        )}
      </UserProfileEditor>

      <CategoryButton.Group>
        <CategoryButton
          description={
            <Trans>Generate a new token if it gets lost or compromised</Trans>
          }
          icon={<Symbol size={22}>token</Symbol>}
          action="chevron"
          onClick={() => openModal({ type: "reset_bot_token", bot: props.bot })}
        >
          <Trans>Reset Token</Trans>
        </CategoryButton>
        <CategoryButton
          description={<Trans>Change this bot's username</Trans>}
          icon={<Symbol size={22}>badge</Symbol>}
          action="chevron"
          onClick={() =>
            openModal({ type: "edit_bot_username", bot: props.bot })
          }
        >
          <Trans>Change Username</Trans>
        </CategoryButton>
      </CategoryButton.Group>

      <CategoryButton.Group>
        <CategoryButton
          icon={<Symbol size={22}>person_add</Symbol>}
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
          icon={<Symbol size={22}>link</Symbol>}
          action="copy"
          onClick={() => {
            navigator.clipboard.writeText(
              instance.href(`/bot/${props.bot.id}`),
            );
            snackbar.show({
              message: t`Invite URL copied to clipboard`,
              placement: "bottom",
              closeable: true,
            });
          }}
        >
          <Trans>Copy Invite URL</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={22}>content_copy</Symbol>}
          action="copy"
          onClick={() => {
            navigator.clipboard.writeText(props.bot.id);
            snackbar.show({
              message: t`ID copied to clipboard`,
              placement: "bottom",
              closeable: true,
            });
          }}
        >
          <Trans>Copy ID</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={22}>key</Symbol>}
          action="copy"
          onClick={() => {
            navigator.clipboard.writeText(props.bot.token);
            snackbar.show({
              message: t`Token copied to clipboard`,
              placement: "bottom",
              closeable: true,
            });
          }}
        >
          <Trans>Copy Token</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<Symbol size={22}>delete</Symbol>}
          action="chevron"
          onClick={() =>
            openModal({
              type: "delete_bot",
              bot: props.bot,
              onDelete: () => navigate("bots"),
            })
          }
        >
          <Trans>Delete Bot</Trans>
        </CategoryButton>
      </CategoryButton.Group>

      <Discoverable discoverable={props.bot} />
    </Column>
  );
}
