import {
  createSignal,
  JSXElement,
  lazy,
  Match,
  Suspense,
  Switch,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useMutation, useQuery } from "@tanstack/solid-query";
import { Channel, decrypt, genKey } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useMessageCache } from "@revolt/app/interface/channels/text/MessageCache";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { PwdMinLength } from "@revolt/state/stores/Encrypted";
import { LAYOUT_SECTIONS } from "@revolt/state/stores/Layout";
import {
  Button,
  Checkbox,
  CircularProgress,
  iconSize,
  Symbol,
  Text,
  TextField,
} from "@revolt/ui";

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
  const cache = useMessageCache()!;
  const { showError } = useModals();
  const { t } = useLingui();

  const [confirmed, setConfirm] = createSignal(false);
  const [pass, setPass] = createSignal("");
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

  const tryPass = useMutation(() => ({
    mutationFn: async (pwd: string) => {
      if (pwd.length < PwdMinLength) throw "Password too short!";
      const key = await genKey(props.channel.id, pwd);

      //Fetch live or cached messages
      let msgList;
      const msgCache = cache.unmanage(props.channel);
      if (msgCache) {
        msgList = msgCache.messages;
        cache.manage(props.channel, msgCache);
      } else msgList = await props.channel.fetchMessages({ limit: 10 });

      //Test if key actually works before saving
      //TODO Maybe we should store a known-value encrypted string in
      // the channel that gives us easier access to test material
      let b64;
      for (const msg of msgList) if ((b64 = msg._rawContent())) break;
      try {
        if (b64) await decrypt(key, Uint8Array.fromBase64(b64).buffer);
        else console.warn("Didn't find anything to test with :(");
      } catch (e) {
        if ((e as Error).name === "OperationError")
          throw t`Wrong password, please try again.`;
        throw e;
      }

      state.e2e.savePass(props.channel.id, pwd);
      props.channel.key = key;
    },
    onError: showError,
  }));

  // eslint-disable-next-line solid/reactivity
  const LoadKey = lazy(async () => {
    const chan = props.channel;
    if (chan.e2e && !chan.key) {
      const pwd = state.e2e.getPass(chan.id);
      if (pwd)
        try {
          chan.key = await genKey(chan.id, pwd);
        } catch (e) {
          showError(e);
        }
    }
    return { default: () => undefined };
  });

  return (
    <Suspense fallback={<CircularProgress />}>
      <Switch fallback={props.children}>
        <Match when={props.channel.e2e && !props.channel.key}>
          <LoadKey />
          <Base>
            <Symbol
              size={128}
              color="var(--md-sys-color-on-secondary-container)"
              fill
            >
              encrypted
            </Symbol>
            <Text class="headline" size="large">
              {"#" + props.channel.name}
            </Text>

            <Text class="body" size="large">
              <Trans>
                This channel is end-to-end encrypted!
                <br />
                You'll need the password to access it.
              </Trans>
            </Text>

            <Field>
              <TextField
                label={t`Password`}
                minlength={PwdMinLength}
                onKeyUp={(e) => {
                  setPass((e.target as HTMLInputElement).value);
                  if (e.key === "Enter") tryPass.mutateAsync(pass());
                }}
              />
            </Field>

            <Actions>
              <Button variant="text" onPress={() => history.back()}>
                <Trans>Back</Trans>
              </Button>
              <Button
                variant="filled"
                isDisabled={pass().length < 6}
                onPress={() => tryPass.mutateAsync(pass())}
              >
                <Trans>Enter Channel</Trans>
              </Button>
            </Actions>
          </Base>
        </Match>
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

const Field = styled("div", {
  base: {
    width: "100%",
    maxWidth: "500px",
    padding: "var(--gap-md)",
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
