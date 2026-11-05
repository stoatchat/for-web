import { useNavigate } from "@solidjs/router";
import { Match, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { PublicChannelInvite } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useInstance } from "@revolt/instance";
import { useModals } from "@revolt/modal";
import { CategoryButton, Column, Symbol } from "@revolt/ui";

/**
 * Feedback
 */
export function Feedback() {
  const { openModal, pop } = useModals();
  const navigate = useNavigate();
  const client = useClient();
  const instance = useInstance();

  const showLoungeButton = instance.isStoat;
  const isInLounge =
    client()!.servers.get("01F7ZSBSFHQ8TA81725KQCSDDP") !== undefined;

  return (
    <Column gap="lg">
      <CategoryButton.Group>
        {/* <Link
          href="https://example.com"
          target="_blank"
        >
          <CategoryButton
            action="external"
            icon={<MdViewKanban {...iconSize(22)} />}
            onClick={() => void 0}
            description={<Trans>See what we're currently working on.</Trans>}
          >
            <Trans>Roadmap</Trans>
          </CategoryButton>
        </Link> */}
        <Link
          href="https://github.com/orgs/stoatchat/discussions/categories/feature-suggestions"
          target="_blank"
        >
          <CategoryButton
            action="external"
            icon={<Symbol size={22}>star</Symbol>}
            ignoreClick
            description={
              <Trans>Suggest new Stoat features on GitHub discussions.</Trans>
            }
          >
            <Trans>Submit feature suggestion</Trans>
          </CategoryButton>
        </Link>
        <Link
          href="https://github.com/orgs/stoatchat/discussions/categories/feedback"
          target="_blank"
        >
          <CategoryButton
            action="external"
            icon={<Symbol size={22}>format_list_numbered</Symbol>}
            ignoreClick
            description={<Trans>Submit feedback</Trans>}
          >
            <Trans>Feedback</Trans>
          </CategoryButton>
        </Link>
        <Link
          href="https://github.com/stoatchat/for-web/issues?q=is%3Aissue%20state%3Aopen%20type%3ABug"
          target="_blank"
        >
          <CategoryButton
            action="external"
            icon={<Symbol size={22}>bug_report</Symbol>}
            ignoreClick
            description={<Trans>View currently active bug reports here.</Trans>}
          >
            <Trans>Bug Tracker</Trans>
          </CategoryButton>
        </Link>
        <Switch fallback={null}>
          <Match when={showLoungeButton && isInLounge}>
            <CategoryButton
              onClick={() => {
                navigate("/server/01F7ZSBSFHQ8TA81725KQCSDDP");
                pop();
              }}
              description={
                <Trans>
                  You can report issues and discuss improvements with us
                  directly here.
                </Trans>
              }
              icon={<Symbol>groups_3</Symbol>}
            >
              <Trans>Go to the Stoat Lounge</Trans>
            </CategoryButton>
          </Match>
          <Match when={showLoungeButton && !isInLounge}>
            <CategoryButton
              onClick={() => {
                client()
                  .api.get("/invites/Testers")
                  .then((invite) => PublicChannelInvite.from(client(), invite))
                  .then((invite) => openModal({ type: "invite", invite }));
              }}
              description={
                <Trans>
                  You can report issues and discuss improvements with us
                  directly here.
                </Trans>
              }
              icon={<Symbol>groups_3</Symbol>}
            >
              <Trans>Join the Stoat Lounge</Trans>
            </CategoryButton>
          </Match>
        </Switch>
      </CategoryButton.Group>
    </Column>
  );
}

/**
 * Link without decorations
 */
const Link = styled("a", {
  base: {
    textDecoration: "none",
  },
});
