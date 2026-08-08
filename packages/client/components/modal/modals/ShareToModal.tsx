import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Switch,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { ReactiveMap } from "@solid-primitives/map";
import { Channel } from "stoat.js";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { useError } from "@revolt/i18n";
import { TextWithEmoji } from "@revolt/markdown";
import { useState } from "@revolt/state";
import {
  Avatar,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogProps,
  MenuButton,
  OverflowingText,
  typography,
  UserStatus,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

//location.hash = "";

let files: File[] | undefined;

export const isSharing = () => !!files;

export function ShareToModal(
  props: DialogProps & Modals & { type: "share_to" },
) {
  const { t } = useLingui();
  const nav = useNavigate();
  const state = useState();
  const client = useClient();
  const { lifecycle } = useClientLifecycle();
  const { openModal } = useModals();
  const error = useError();

  const [err, setErr] = createSignal<string>();
  const [stat, setStat] = createSignal(0);
  const conversations = createMemo(() =>
    state.ordering.orderedConversations(client()),
  );
  //TODO Show most recent server channels you were active in
  //server.orderedChannels.flatMap((cat) => cat.channels);

  const shares = new ReactiveMap<string, Channel>();
  let refTest!: HTMLSpanElement,
    run = false;

  createEffect(() => {
    if (run || lifecycle.state() !== State.Connected) return;
    run = true;
    if (files) return setStat(1);
    (async () => {
      try {
        const fNames = (await (
          await fetch("/_share", { method: "PATCH" })
        ).json()) as string[];
        const fData: File[] = [];
        for (let i = 0; i < fNames.length; ++i) {
          const share = await fetch("/_share");
          if (share.status === 404) break; //No more files
          if (share.status !== 200) throw `HTTP Code ${share.status}`;
          fData.push(new File([await share.blob()], fNames[i]));
        }

        if (!fData.length) throw t`No file data found`;
        files = fData;
        setStat(1);
      } catch (e) {
        console.error(e);
        setErr(error(e));
      }
    })();
  });

  function doShare() {
    const first = shares.values().next().value;
    if (!first || !files) return;
    setStat(2);
    nav(first.path);

    //Wait for composer
    let tries = 0;
    const tmr = setInterval(() => {
      if (++tries > 100) {
        clearInterval(tmr);
        setErr(t`Request timed out`);
        setStat(1);
      }
      const composer = state.composer();
      if (!composer) return;
      clearInterval(tmr);
      composer.onFiles(files!, shares.values().toArray());
      files = undefined;
      props.onClose();
    }, 50);
  }

  return (
    <Dialog
      show={props.show}
      onClose={() => {}}
      title={<Trans>Share {(stat(), files?.length) ?? 0} files to...</Trans>}
      actions={[
        {
          text: <Trans>Cancel</Trans>,
          onClick: () => props.onClose(),
        },
        ...(state.auth.hasMultiSession()
          ? [
              {
                text: <Trans>Switch Accounts</Trans>,
                onClick: () => openModal({ type: "swap_user" }),
                isDisabled: !stat(),
              },
            ]
          : []),
        {
          text: <Trans>Share</Trans>,
          onClick: doShare,
          isDisabled: !err() && !shares.size,
        },
      ]}
      isDisabled={stat() > 1}
      noScroll={true}
    >
      <span ref={refTest} />
      <Switch fallback={<CircularProgress />}>
        <Match when={err()}>
          <div style={{ color: "var(--md-sys-color-error)" }}>{err()}</div>
        </Match>
        <Match when={stat()}>
          {/* TODO Search box? */}
          <VirtualContainer
            items={conversations()}
            scrollTarget={refTest.parentElement!}
            itemSize={{ height: 48 }}
          >
            {(item) => (
              <div
                style={{
                  ...item.style,
                  width: "100%",
                  "padding-block": "3px",
                }}
              >
                <Entry channel={item.item} shares={shares} />
              </div>
            )}
          </VirtualContainer>
        </Match>
      </Switch>
    </Dialog>
  );
}

function Entry(props: {
  channel: Channel;
  shares: ReactiveMap<string, Channel>;
}) {
  const [check, setCheck] = createSignal(false);

  return (
    <MenuButton
      onClick={(e: Event) => {
        e.preventDefault();
        const on = !check();
        if (on) props.shares.set(props.channel.id, props.channel);
        else props.shares.delete(props.channel.id);
        setCheck(on);
      }}
      size="normal"
      attention={
        props.channel.muted
          ? "muted"
          : props.channel.unread
            ? "active"
            : "normal"
      }
      icon={
        <>
          <Checkbox checked={check()} />
          <Switch>
            <Match when={props.channel.type === "Group"}>
              <Avatar
                size={32}
                shape="rounded-square"
                fallback={props.channel.name}
                src={props.channel.iconURL}
                primaryContrast
              />
            </Match>
            <Match when={props.channel.type === "DirectMessage"}>
              <Avatar
                size={32}
                src={props.channel.iconURL}
                holepunch="bottom-right"
                overlay={
                  <UserStatus.Graphic
                    status={props.channel?.recipient?.presence}
                  />
                }
              />
            </Match>
          </Switch>
        </>
      }
    >
      <Switch>
        <Match when={props.channel.type === "Group"}>
          <OverflowingText>
            <TextWithEmoji content={props.channel.name!} />
          </OverflowingText>
          <span class={typography({ class: "_status" })}>
            {props.channel.recipientIds.size}{" "}
            {props.channel.recipientIds.size > 1 ? `Members` : "Member"}
          </span>
        </Match>
        <Match when={props.channel.type === "DirectMessage"}>
          <OverflowingText>
            {props.channel?.recipient?.displayName}
          </OverflowingText>
        </Match>
      </Switch>
    </MenuButton>
  );
}

/*function Entry(
  props: { channel: Channel; active: boolean } & Pick<Props, "menuGenerator">,
) {
  const state = useState();
  const voice = useVoice();
  const { openModal } = useModals();
  const { isMobile } = useDevice();

  const canEditChannel = createMemo(() =>
    (["ManageChannel", "ManagePermissions", "ManageWebhooks"] as const).some(
      (perm) => props.channel.server?.havePermission(perm),
    ),
  );

  const canInvite = createMemo(() =>
    props.channel.server?.havePermission("InviteOthers"),
  );

  const alertState = createMemo(
    () =>
      !props.active &&
      props.channel.unread &&
      (props.channel.mentions?.size || true),
  );

  const inCall = () => props.channel.id === voice.channel()?.id;

  const attentionState = createMemo(() =>
    props.active
      ? "selected"
      : inCall()
        ? "active"
        : state.notifications.isChannelMuted(props.channel)
          ? "muted"
          : props.channel.unread
            ? "active"
            : "normal",
  );

  return (
    <Column gap="sm">
      <MenuButton
        href={`/server/${props.channel.serverId}/channel/${props.channel.id}`}
        use:floating={props.menuGenerator(props.channel)}
        size="normal"
        alert={alertState()}
        attention={attentionState()}
        icon={
          <>
            <Switch fallback={<Symbol>grid_3x3</Symbol>}>
              <Match when={props.channel.isVoice}>
                <Symbol
                  color={inCall() ? "var(--md-sys-color-primary)" : undefined}
                >
                  headset_mic
                </Symbol>
              </Match>
            </Switch>
            <Show when={props.channel.icon}>
              <ChannelIcon
                src={props.channel.iconURL}
                css={{ marginEnd: "0.2em" }}
              />
            </Show>
          </>
        }
        actions={
          <Show when={!isMobile}>
            <Show when={canInvite()}>
              <a
                use:floating={{
                  tooltip: { placement: "top", content: "Create Invite" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  openModal({
                    type: "create_invite",
                    channel: props.channel,
                  });
                }}
              >
                <Symbol size={16} fill>
                  person_add
                </Symbol>
              </a>
            </Show>
            <Show when={canEditChannel()}>
              <a
                use:floating={{
                  tooltip: { placement: "top", content: "Edit Channel" },
                }}
                onClick={(e) => {
                  e.preventDefault();
                  openModal({
                    type: "settings",
                    config: "channel",
                    context: props.channel,
                  });
                }}
              >
                <Symbol size={16} fill>
                  settings
                </Symbol>
              </a>
            </Show>
          </Show>
        }
      >
        <OverflowingText>
          <TextWithEmoji content={props.channel.name!} />
        </OverflowingText>
      </MenuButton>

      <VoiceChannelPreview channel={props.channel} />
    </Column>
  );
}*/
