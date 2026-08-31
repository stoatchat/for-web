import { createSignal, JSXElement, Match, Suspense, Switch } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import { Button, Checkbox, CircularProgress, iconSize, Text } from "@revolt/ui";

import MdWarning from "@material-design-icons/svg/round/warning.svg?component-solid";

type GeoBlock = {
  countryCode: string;
  isAgeRestrictedGeo: boolean;
};

/**
 * Age gate filter for any content
 */
export function AgeGate(props: { channel: Channel; children: JSXElement }) {
  const state = useState();

  const [confirmed, setConfirm] = createSignal(false);
  const allowed = () =>
    state.layout.getSectionState(LAYOUT_SECTIONS.MATURE, false);

  const geoQuery = useQuery(() => ({
    queryKey: ["geoblock"],
    queryFn: async (): Promise<GeoBlock> => {
      const response = await fetch("https://geo.revolt.chat");
      if (!response.ok) {
        throw new Error("Failed to fetch geo data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    throwOnError: true,
  }));

  return (
    <Suspense fallback={<CircularProgress />}>
      <Switch fallback={props.children}>
        <Match
          when={
            props.channel.mature &&
            (geoQuery.isLoading ||
              geoQuery.error ||
              (geoQuery.data && geoQuery.data.isAgeRestrictedGeo))
          }
        >
          <Base>
            <MdWarning {...iconSize("8em")} />
            <Text class="headline" size="large">
              {"#" + props.channel.name}
            </Text>

            <Text class="body" size="large">
              {geoQuery.data?.countryCode == "GB" ? (
                <Trans>
                  This channel is not available in your region while we review
                  options on legal compliance.
                </Trans>
              ) : (
                <Trans>This content is not available in your region.</Trans>
              )}
            </Text>

            <Button variant="text" onPress={() => history.back()}>
              <Trans>Back</Trans>
            </Button>
          </Base>
        </Match>
        <Match when={props.channel.mature && !allowed()}>
          <Base>
            <MdWarning {...iconSize("8em")} />
            <Text class="headline" size="large">
              {"#" + props.channel.name}
            </Text>

            <Text class="body" size="large">
              <Trans>This channel is marked as mature.</Trans>
            </Text>

            <Confirmation>
              <Checkbox onChange={() => setConfirm((v) => !v)} />
              <Text class="body" size="large">
                <Trans>I confirm that I am at least 18 years old.</Trans>
              </Text>
            </Confirmation>

            <Actions>
              <Button variant="text" onPress={() => history.back()}>
                <Trans>Back</Trans>
              </Button>
              <Button
                variant="filled"
                isDisabled={!confirmed()}
                onPress={() =>
                  confirmed() &&
                  state.layout.setSectionState(LAYOUT_SECTIONS.MATURE, true)
                }
              >
                <Trans>Enter Channel</Trans>
              </Button>
            </Actions>
          </Base>
        </Match>
      </Switch>
    </Suspense>
  );
}

const Base = styled("div", {
  base: {
    height: "100%",

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "var(--gap-lg)",
    userSelect: "none",
    overflowY: "auto",
    color: "var(--md-sys-color-on-surface)",

    "& svg": {
      // TODO
      fill: "orange",
    },

    gap: "var(--gap-md)",
  },
});

const Confirmation = styled("label", {
  base: {
    display: "flex",
    gap: "var(--gap-sm)",
    alignItems: "center",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    marginTop: "var(--gap-lg)",
    gap: "var(--gap-lg)",
  },
});
