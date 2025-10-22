import {
  BiLogosAndroid,
  BiLogosApple,
  BiLogosWindows,
  BiRegularQuestionMark,
} from "solid-icons/bi";
import { FaBrandsLinux } from "solid-icons/fa";
import {
  Accessor,
  For,
  Match,
  Show,
  Switch,
  createMemo,
  onMount,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Session } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  CategoryButton,
  CategoryButtonGroup,
  CategoryCollapse,
  CircularProgress,
  Column,
  Time,
  iconSize,
} from "@revolt/ui";

import _MdAutoMode from "@material-design-icons/svg/outlined/auto_mode.svg?component-solid";
import MdLogout from "@material-design-icons/svg/outlined/logout.svg?component-solid";

/**
 * Sessions
 */
export function Sessions() {
  const client = useClient();
  onMount(() => client().sessions.fetch());

  /**
   * Sort the other sessions by created date
   */
  const otherSessions = createMemo(() =>
    client()
      .sessions.filter((session) => !session.current)
      .sort((a, b) => +b.createdAt - +a.createdAt),
  );

  return (
    <Column gap="lg">
      <Switch fallback={<CircularProgress />}>
        <Match when={client().sessions.size()}>
          <ManageCurrentSession otherSessions={otherSessions} />
          <ListOtherSessions otherSessions={otherSessions} />
        </Match>
      </Switch>
    </Column>
  );
}

/**
 * Manage user's current session
 */
function ManageCurrentSession(props: { otherSessions: Accessor<Session[]> }) {
  const client = useClient();
  const { openModal } = useModals();

  /**
   * Resolve current session
   */
  const currentSession = () => client().sessions.get(client().sessionId!);

  return (
    <CategoryButtonGroup>
      <CategoryCollapse
        title={<Trans>Current Session</Trans>}
        description={currentSession()?.name}
        icon={<SessionIcon session={currentSession()} />}
      >
        <CategoryButton
          icon="blank"
          action="chevron"
          onClick={() =>
            currentSession() &&
            openModal({
              type: "rename_session",
              session: currentSession()!,
            })
          }
        >
          <Trans>Rename</Trans>
        </CategoryButton>
      </CategoryCollapse>
      {/* <CategoryButton
        action="chevron"
        icon={
          <MdAutoMode
            {...iconSize(24)}
            fill="var(--md-sys-color-error)"
          />
        }
        description={Keeps your last sessions active and automatically logs you out of other ones"}
      >
        Keep Last Active Sessions
      </CategoryButton> */}
      <Show when={props.otherSessions().length}>
        <CategoryButton
          action="chevron"
          onClick={() =>
            openModal({
              type: "sign_out_sessions",
              client: client(),
            })
          }
          icon={<MdLogout {...iconSize(24)} fill="var(--md-sys-color-error)" />}
          description={
            <Trans>Logs you out of all sessions except this device.</Trans>
          }
        >
          <Trans>Log Out Other Sessions</Trans>
        </CategoryButton>
      </Show>
    </CategoryButtonGroup>
  );
}

/**
 * List other logged in sessions
 */
function ListOtherSessions(props: { otherSessions: Accessor<Session[]> }) {
  const { openModal } = useModals();

  return (
    <Show when={props.otherSessions().length}>
      <Column>
        <CategoryButtonGroup>
          <For each={props.otherSessions()}>
            {(session) => (
              <CategoryCollapse
                icon={<SessionIcon session={session} />}
                title={<Capitalise>{session.name}</Capitalise>}
                description={
                  <Trans>
                    Created <Time value={session.createdAt} format="relative" />
                  </Trans>
                }
              >
                <CategoryButton
                  icon="blank"
                  action="chevron"
                  onClick={() =>
                    openModal({
                      type: "rename_session",
                      session,
                    })
                  }
                >
                  <Trans>Rename</Trans>
                </CategoryButton>
                <CategoryButton
                  icon="blank"
                  action="chevron"
                  onClick={() => session.delete()}
                >
                  <Trans>Log Out</Trans>
                </CategoryButton>
              </CategoryCollapse>
            )}
          </For>
        </CategoryButtonGroup>
      </Column>
    </Show>
  );
}

/**
 * Capitalize session titles
 */
const Capitalise = styled("div", {
  base: {
    textTransform: "capitalize",
  },
});

/**
 * Show icon for session
 */
function SessionIcon(props: { session?: Session }) {
  return (
    <Switch fallback={<BiRegularQuestionMark size={22} />}>
      <Match when={/linux/i.test(props.session?.name ?? "")}>
        <FaBrandsLinux size={22} />
      </Match>
      <Match when={/windows/i.test(props.session?.name ?? "")}>
        <BiLogosWindows size={22} />
      </Match>
      <Match when={/android/i.test(props.session?.name ?? "")}>
        <BiLogosAndroid size={22} />
      </Match>
      <Match when={/mac.*os|i(Pad)?os/i.test(props.session?.name ?? "")}>
        <BiLogosApple size={22} />
      </Match>
    </Switch>
  );
}
