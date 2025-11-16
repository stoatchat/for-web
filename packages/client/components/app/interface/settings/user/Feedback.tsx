import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import {
  CategoryButton,
  CategoryButtonGroup,
  Column,
  iconSize,
} from "@revolt/ui";

import MdGroups3 from "@material-design-icons/svg/filled/groups_3.svg?component-solid";
import MdBugReport from "@material-design-icons/svg/outlined/bug_report.svg?component-solid";
import MdFormatListNumbered from "@material-design-icons/svg/outlined/format_list_numbered.svg?component-solid";
import MdStar from "@material-design-icons/svg/outlined/star_outline.svg?component-solid";
import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import { useModals } from "@revolt/modal";
import { useNavigate } from "@solidjs/router";
import { Match, Switch } from "solid-js";
import { PublicChannelInvite } from "stoat.js";

/**
 * Feedback
 */
export function Feedback() {
  const { openModal, pop } = useModals();
  const navigate = useNavigate();
  const client = useClient();

  const showLoungeButton = CONFIGURATION.IS_STOAT;
  const isInLounge =
    client()!.servers.get("01F7ZSBSFHQ8TA81725KQCSDDP") !== undefined;

  return (
    <Column gap="lg">
      <CategoryButtonGroup>
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
            icon={<MdStar {...iconSize(22)} />}
            onClick={() => void 0}
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
            icon={<MdFormatListNumbered {...iconSize(22)} />}
            onClick={() => void 0}
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
            icon={<MdBugReport {...iconSize(22)} />}
            onClick={() => void 0}
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
              icon={<MdGroups3 />}
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
              icon={<MdGroups3 />}
            >
              <Trans>Join the Stoat Lounge</Trans>
            </CategoryButton>
          </Match>
        </Switch>
      </CategoryButtonGroup>
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
