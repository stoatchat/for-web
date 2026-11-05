import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Server } from "stoat.js";
import { css } from "styled-system/css";

import { useClient, useClientLifecycle } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useUser } from "@revolt/markdown/users";
import { useModals } from "@revolt/modal";
import { fetchLatestChangelog } from "@revolt/modal/modals/Changelog";
import { ColouredText, Column, Symbol, Text } from "@revolt/ui";

import pkg from "../../../../../../package.json";

import { SettingsConfiguration } from ".";
import { AccountCard, BackCard } from "./user/_AccountCard";
import { MyAccount } from "./user/Account";
import AdvancedSettings from "./user/Advanced";
import { AppearanceMenu } from "./user/appearance";
import { MyBots, ViewBot } from "./user/bots";
import { Feedback } from "./user/Feedback";
import { LanguageSettings } from "./user/Language";
import Native from "./user/Native";
import Notifications from "./user/notifications/Notifications";
import { EditProfile } from "./user/profile";
import { Sessions } from "./user/Sessions";
import { EditSubscription } from "./user/subscriptions";
import { VoiceSettings } from "./user/voice/VoiceSettings";

const Config: SettingsConfiguration<{ server: Server }> = {
  /**
   * Page titles
   * @param key
   */
  title(ctx, key) {
    if (key.startsWith("bots/")) {
      const user = useUser(key.substring(5));
      return user()!.username;
    }

    return ctx.entries
      .flatMap((category) => category.entries)
      .find((entry) => entry.id === key)?.title as string;
  },

  /**
   * Render the current client settings page
   */
  // we take care of the reactivity ourselves
  /* eslint-disable solid/reactivity */
  /* eslint-disable solid/components-return-once */
  render(props) {
    const id = props.page();
    const client = useClient();

    if (id?.startsWith("bots/")) {
      const bot = client().bots.get(id.substring("bots/".length))!;
      return <ViewBot bot={bot!} />;
    }

    switch (id) {
      case "account":
        return <MyAccount onClose={props.onClose} />;
      case "appearance":
        return <AppearanceMenu />;
      case "advanced":
        return <AdvancedSettings />;
      case "profile":
        return <EditProfile />;
      case "sessions":
        return <Sessions />;
      case "bots":
        return <MyBots />;
      case "language":
        return <LanguageSettings />;
      case "feedback":
        return <Feedback />;
      case "subscribe":
        return <EditSubscription />;
      case "native":
        return <Native />;
      case "voice":
        return <VoiceSettings />;
      case "notifications":
        return <Notifications isDesktop={!!window.native} />;
      default:
        return null;
    }
  },
  /* eslint-enable solid/reactivity */
  /* eslint-enable solid/components-return-once */

  /**
   * Generate list of categories / entries for client settings
   * @returns List
   */
  list(_, onClose) {
    const { pop, openModal } = useModals();
    const { logout } = useClientLifecycle();
    const { limits, config } = useInstance();

    return {
      context: null!,
      prepend: (
        <Column gap="s">
          <BackCard onClose={onClose} />
          <AccountCard />
          <div />
        </Column>
      ),
      append: (
        <Column gap="none">
          <Text class="label">
            <span class={css({ userSelect: "none", fontWeight: "bold" })}>
              <Trans>Version:</Trans>
            </span>{" "}
            <span class={css({ userSelect: "all" })}>{pkg.version}</span>
          </Text>
          <Show when={window.native}>
            <Text class="label">
              Stoat for Desktop {window.native.versions.desktop()}
            </Text>
            <Text class="label">
              <span
                class={css({
                  fontSize: "0.8em",
                  lineHeight: "0.8em",
                  opacity: "0.5",
                })}
              >
                {window.native.versions.electron()},{" "}
                {window.native.versions.node()},{" "}
                {window.native.versions.chrome()}
              </span>
            </Text>
          </Show>
          <Show when={config.features.legal_links}>
            {(links) => (
              <Text class="label">
                <span
                  class={css({
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5em",
                    opacity: "0.5",
                    "& a": {
                      color: "inherit",
                      textDecoration: "none",
                      "&:hover": { textDecoration: "underline" },
                    },
                  })}
                >
                  <Show when={links().terms_of_service}>
                    <a
                      href={links().terms_of_service}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Terms</Trans>
                    </a>
                  </Show>
                  <Show when={links().privacy_policy}>
                    <a
                      href={links().privacy_policy}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Privacy</Trans>
                    </a>
                  </Show>
                  <Show when={links().guidelines}>
                    <a
                      href={links().guidelines}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Trans>Guidelines</Trans>
                    </a>
                  </Show>
                </span>
              </Text>
            )}
          </Show>
        </Column>
      ),
      entries: [
        {
          title: <Trans>User Settings</Trans>,
          entries: [
            {
              id: "account",
              icon: <></>,
              title: <></>,
              hidden: true,
            },
            {
              id: "profile",
              icon: <Symbol size={20}>account_circle</Symbol>,
              title: <Trans>Profile</Trans>,
            },
            {
              id: "sessions",
              icon: <Symbol size={20}>verified_user</Symbol>,
              title: <Trans>Sessions</Trans>,
            },
          ],
        },
        {
          title: "Stoat",
          entries: [
            {
              id: "bots",
              icon: <Symbol size={20}>smart_toy</Symbol>,
              title: <Trans>My Bots</Trans>,
            },
            {
              id: "feedback",
              icon: <Symbol size={20}>rate_review</Symbol>,
              title: <Trans>Feedback</Trans>,
            },
          ],
        },
        {
          title: <Trans>Subscriptions</Trans>,
          hidden: import.meta.env.PROD,
          entries: [
            {
              id: "subscribe",
              icon: <Symbol size={20}>workspace_premium</Symbol>,
              title: "[premium]",
            },
          ],
        },
        {
          title: <Trans>Client Settings</Trans>,
          entries: [
            // {
            //   id: "audio",
            //   icon: <MdSpeaker {...iconSize(20)} />,
            //   title: t("app.settings.pages.audio.title"),
            //   hidden:
            //     !getController("state").experiments.isEnabled("voice_chat"),
            // },
            {
              id: "voice",
              icon: <Symbol size={20}>mic</Symbol>,
              title: limits().video ? (
                <Trans>Voice & Video</Trans>
              ) : (
                <Trans>Voice</Trans>
              ),
            },
            {
              id: "appearance",
              icon: <Symbol size={20}>palette</Symbol>,
              title: <Trans>Appearance</Trans>,
            },
            // {
            //   id: "accessibility",
            //   icon: <MdAccessibility {...iconSize(20)} />,
            //   title: t("app.settings.pages.accessibility.title"),
            // },
            // {
            //   id: "plugins",
            //   icon: <MdExtension {...iconSize(20)} />,
            //   title: t("app.settings.pages.plugins.title"),
            //   hidden: !getController("state").experiments.isEnabled("plugins"),
            // },
            {
              id: "notifications",
              icon: <Symbol size={20}>notifications</Symbol>,
              title: <Trans>Notifications</Trans>,
            },
            // {
            //   id: "keybinds",
            //   icon: <MdKeybinds {...iconSize(20)} />,
            //   title: t("app.settings.pages.keybinds.title"),
            // },
            {
              id: "language",
              icon: <Symbol size={20}>language</Symbol>,
              title: <Trans>Language</Trans>,
            },
            // {
            //   id: "sync",
            //   icon: <MdSync {...iconSize(20)} />,
            //   title: t("app.settings.pages.sync.title"),
            // },
            {
              id: "native",
              hidden: !window.native,
              icon: <Symbol size={20}>desktop_windows</Symbol>,
              title: <Trans>Desktop</Trans>,
            },
            // {
            //   id: "experiments",
            //   icon: <MdScience {...iconSize(20)} />,
            //   title: <Trans>Experiments</Trans>,
            // },
          ],
        },
        {
          entries: [
            {
              onClick: async () => {
                const changelog = await fetchLatestChangelog();
                if (!changelog) return;
                openModal({ type: "changelog", changelog });
              },
              icon: <Symbol size={20}>campaign</Symbol>,
              title: <Trans>What's New</Trans>,
            },
            {
              href: "https://github.com/stoatchat",
              icon: <Symbol size={20}>memory</Symbol>,
              title: <Trans>Source Code</Trans>,
            },
            {
              id: "advanced",
              icon: <Symbol size={20}>science</Symbol>,
              title: <Trans>Advanced</Trans>,
            },
            {
              href: "https://ko-fi.com/stoatchat",
              icon: <Symbol size={20}>coffee</Symbol>,
              title: <Trans>Donate</Trans>,
            },
            {
              id: "logout",
              icon: (
                <Symbol size={20} color="var(--md-sys-color-error)">
                  logout
                </Symbol>
              ),
              title: (
                <ColouredText colour="var(--md-sys-color-error)">
                  <Trans>Log Out</Trans>
                </ColouredText>
              ),
              onClick() {
                pop();
                logout();
              },
            },
          ],
        },
      ],
    };
  },
};

export default Config;
