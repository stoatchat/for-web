import { createFormControl, createFormGroup } from "solid-forms";
import { QRCodeSVG } from "solid-qr-code";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

/**
 * Wrapper element for the raw TOTP code
 */
const Code = styled("code", {
  base: {
    userSelect: "all",
  },
});

/**
 * Wrapper element for the QR code
 */
const Qr = styled("div", {
  base: {
    borderRadius: "4px",
    background: "white",
    width: "140px",
    height: "140px",
    display: "grid",
    placeItems: "center",
  },
});

/**
 * Modal to display QR code and secret key for MFA and accept the correct code
 */
export function MFAEnableTOTPModal(
  props: DialogProps & Modals & { type: "mfa_enable_totp" },
) {
  const { t } = useLingui();
  const { showError } = useModals();

  const group = createFormGroup({
    code: createFormControl("", { required: true }),
  });

  /**
   * Generate OTP URI
   */
  const uri = () =>
    `otpauth://totp/Stoat:${props.identifier}?secret=${props.secret}&issuer=Stoat`;

  async function onSubmit() {
    try {
      const code = group.controls.code.value.trim().replace(/\s/g, "");
      await props.callback(code);
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={() => {
        props.callback();
        props.onClose();
      }}
      title={<Trans>Enable authenticator app</Trans>}
      actions={[
        {
          text: <Trans>Cancel</Trans>,
          onClick() {
            props.callback();
          },
        },
        {
          text: <Trans>Continue</Trans>,
          onClick() {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column>
          <Text>
            <Trans>
              Please scan or use the token below in your authenticator app.
            </Trans>
          </Text>

          <Column align>
            <Qr>
              <QRCodeSVG
                value={uri()}
                backgroundColor="white"
                foregroundColor="black"
                level="medium"
                height={140}
                width={140}
                backgroundAlpha={1}
                foregroundAlpha={1}
              />
            </Qr>
            <Code>{props.secret}</Code>
          </Column>

          <Form2.TextField
            name="code"
            control={group.controls.code}
            label={t`Enter Code`}
          />
        </Column>
      </form>
    </Dialog>
  );
}
