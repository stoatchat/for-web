import { Match, Show, Switch, createMemo, splitProps } from "solid-js";

import { Plural, Trans, useLingui } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { Channel } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { ChannelContextMenu, UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { TextWithEmoji } from "@revolt/markdown";
import { useModals } from "@revolt/modal";
import { useLocation, useNavigate } from "@revolt/routing";
import { iconSize } from "@revolt/ui";
import {
  Avatar,
  Deferred,
  MenuButton,
  OverflowingText,
  Tooltip,
  UserStatus,
  typography,
} from "@revolt/ui";

import MdPlus from "@material-design-icons/svg/outlined/add.svg?component-solid";
import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";

import { SidebarBase } from "./common";
import { Symbol } from "@revolt/ui/components/utils/Symbol"

interface Props {
  /**
   * Ordered list of conversations
   */
  conversations: () => Channel[];

  /**
   * Current channel ID
   */
  channelId?: string;

  /**
   * Open the saved notes channel
   */
  openSavedNotes: (
    navigate?: ReturnType<typeof useNavigate>,
  ) => string | undefined;
}

/**
 * Display home navigation and conversations
 */
export const HomeSidebar = (props: Props) => {
  const { t } = useLingui();
  const client = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useModals();

  const savedNotesChannelId = createMemo(() => props.openSavedNotes());

  let scrollTargetElement!: HTMLDivElement;

  const pendingRequests = createMemo(() => {
    return client().users.filter((user) => user.relationship === "Incoming")
      .length;
  });

  return (
    <SidebarBase>
      <div ref={scrollTargetElement} use:invisibleScrollable>
        <List>
          <SidebarTitle>
            <Trans>Conversations</Trans>
          </SidebarTitle>

          <a href="/app">
            <MenuButton
              size="normal"
              icon={<Symbol css={{alignSelf: "center", paddingBottom: "2px"}}>home</Symbol>}
              attention={location.pathname === "/app" ? "selected" : "normal"}
            >
              <ButtonTitle>
                <Trans>Home</Trans>
              </ButtonTitle>
            </MenuButton>
          </a>

          <div style={{ height: "5px" }} />

          <a href="/friends">
            <MenuButton
              size="normal"
              icon={<Symbol css={{alignSelf: "center", paddingBottom: "1px"}}>group</Symbol>}
              attention={
                location.pathname === "/friends" ? "selected" : "normal"
              }
            >
              <ButtonTitle>
                <Trans>Friends</Trans>
                <div style={{ flex: "1 1 auto" }} />
                <Show when={pendingRequests()}>
                  <PendingBadge>{pendingRequests()} requests</PendingBadge>
                </Show>
              </ButtonTitle>
            </MenuButton>
          </a>
            
          <div style={{ height: "5px" }} />

          <Switch
            fallback={
              <MenuButton
                size="normal"
                attention={"normal"}
                icon={<Symbol css={{alignSelf: "center", paddingBottom: "2px"}}>note_stack</Symbol>}
                onClick={() => props.openSavedNotes(navigate)}
              >
                <ButtonTitle>
                  <Trans>Saved Notes</Trans>
                </ButtonTitle>
              </MenuButton>
            }
          >
            <Match when={savedNotesChannelId()}>
              <a href={`/channel/${savedNotesChannelId()}`}>
                <MenuButton
                  size="normal"
                  icon={<Symbol css={{alignSelf: "center", paddingBottom: "2px"}}>note_stack</Symbol>}
                  attention={
                    props.channelId && savedNotesChannelId() === props.channelId
                      ? "selected"
                      : "normal"
                  }
                >
                  <ButtonTitle>
                    <Trans>Saved Notes</Trans>
                  </ButtonTitle>
                </MenuButton>
              </a>
            </Match>
          </Switch>

          <Category>
            Direct Messages
            <a
              class={css({
                cursor: "pointer",
              })}
              onClick={() =>
                openModal({
                  type: "create_group",
                  client: client(),
                })
              }
              use:floating={{
                tooltip: {
                  placement: "right",
                  content: t`Create a new group`,
                },
              }}
            >
              <Symbol fontSize="1.4em !important" marginTop="2px">add</Symbol>
            </a>
          </Category>

          <Deferred>
            <VirtualContainer
              items={props.conversations()}
              scrollTarget={scrollTargetElement}
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
                  <Entry
                    // @ts-expect-error missing type on Entry
                    role="listitem"
                    tabIndex={item.tabIndex}
                    style={item.style}
                    channel={item.item}
                    active={item.item.id === props.channelId}
                  />
                </div>
              )}
            </VirtualContainer>
          </Deferred>
        </List>
      </div>
    </SidebarBase>
  );
};

/**
 * Sidebar title
 */
const SidebarTitle = styled("p", {
  base: {
    paddingBlock: "calc(var(--gap-md) + 15px)",
    paddingInline: "var(--gap-md)",

    ...typography.raw({ class: "title" }),
  },
});

/**
 * Button title
 */
const ButtonTitle = styled("div", {
  base: {
    gap: "var(--gap-md)",
    height: "100%",
    display: "flex",
    alignItems: "center",
  },
});

const PendingBadge = styled("div", {
  base: {
    ...typography.raw({ class: "label", size: "small" }),
    padding: "var(--gap-sm) var(--gap-md)",
    color: "var(--md-sys-color-on-error)",
    background: "var(--md-sys-color-error)",
    borderRadius: "var(--borderRadius-md)",
  },
});

const Category = styled("div", {
  base: {
    display: "flex",
    paddingInline: "var(--gap-lg)",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "calc(var(--gap-xl) - 5px)",
    paddingBottom: "var(--gap-md)",

    ...typography.raw({ class: "label", size: "small" }),
    fontSize: "13px",
  },
});

/**
 * Styles required to correctly display name and status
 */
const NameStatusStack = styled("div", {
  base: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
});

/**
 * Single conversation entry
 */
function Entry(
  props: { channel: Channel; active: boolean } /*& Omit<
    ComponentProps<typeof Link>,
    "href"
  >*/,
) {
  const [local, remote] = splitProps(props, ["channel", "active"]);

  const { t } = useLingui();
  const { openModal } = useModals();

  /**
   * Determine user status if present
   */
  const status = () =>
    local.channel.recipient?.statusMessage((s) =>
      s === "Online"
        ? t`Online`
        : s === "Busy"
          ? t`Busy`
          : s === "Focus"
            ? t`Focus`
            : s === "Idle"
              ? t`Idle`
              : t`Offline`,
    );

  return (
    <a {...remote} href={`/channel/${local.channel.id}`}>
      <MenuButton
        size="normal"
        alert={
          !local.active &&
          local.channel.unread &&
          (local.channel.mentions?.size || true)
        }
        attention={
          local.active
            ? "selected"
            : local.channel.muted
              ? "muted"
              : local.channel.unread
                ? "active"
                : "normal"
        }
        icon={
          <Switch>
            <Match when={local.channel.type === "Group"}>
              <Avatar
                size={32}
                shape="rounded-square"
                fallback={local.channel.name}
                src={local.channel.iconURL}
                primaryContrast
              />
            </Match>
            <Match when={local.channel.type === "DirectMessage"}>
              <Avatar
                size={32}
                src={local.channel.iconURL}
                holepunch="bottom-right"
                overlay={
                  <UserStatus.Graphic
                    status={local.channel?.recipient?.presence}
                  />
                }
              />
            </Match>
          </Switch>
        }
        actions={
          <a
            onClick={(e) => {
              e.preventDefault();
              openModal({
                type: "delete_channel",
                channel: local.channel,
              });
            }}
          >
            <MdClose {...iconSize("18px")} />
          </a>
        }
        use:floating={{
          contextMenu: () =>
            local.channel.type === "DirectMessage" ? (
              <UserContextMenu
                user={local.channel.recipient!}
                channel={local.channel}
              />
            ) : (
              <ChannelContextMenu channel={local.channel} />
            ),
        }}
      >
        <NameStatusStack>
          <Switch>
            <Match when={local.channel.type === "Group"}>
              <OverflowingText>
                <TextWithEmoji content={local.channel.name!} />
              </OverflowingText>
              <span class={typography({ class: "_status" })}>
                {/* <Plural
                  value={local.channel.recipientIds.size}
                  one="# Member"
                  other="# Members"
                /> */}
                {local.channel.recipientIds.size} {local.channel.recipientIds.size > 1 ? `Members` : 'Member'}
              </span>
            </Match>
            <Match when={local.channel.type === "DirectMessage"}>
              <OverflowingText>
                {local.channel?.recipient?.displayName}
              </OverflowingText>
              <Show when={status()}>
                <Tooltip
                  content={() => <TextWithEmoji content={status()!} />}
                  placement="top-start"
                  aria={status()!}
                >
                  <OverflowingText class={typography({ class: "_status" })}>
                    <TextWithEmoji content={status()!} />
                  </OverflowingText>
                </Tooltip>
              </Show>
            </Match>
          </Switch>
        </NameStatusStack>
      </MenuButton>
    </a>
  );
}

/**
 * Inner scrollable list
 * We fix the width in order to prevent scrollbar from moving stuff around
 */
const List = styled("div", {
  base: {
    paddingLeft: "var(--gap-md)",
    width: "var(--layout-width-channel-sidebar)",
  },
});
