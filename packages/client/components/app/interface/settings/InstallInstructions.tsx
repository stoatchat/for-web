import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Button, Column, iconSize } from "@revolt/ui";
import MdIosShare from "@material-design-icons/svg/outlined/ios_share.svg?component-solid";
import { styled } from "styled-system/jsx";
import { css } from "styled-system/css";
import { useState } from "@revolt/state";
import { createEffect, createMemo, createSignal, Show } from "solid-js";

const Container = styled("div", {
  base: {
    minWidth: 0,

    padding: "15px 0px",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
  },
});

const SuperSectionHeading = styled("h1", {
  base: {
    fontSize: "22px",
    paddingTop: "1.2em",
    paddingBottom: "0.5em",
  }
});

const SectionHeading = styled("h2", {
  base: {
    fontSize: "18px",
    paddingTop: "1.2em",
    paddingBottom: "0.5em",
  }
});

const Steps = styled("ol", {
  base: {
    listStyleType: "decimal",
    listStylePosition: "inside",
  }
});

/**
 * Installation Instructions Page
 */
export default function InstallInstructions() {
  const state = useState();
  const { t } = useLingui();

  const [pwaPrompt,] = state.pwaPrompt;
  const [pwaInstalled,] = state.pwaInstalled;

  const [promptResult, setPromptResult] = createSignal<"accepted" | "dismissed">();
  createEffect(() => {
    pwaPrompt()?.userChoice?.then(choice => setPromptResult(choice.outcome));
  });

  return (
    <Container>
      <Show when={pwaInstalled()}>
        <Trans>You've successfully installed Stoat!</Trans>
      </Show>
      <Show when={!pwaInstalled()}>
        <p>
          <Trans>Installing Stoat only takes a few taps. We'll guide you through it.</Trans>
        </p>

        <Show when={pwaPrompt()}>
          <SuperSectionHeading>
            <Trans>Easy Install</Trans>
          </SuperSectionHeading>
          <Show when={promptResult() === undefined}>
            <Button
              type="button"
              onPress={() => pwaPrompt()!.prompt()}
            >
              <Trans>Install</Trans>
            </Button>
          </Show>
          <Show when={promptResult() === "accepted"}>
            <Trans>Installing...</Trans>
          </Show>
          <Show when={promptResult() === "dismissed"}>
            <Trans>Looks like you declined the installation... You can refresh the page if you'd like to try again, or try the manual instructions below.</Trans>
          </Show>

          <SuperSectionHeading>
            <Trans>Manual Install</Trans>
          </SuperSectionHeading>
        </Show>
        <SectionHeading>
          <Trans>Android</Trans>
        </SectionHeading>
        <Steps>
          <li>
            <Trans>Open this page in Google Chrome</Trans>
          </li>
          <li>
            <Trans>Click on the ⋮ button</Trans>
          </li>
          <li>
            <Trans>Tap "Install app" or "Add to home screen"</Trans>
          </li>
          <li>
            <Trans>Follow the prompts</Trans>
          </li>
        </Steps>

        <SectionHeading>
          <Trans>iOS / iPadOS</Trans>
        </SectionHeading>
        <Steps>
          <li>
            <Trans>Open this page in Safari</Trans>
          </li>
          <li>
            <Trans>Click on the <MdIosShare {...iconSize(18)} style={{ display: 'inline-block' }} /> button</Trans>
          </li>
          <li>
            <Trans>Tap "Add to Home Screen"</Trans>
          </li>
          <li>
            <Trans>Follow the prompts</Trans>
          </li>
        </Steps>
      </Show>
    </Container>
  );
}
