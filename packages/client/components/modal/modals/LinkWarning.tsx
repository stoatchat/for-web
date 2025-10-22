import { Match, Switch, createMemo, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useState } from "@revolt/state";
import { Checkbox, Column, Dialog, DialogProps, Text } from "@revolt/ui";

import { Modals } from "../types";

/**
 * Modal to warn the user about a potentially unsafe link
 */
export function LinkWarningModal(
  props: DialogProps & Modals & { type: "link_warning" },
) {
  const state = useState();
  const [value, setValue] = createSignal(false);

  const scrutiny = createMemo(() => {
    let destUrlString = props.url.toString();
    if (destUrlString !== props.display) {
      try {
        let displayUrl = new URL(props.display);
        if (destUrlString !== displayUrl.toString()) {
          return 2;
        } else {
          return 1;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_) {
        // URL parsing failed; the link is likely not intentionally misleading.
        return 1;
      }
    }

    return 0;
  });

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>External links can be dangerous!</Trans>}
      actions={[
        { text: <Trans>Close</Trans> },
        {
          text: <Trans>Continue</Trans>,
          onClick: () => {
            window.open(props.url, "_blank", "noopener");

            if (value() && scrutiny() === 0) {
              state.linkSafety.trust(props.url);
            }
          },
          isDisabled: scrutiny() === 2 && !value(),
        },
      ]}
    >
      <Column>
        <span>
          <Trans>Are you sure you want to go to </Trans>
          <Link>{props.url.toString()}</Link>
          ?
        </span>
        <Switch
          fallback={
            <Checkbox checked={value()} onChange={() => setValue((v) => !v)}>
              <span>
                <Trans>Don't ask me again for </Trans>
                <Link>{props.url.origin}</Link>
              </span>
            </Checkbox>
          }
        >
          <Match when={scrutiny() === 1}>
            <Trans>You clicked on "{props.display}"</Trans>
          </Match>
          <Match when={scrutiny() === 2}>
            <Scrutinise>
              <Text>
                <Trans>
                  <strong>Be careful!</strong>
                  <br />
                  This is not the same as the link that was displayed:
                </Trans>
              </Text>
              <Link>{props.display}</Link>
              <Checkbox checked={value()} onChange={() => setValue((v) => !v)}>
                <Trans>I understand the consequences</Trans>
              </Checkbox>
            </Scrutinise>
          </Match>
        </Switch>
      </Column>
    </Dialog>
  );
}

const Link = styled("span", {
  base: {
    textDecoration: "underline",
    overflowWrap: "anywhere",
  },
});

const Scrutinise = styled("span", {
  base: {
    display: "flex",
    flexDirection: "column",
    color: "var(--md-sys-color-error)",
  },
});
