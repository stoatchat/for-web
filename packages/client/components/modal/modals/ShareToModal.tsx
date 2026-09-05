import { useNavigate } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";

import { Plural, Trans, useLingui } from "@lingui/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { ReactiveMap } from "@solid-primitives/map";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { ChannelIcon } from "@revolt/common";
import { useError } from "@revolt/i18n";
import { TextWithEmoji } from "@revolt/markdown";
import { useState } from "@revolt/state";
import {
  Checkbox,
  CircularProgress,
  Dialog,
  DialogProps,
  MenuButton,
  Symbol,
  TextField,
  typography,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

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
  const [filter, setFilter] = createSignal("");

  const chatsAll = createMemo(
    () =>
      client()
        .channels.toList()
        .filter((c) => c.type !== "SavedMessages"),
    //TODO Bizarre bug preventing sort by recent
    //.sort((a, b) => +b.updatedAt - +a.updatedAt)
  );

  const chats = createMemo(() => {
    const filterLower = filter().toLowerCase();
    return chatsAll().filter((c) =>
      (c.recipient?.displayName ?? c.name).toLowerCase().includes(filterLower),
    );
  });

  const shares = new ReactiveMap<string, Channel>();
  let scrollRef!: HTMLDivElement,
    run = false;

  createEffect(() => {
    if (run || lifecycle.state() !== State.Connected) return;
    run = true;
    if (files) return setStat(1);
    (async () => {
      try {
        const fRes = await fetch("/_share", { method: "PATCH" }),
          fData: File[] = [];
        if (fRes.status === 200) {
          const fNames = (await fRes.json()) as string[];
          for (let i = 0; i < fNames.length; ++i) {
            const share = await fetch("/_share");
            if (share.status === 404) break; //No more files
            if (share.status !== 200) throw `HTTP Code ${share.status}`;
            fData.push(new File([await share.blob()], fNames[i]));
          }
        }

        // fData.push(new File(["test data"], "test.txt")); //TODO TEMP
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
      minHeight={400}
      show={props.show}
      onClose={() => {}}
      title={
        <>
          <Plural
            value={stat()}
            _0="Loading shares"
            one="Share # file"
            other="Share # files"
          />
          <Plural
            value={shares.size}
            _0=""
            one=" to # chat"
            other=" to # chats"
          />
          ...
        </>
      }
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
      hasScroll={true}
    >
      <TextField
        value={filter()}
        variant="filled"
        style={{ "margin-bottom": "var(--gap-md)" }}
        placeholder={t`Search for chats...`}
        onKeyUp={(e) => setFilter(e.currentTarget.value)}
      />
      <Switch fallback={<CircularProgress />}>
        <Match when={err()}>
          <div style={{ color: "var(--md-sys-color-error)" }}>{err()}</div>
        </Match>
        <Match when={stat()}>
          <div ref={scrollRef} use:scrollable>
            <VirtualContainer
              items={chats()}
              scrollTarget={scrollRef}
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
          </div>
        </Match>
      </Switch>
    </Dialog>
  );
}

function Entry(props: {
  channel: Channel;
  shares: ReactiveMap<string, Channel>;
}) {
  const check = createMemo(() => props.shares.has(props.channel.id));

  return (
    <MenuButton
      onClick={(e: Event) => {
        e.preventDefault();
        const on = !check();
        if (on) props.shares.set(props.channel.id, props.channel);
        else props.shares.delete(props.channel.id);
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
          <ChannelIcon channel={props.channel} />
        </>
      }
    >
      <ChannelName twoLine={props.channel.type === "TextChannel"}>
        <Show
          when={props.channel.type === "TextChannel"}
          fallback={props.channel?.recipient?.displayName}
        >
          <Show when={props.channel.server}>
            <div>
              <TextWithEmoji content={props.channel.server?.name} />
              <Symbol size={16} display="" verticalAlign="middle">
                chevron_right
              </Symbol>
            </div>
          </Show>
          <div>
            <TextWithEmoji content={props.channel.name} />
          </div>
        </Show>
      </ChannelName>
      <Show when={props.channel.type === "Group"}>
        <span class={typography({ class: "_status" })}>
          {props.channel.recipientIds.size}{" "}
          {props.channel.recipientIds.size > 1 ? `Members` : "Member"}
        </span>
      </Show>
    </MenuButton>
  );
}

const ChannelName = styled("div", {
  base: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    "& *": {
      overflow: "hidden",
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
    },
  },
  variants: {
    twoLine: {
      true: {
        height: "42px",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
      },
    },
  },
});
