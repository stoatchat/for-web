import { useFloating } from "solid-floating-ui";
import {
  Accessor,
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import { autoUpdate, offset, shift } from "@floating-ui/dom";
import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { API } from "stoat.js";
import { styled } from "styled-system/jsx";

import {
  ContextMenu,
  ContextMenuButton,
  ContextMenuDivider,
  ContextMenuItem,
} from "@revolt/app/menus/ContextMenu";
import { useClient, useUser } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { Avatar, Column, Row, Text, UserStatus, iconSize } from "@revolt/ui";

import MdContactPage from "@material-design-icons/svg/outlined/contact_page.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdEditNote from "@material-design-icons/svg/outlined/edit_note.svg?component-solid";
import MdInfo from "@material-design-icons/svg/outlined/info.svg?component-solid";
import MdNotificationsOff from "@material-design-icons/svg/outlined/notifications_off.svg?component-solid";

interface Props {
  anchor: Accessor<HTMLDivElement | undefined>;
}

/**
 * User menu attached to the server list
 */
export function UserMenu(props: Props) {
  const { t } = useLingui();
  const { openModal } = useModals();
  const client = useClient();
  const user = useUser();
  const state = useState();

  const [show, setShow] = createSignal(false);
  const [ref, setRef] = createSignal<HTMLDivElement>();

  const position = useFloating(() => props.anchor(), ref, {
    placement: "right-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), shift()],
  });

  function toggle() {
    setShow((v) => !v);
  }

  function close() {
    setShow(false);
  }

  onMount(() => document.addEventListener("mousedown", close));
  onCleanup(() => document.removeEventListener("mousedown", close));

  createEffect(
    on(
      () => props.anchor(),
      (anchor) => {
        if (anchor) {
          anchor.addEventListener("click", toggle);
          onCleanup(() => anchor.removeEventListener("click", toggle));
        }
      },
    ),
  );

  const setPresence = (
    presence: (API.DataEditUser["status"] & {})["presence"],
  ) => user()?.edit({ status: { presence } });

  function copyId() {
    navigator.clipboard.writeText(user()!.id);
  }

  return (
    <Portal mount={document.getElementById("floating")!}>
      <Presence>
        <Show when={show()}>
          <Motion
            ref={setRef}
            style={{
              position: position.strategy,
              top: `${position.y ?? 0}px`,
              left: `${position.x ?? 0}px`,
            }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, easing: [0.87, 0, 0.13, 1] }}
          >
            <ContextMenu>
              <ContextMenuItem
                onClick={() => openModal({ type: "settings", config: "user" })}
                action
              >
                <Row align>
                  <Avatar
                    size={32}
                    fallback={user()?.username}
                    src={user()?.animatedAvatarURL}
                  />
                  <Column gap="none">
                    <Text>{user()?.displayName}</Text>
                    <Text class="label">
                      {user()?.username}#{user()?.discriminator}
                    </Text>
                  </Column>
                </Row>
              </ContextMenuItem>

              <ContextMenuDivider />

              <ContextMenuButton
                icon={
                  <Status>
                    <UserStatus size="10" status="Online" />
                  </Status>
                }
                onClick={() => setPresence("Online")}
              >
                <Trans>Online</Trans>
              </ContextMenuButton>
              <ContextMenuButton
                icon={
                  <Status>
                    <UserStatus size="10" status="Idle" />
                  </Status>
                }
                onClick={() => setPresence("Idle")}
              >
                <Trans>Idle</Trans>
              </ContextMenuButton>
              <ContextMenuButton
                icon={
                  <Status>
                    <UserStatus size="10" status="Focus" />
                  </Status>
                }
                onClick={() => setPresence("Focus")}
              >
                <Row align gap="sm">
                  <Trans>Focus</Trans>{" "}
                  <div
                    use:floating={{
                      tooltip: {
                        placement: "top",
                        content: t`Only mentions will notify you`,
                      },
                    }}
                  >
                    <MdInfo {...iconSize(12)} />
                  </div>
                </Row>
              </ContextMenuButton>
              <ContextMenuButton
                icon={
                  <Status>
                    <UserStatus size="10" status="Busy" />
                  </Status>
                }
                onClick={() => setPresence("Busy")}
              >
                <Row align gap="sm">
                  <Trans>Do Not Disturb</Trans>{" "}
                  <div
                    use:floating={{
                      tooltip: {
                        placement: "top",
                        content: t`You will not receive any notifications`,
                      },
                    }}
                  >
                    <MdNotificationsOff {...iconSize(12)} />
                  </div>
                </Row>
              </ContextMenuButton>
              <ContextMenuButton
                icon={
                  <Status>
                    <UserStatus size="10" status="Invisible" />
                  </Status>
                }
                onClick={() => setPresence("Invisible")}
              >
                <Trans>Invisible</Trans>
              </ContextMenuButton>

              <ContextMenuDivider />

              <Show
                when={user()?.status?.text}
                fallback={
                  <ContextMenuButton
                    icon={MdEditNote}
                    onClick={() =>
                      openModal({ type: "custom_status", client: client() })
                    }
                  >
                    <Trans>Add status text</Trans>
                  </ContextMenuButton>
                }
              >
                <ContextMenuButton
                  icon={MdEditNote}
                  onClick={() =>
                    openModal({ type: "custom_status", client: client() })
                  }
                  _titleCase={false}
                >
                  {user()!.status!.text}
                </ContextMenuButton>
                <ContextMenuButton
                  icon={MdDelete}
                  onClick={() => user()?.edit({ remove: ["StatusText"] })}
                >
                  <Trans>Clear status</Trans>
                </ContextMenuButton>
              </Show>

              <Show when={state.settings.getValue("advanced:copy_id")}>
                <ContextMenuButton icon={MdContactPage} onClick={copyId}>
                  <Trans>Copy user ID</Trans>
                </ContextMenuButton>
              </Show>
            </ContextMenu>
          </Motion>
        </Show>
      </Presence>
    </Portal>
  );
}

const Status = styled("div", {
  base: {
    width: "16px",
    display: "flex",
    justifyContent: "center",
  },
});
