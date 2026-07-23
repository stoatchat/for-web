import { JSX, Show, splitProps } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { cva } from "styled-system/css";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { useClient } from "@revolt/client";
import { STOAT_HOST } from "@revolt/common/lib/env";
import { DefaultHost, useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { paramsFromPathname } from "@revolt/routing";
import { useState } from "@revolt/state";
import { Avatar, iconSize } from "@revolt/ui";
import { Invite } from "@revolt/ui/components/features/messaging/elements/Invite";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdChat from "@material-design-icons/svg/outlined/chat.svg?component-solid";
import MdChevronRight from "@material-design-icons/svg/outlined/chevron_right.svg?component-solid";
import MdPeople from "@material-design-icons/svg/outlined/people.svg?component-solid";

const link = cva({
  base: {
    cursor: "pointer",
    color: "var(--md-sys-color-primary) !important",
  },
});

const internalLink = cva({
  base: {
    verticalAlign: "bottom",

    gap: "4px",
    paddingLeft: "2px",
    paddingRight: "6px",
    alignItems: "center",
    display: "inline-flex",
    textDecoration: "none !important",

    cursor: "pointer",
    fontWeight: 600,
    borderRadius: "var(--borderRadius-lg)",
    fill: "var(--md-sys-color-on-primary)",
    color: "var(--md-sys-color-on-primary)",
    background: "var(--md-sys-color-primary)",
  },
});

function inAppScope(link: URL, root: string): boolean {
  return (
    [
      root,
      "https://stoat.chat",
      "https://beta.stoat.chat",
      "https://old.stoat.chat",
      "https://revolt.chat",
      "https://app.revolt.chat",
    ].includes(link.origin) &&
    /\/(i|app|home|pwa|dev|invite|bot|friends|server|channel)\/?/.test(
      link.pathname,
    )
  );
}

export function RenderAnchor(
  props: { disabled?: boolean } & JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  /* eslint-disable solid/reactivity */
  /* eslint-disable solid/components-return-once */

  const [localProps, remoteProps] = splitProps(props, [
    "href",
    "target",
    "disabled",
  ]);

  const instance = useInstance();

  // Handle empty link
  if (!localProps.href) return <span>{remoteProps.children}</span>;

  // Test internal link
  try {
    let url = new URL(localProps.href);

    // Only allow http, https, mailto, and tel protocols
    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:" &&
      url.protocol !== "mailto:" &&
      url.protocol !== "tel:"
    ) {
      return <span>{remoteProps.children}</span>;
    }

    // Remap discover links to native links
    if (url.origin === "https://rvlt.gg" || url.origin === "https://stt.gg") {
      if (/^\/[\w\d]+$/.test(url.pathname)) {
        url = new URL(`/invite${url.pathname}`, instance.origin);
      } else if (url.pathname.startsWith("/discover")) {
        url = new URL(url.pathname, instance.origin);
      }
    }

    // Determine whether it's in our scope
    if (inAppScope(url, instance.origin)) {
      const client = useClient(),
        params = paramsFromPathname(url.pathname);

      params.host ||= STOAT_HOST;
      const remote = params.host !== (instance.host || DefaultHost);

      if (params.exactChannel) {
        const channel = () => client().channels.get(params.channelId!);
        const internalUrl = () =>
          new URL(
            `/i/${params.host}` +
              (channel()?.serverId ? `/server/${channel()!.serverId}` : "") +
              `/channel/${params.channelId}` +
              (params.exactMessage && params.messageId
                ? `/${params.messageId}`
                : ""),
            location.origin,
          ).href;

        return (
          <Show
            when={remote || channel()}
            fallback={
              <span class={internalLink()}>
                <Symbol>tag</Symbol>
                <Trans>Private Channel</Trans>
              </span>
            }
          >
            <LinkComponent
              class={internalLink()}
              disabled={props.disabled}
              href={internalUrl()}
            >
              <Symbol>tag</Symbol>
              {remote ? <Trans>Remote Channel</Trans> : channel()!.name}
              {params.exactMessage && (
                <>
                  <MdChevronRight {...iconSize("1em")} />
                  <MdChat {...iconSize("1em")} />
                </>
              )}
            </LinkComponent>
          </Show>
        );
      } else if (params.exactServer) {
        const server = () => client().servers.get(params.serverId!);
        const internalUrl = () =>
          new URL(
            `/i/${params.host}/server/${params.serverId}`,
            location.origin,
          ).href;

        return (
          <Show
            when={remote || server()}
            fallback={
              <span class={internalLink()}>
                <MdPeople {...iconSize("1em")} />
                <Trans>Unknown Server</Trans>
              </span>
            }
          >
            <LinkComponent
              class={internalLink()}
              disabled={props.disabled}
              href={internalUrl()}
            >
              {remote ? (
                <>
                  <MdPeople {...iconSize("1em")} />
                  <Trans>Remote Server</Trans>
                </>
              ) : (
                <>
                  <Avatar size={16} src={server()!.iconURL} />
                  {server()!.name}
                </>
              )}
            </LinkComponent>
          </Show>
        );
      } else if (
        params.inviteId &&
        // only display invites if it is just the plain link:
        Array.isArray(remoteProps.children) &&
        remoteProps.children[0] === localProps.href &&
        !localProps.disabled
      ) {
        return <Invite code={params.inviteId} />;
      } else {
        const internalUrl = () =>
          new URL(url.pathname, location.origin).toString();

        return (
          <LinkComponent
            {...remoteProps}
            class={link()}
            disabled={localProps.disabled}
            href={internalUrl()}
          />
        );
      }
    }

    // All other links
    const state = useState();
    const { openModal } = useModals();

    function onHandleWarning(
      event: MouseEvent & { currentTarget: HTMLAnchorElement },
    ) {
      if (event.button === 0 || event.button === 1) {
        event.preventDefault();
        event.stopPropagation();

        openModal({
          type: "link_warning",
          url,
          display: event.currentTarget!.innerText,
        });
      }
    }

    return (
      <Show
        when={state.linkSafety.isTrusted(url)}
        fallback={
          <LinkComponent
            {...remoteProps}
            class={link()}
            dest={localProps.href}
            disabled={localProps.disabled}
            onClick={onHandleWarning}
            onAuxClick={onHandleWarning}
          />
        }
      >
        <LinkComponent
          {...remoteProps}
          class={link()}
          disabled={localProps.disabled}
          dest={localProps.href}
          href={localProps.href}
          target={"_blank"}
          rel="noreferrer"
        />
      </Show>
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    // invalid URL
    return <span>{props.children}</span>;
  }
}

function LinkComponent(
  props: {
    disabled?: boolean;
    dest?: string;
  } & JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
) {
  const { message, reactPicker } = useMessage();
  const [localProps, remoteProps] = splitProps(props, ["disabled", "dest"]);
  if (localProps.disabled) {
    return <span class={remoteProps.class}>{remoteProps.children}</span>;
  }
  return (
    <a
      use:floating={
        message
          ? {
              contextMenu: () => (
                <MessageContextMenu
                  message={message}
                  reactPicker={reactPicker}
                  link={localProps.dest}
                />
              ),
            }
          : undefined
      }
      {...remoteProps}
    />
  );
}
