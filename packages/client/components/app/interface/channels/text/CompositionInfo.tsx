import { createCountdownFromNow } from "@solid-primitives/date";
import { For, Match, Show, Switch, createMemo, onMount } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { createResizeObserver } from "@solid-primitives/resize-observer";
import { Channel, User } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useDurationFormat } from "@revolt/i18n/durations";
import { useUsers } from "@revolt/markdown/users";
import { Avatar, OverflowingText, Symbol, typography } from "@revolt/ui";

interface Props {
  channel: Channel;
  infoText?: string;
  scrollRef?: HTMLElement | null;
}

/**
 * Display composition
 */
export function CompositionInfo(props: Props) {
  const { t } = useLingui();
  const durationFormat = useDurationFormat();
  const client = useClient();

  const isSlowmodeExempt = () => props.channel.havePermission("BypassSlowmode");

  const slowmodeCountdown = createMemo(() => {
    if (!props.channel.slowmode || isSlowmodeExempt()) return 0;

    const entry = props.channel.userSlowmode();
    if (!entry) return;

    const receivedAt = entry.receivedAt ?? Date.now();
    // Add 100 ms here so the countdown has a bit to render
    const targetTs = receivedAt + 100 + entry.retry_after * 1000;
    return createCountdownFromNow(targetTs);
  });

  const cooldownRemaining = createMemo(() => {
    const cd = slowmodeCountdown();

    if (!cd) return 0;

    const [store] = cd;

    const h = store.hours ?? 0;
    const m = store.minutes ?? 0;
    const s = store.seconds ?? 0;

    const totalSeconds = h * 3600 + m * 60 + s;
    return totalSeconds > 0 ? totalSeconds : 0;
  });

  const slowmodeText = createMemo(() => {
    const cd = slowmodeCountdown();

    if (!cd) return "";

    const [store] = cd;

    return durationFormat(
      { seconds: store.seconds, minutes: store.minutes, hours: store.hours },
      { style: "digital" },
    );
  });

  const slowmodeWaitTime = createMemo(() => {
    const s = props.channel.slowmode;
    if (!s) return "";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;

    return durationFormat({ seconds: sec, minutes: m, hours: h });
  });

  /**
   * Generate list of user IDs
   * @returns User IDs
   */
  const users = useUsers(
    () =>
      (
        props.channel.typing.filter(
          (user) =>
            typeof user !== "undefined" &&
            user.id !== client().user!.id &&
            user.relationship !== "Blocked",
        ) as User[]
      )
        .sort((a, b) => a!.id.toUpperCase().localeCompare(b!.id.toUpperCase()))
        .map((user) => user.id),
    true,
  );

  let barRef: HTMLDivElement | undefined;

  onMount(() => createResizeObserver(() => props.scrollRef, setBarWidth));

  function setBarRef(r?: HTMLDivElement) {
    barRef = r;
    setBarWidth();
  }

  function setBarWidth() {
    if (barRef && props.scrollRef)
      barRef.style.width = `calc(100% - ${
        props.scrollRef.offsetWidth - props.scrollRef.clientWidth
      }px)`;
  }

  return (
    <Show
      when={
        props.infoText ||
        props.channel.slowmode ||
        users().length ||
        setBarRef()
      }
    >
      <Bar ref={setBarRef}>
        <Show when={users().length} fallback={<Dummy />}>
          <Avatars>
            <For each={users()}>
              {(user, index) => (
                <Avatar
                  src={user!.avatar}
                  size={15}
                  holepunch={
                    index() + 1 < users().length ? "overlap-subtle" : "none"
                  }
                />
              )}
            </For>
          </Avatars>
          <OverflowingText class={typography({ class: "body", size: "small" })}>
            <Switch fallback={<Trans>Several people are typing…</Trans>}>
              <Match when={users().length === 1}>
                <Trans>{users()[0]!.username} is typing…</Trans>
              </Match>
              <Match when={users().length < 5}>
                <Trans>
                  {users()
                    .slice(0, -1)
                    .map((user) => user!.username)
                    .join(", ")}{" "}
                  and {users().slice(-1)[0]!.username} are typing…
                </Trans>
              </Match>
            </Switch>
          </OverflowingText>
        </Show>
        <Show when={props.infoText || props.channel.slowmode}>
          <div
            class={SlowmodeHolder()}
            use:floating={{
              tooltip: props.infoText
                ? undefined
                : {
                    placement: "top",
                    content: t`Members can send one message every ${slowmodeWaitTime()}.`,
                  },
            }}
          >
            <Symbol style={{ "font-size": "1rem" }}>
              {props.infoText ? "info" : "schedule"}
            </Symbol>
            <SlowmodeText>
              <Switch fallback={t`Slowmode is enabled.`}>
                <Match when={props.infoText}>{props.infoText}</Match>
                <Match when={isSlowmodeExempt()}>{t`Slowmode Immune`}</Match>
                <Match when={cooldownRemaining() > 0}>{slowmodeText()}</Match>
              </Switch>
            </SlowmodeText>
          </div>
        </Show>
      </Bar>
    </Show>
  );
}

/**
 * Avatar alignment
 */
const Avatars = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    height: "fit-content",

    "& :not(:first-child)": {
      marginInlineStart: "-6px",
    },
  },
});

/**
 * Styles for the typing indicator
 */
const Bar = styled("div", {
  base: {
    minHeight: "26px",
    paddingLeft: "var(--gap-lg)",
    paddingRight: "var(--gap-md)",

    display: "flex",
    gap: "var(--gap-md)",

    userSelect: "none",
    alignItems: "center",
    flexDirection: "row",

    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-lowest)",
  },
});

const Dummy = styled("div", {
  base: {
    display: "flex",
    width: 0,
  },
});

const SlowmodeHolder = cva({
  base: {
    display: "flex",
    alignItems: "center",
    marginLeft: "auto",
    gap: "var(--gap-sm)",
    color: "var(--md-sys-color-outline)",
    flexShrink: 0,
  },
});

const SlowmodeText = styled("span", {
  base: {
    fontSize: "0.75rem",
    fontWeight: "600",
  },
});
