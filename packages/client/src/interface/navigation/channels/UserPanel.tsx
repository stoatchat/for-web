import { Show, createSignal } from "solid-js";
import { styled } from "styled-system/jsx";

import { useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useVoice } from "@revolt/rtc";
import { Avatar, IconButton, OverflowingText, UserStatus } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { UserMenu } from "../servers/UserMenu";

/**
 * Discord-style account bar pinned to the bottom of the channel sidebar:
 * own avatar/username/status, mic mute, deafen ("full mute"), and a
 * shortcut to Settings. Shown regardless of whether a call is active.
 */
export function UserPanel() {
  const user = useUser();
  const voice = useVoice();
  const { openModal } = useModals();

  const [menuButton, setMenuButton] = createSignal<HTMLDivElement>();

  const openSettings = () => openModal({ type: "settings", config: "user" });

  return (
    <Base class="user_panel">
      <Profile ref={setMenuButton}>
        <Avatar
          size={32}
          src={user()?.avatarURL}
          fallback={user()?.username}
          holepunch="bottom-right"
          overlay={<UserStatus.Graphic status={user()?.presence} />}
          interactive
        />
        <NameColumn>
          <OverflowingText>{user()?.displayName}</OverflowingText>
          <Show when={user()?.status?.text}>
            <StatusText>{user()!.status!.text}</StatusText>
          </Show>
        </NameColumn>
      </Profile>
      <UserMenu anchor={menuButton} placement="top-start" />
      <Actions>
        <IconButton
          size="xs"
          variant={voice.microphone() ? "standard" : "tonal"}
          onPress={() => voice.toggleMute()}
          use:floating={{
            tooltip: {
              placement: "top",
              content: voice.microphone() ? "Mute" : "Unmute",
            },
          }}
        >
          <Show when={voice.microphone()} fallback={<Symbol>mic_off</Symbol>}>
            <Symbol>mic</Symbol>
          </Show>
        </IconButton>
        <IconButton
          size="xs"
          variant={voice.deafen() ? "tonal" : "standard"}
          onPress={() => voice.toggleDeafen()}
          use:floating={{
            tooltip: {
              placement: "top",
              content: voice.deafen() ? "Undeafen" : "Deafen",
            },
          }}
        >
          <Show when={voice.deafen()} fallback={<Symbol>headset</Symbol>}>
            <Symbol>headset_off</Symbol>
          </Show>
        </IconButton>
        <IconButton
          size="xs"
          variant="standard"
          onPress={openSettings}
          use:floating={{
            tooltip: { placement: "top", content: "Settings" },
          }}
        >
          <Symbol>settings</Symbol>
        </IconButton>
      </Actions>
    </Base>
  );
}

// Server icon rail is a fixed 56px (see entryContainer in ServerList.tsx) -
// the panel overlays that plus the channel sidebar, floating over both
// rather than being confined to the channel sidebar's own column/overflow.
// Inset from all three free edges + rounded corners for a Discord-style
// floating card instead of a bar flush against the edges.
//
// Height (40px) and border-radius match the message composition box
// (MessageBox.tsx: padding var(--gap-sm) var(--gap-md) around 32px-tall
// content, borderRadius var(--borderRadius-xl)) so the two bottom-aligned
// elements read as the same size.
const Base = styled("div", {
  base: {
    position: "absolute",
    // Setting both left and right (rather than an explicit width) lets the
    // box compute its own width as the gap between them, so it always ends
    // exactly `--gap-sm` short of MainBar's edges with no separate calc to
    // keep in sync.
    left: "var(--gap-sm)",
    right: "var(--gap-sm)",
    // Matches MessageBox's Parent bottom margin (var(--gap-md)) so this
    // panel and the message composition box line up at the same height.
    bottom: "var(--gap-md)",
    zIndex: 5,

    height: "40px",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    padding: "var(--gap-sm) var(--gap-md)",
    borderRadius: "var(--borderRadius-xl)",
    border: "1px solid var(--md-sys-color-outline-variant)",
    background: "var(--md-sys-color-surface-container-low)",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  },
});

const Profile = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    flex: "1 1 auto",
    minWidth: 0,
    cursor: "pointer",
  },
});

const NameColumn = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0,
  },
});

const StatusText = styled("div", {
  base: {
    fontSize: "0.75rem",
    color: "var(--md-sys-color-outline)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    gap: "2px",
  },
});
