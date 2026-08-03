import { createFormControl, createFormGroup } from "solid-forms";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { DefaultHost, useInstance } from "@revolt/instance";
import { Column, Dialog, DialogProps, Form2 } from "@revolt/ui";

import { Modals } from "../types";

const BaseForm = styled("form", {
  base: {
    "& h1:not(:first-of-type)": { marginTop: ".8em" },
    "& h1": { fontSize: "19pt" },
    "& h1 + *": { marginTop: "var(--gap-sm)" },
    "& p": { fontSize: "11pt" },
  },
});

const RE_URL = /^https?:\/\//;

export function AdvancedLoginModal(
  props: DialogProps & Modals & { type: "login_advanced" },
) {
  const { t } = useLingui();
  const instance = useInstance();

  const group = createFormGroup({
    host: createFormControl(instance.host),
  });

  function setOpts() {
    const host = group.controls.host.value,
      oldHost = instance.host || DefaultHost;
    let newHost = DefaultHost;

    if (host) {
      if (host.length > 32) throw "Invalid Instance URL";
      newHost = new URL(RE_URL.test(host) ? host : `https://${host}`).host;
    }

    //Switch instance
    if (newHost !== oldHost) instance.switchTo(newHost);
    else props.onClose();
  }

  const submit = Form2.useSubmitHandler(group, setOpts);

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Advanced</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>OK</Trans>,
          onClick: () => {
            setOpts();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <BaseForm onSubmit={submit}>
        <h1>
          <Trans>Instance Settings</Trans>
        </h1>
        <Column gap="lg">
          <p>
            <Trans>
              Use this option to connect to a <b>self-hosted</b> or{" "}
              <b>on-premise</b> instance.
            </Trans>
          </p>
          <p>
            <i>
              <Trans>
                <b>Warning:</b> Stoat is not responsible for content you access
                or upload through 3rd party instances, and does not guarantee
                moderation or user safety. For more info, please contact your
                3rd party instance's team.
              </Trans>
            </i>
          </p>
          <Form2.TextField
            name="host"
            control={group.controls.host}
            label={t`Instance`}
            placeholder={t`Defaults to ${DefaultHost}`}
          />
        </Column>
        <h1>
          <Trans>Proxy Settings</Trans>
        </h1>
        <p>
          <Trans>
            Stoat uses your browser or operating system's HTTP proxy
            configuration. To review, open system settings.
          </Trans>
        </p>
      </BaseForm>
    </Dialog>
  );
}
