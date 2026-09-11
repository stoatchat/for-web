import { createEffect, createSignal, Match, Show, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { useDevice } from "@revolt/common";
import { Button, Symbol } from "@revolt/ui";

const Container = styled("div", {
  base: {
    padding: "var(--gap-lg) 0",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",

    "& h1": { fontSize: "22px" },
    "& h2": { fontSize: "18px" },

    "& p, & h1, & h2": {
      marginBlockStart: "1.2em",
      marginBlockEnd: ".5em",
    },

    "& *:first-child": {
      margin: 0,
    },
  },
});

const Steps = styled("ol", {
  base: {
    listStyleType: "decimal",
    listStylePosition: "inside",
  },
});

/**
 * Installation Instructions Page
 */
export default function InstallInstructions() {
  const { pwaPrompt, pwaInstalled, isFirefox, isIOSTouch } = useDevice();

  const [result, setResult] = createSignal<"accepted" | "dismissed">();

  createEffect(() =>
    pwaPrompt()?.userChoice?.then((choice) => setResult(choice.outcome)),
  );

  return (
    <Container>
      <Show
        when={!pwaInstalled()}
        fallback={<Trans>You've successfully installed Stoat!</Trans>}
      >
        <p>
          <Trans>
            Installing Stoat only takes a few taps. We'll guide you through it.
          </Trans>
        </p>

        <Show when={isFirefox}>
          <p style={{ "font-style": "italic" }}>
            <Trans>
              <b>Warning:</b> Web App support on Firefox is limited- Your
              mileage may vary.
            </Trans>
          </p>
        </Show>

        <Show when={pwaPrompt()}>
          <h1>
            <Trans>Easy Install</Trans>
          </h1>
          <Switch>
            <Match when={!result()}>
              <Button type="button" onPress={() => pwaPrompt()!.prompt()}>
                <Trans>Install</Trans>
              </Button>
            </Match>
            <Match when={result() === "accepted"}>
              <Trans>Installing...</Trans>
            </Match>
            <Match when={result() === "dismissed"}>
              <p>
                <Trans>
                  Looks like you declined the installation... You can refresh
                  the page if you'd like to try again, or try the manual
                  instructions below.
                </Trans>
              </p>
              <p>
                <Button type="button" onPress={() => location.reload()}>
                  <Symbol>refresh</Symbol>
                </Button>
              </p>
            </Match>
          </Switch>

          <h1>
            <Trans>Manual Install</Trans>
          </h1>
        </Show>

        <Show when={!isIOSTouch}>
          <h2>
            <Trans>Android</Trans>
          </h2>
          <Steps>
            <li>
              <Trans>Open this page in Chrome</Trans>
            </li>
            <li>
              <Trans>Press the</Trans> ⋮ <Trans>button</Trans>
            </li>
            <li>
              <Trans>Tap "Install app" or "Add to Home screen"</Trans>
            </li>
            <li>
              <Trans>Follow the prompts</Trans>
            </li>
          </Steps>
        </Show>

        <h2>
          <Trans>iOS / iPadOS</Trans>
        </h2>
        <Steps>
          <li>
            <Trans>Open this page in Safari</Trans>
          </li>
          <li>
            <Trans>Press the</Trans>{" "}
            <Symbol
              style={{
                "font-size": "20px",
                "vertical-align": "sub",
                "font-weight": 300,
              }}
            >
              ios_share
            </Symbol>{" "}
            <Trans>button</Trans>
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
