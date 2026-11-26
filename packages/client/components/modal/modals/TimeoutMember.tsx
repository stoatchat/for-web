import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { createFormControl, createFormGroup } from "solid-forms";

import { Avatar, Column, Dialog, DialogProps, Form2, Text } from "@revolt/ui";

import { useDurationFormat } from "@revolt/i18n/durations";
import { css } from "styled-system/css";
import { useModals } from "..";
import { Modals } from "../types";

const DURATION_SECONDS = [
  "60",
  "300",
  "600",
  "3600",
  "86400",
  "604800",
] as const;

type DurationKey = (typeof DURATION_SECONDS)[number];

export function TimeoutMemberModal(
  props: DialogProps & Modals & { type: "timeout_member" },
) {
  const { showError } = useModals();

  const form = createFormGroup({
    duration: createFormControl<string>("60"),
  });

  const duration = useDurationFormat();

  const labels: Record<DurationKey, string> = {
    "60": duration({ minutes: 1 }, { style: "short" }),
    "300": duration({ minutes: 5 }, { style: "short" }),
    "600": duration({ minutes: 10 }, { style: "short" }),
    "3600": duration({ hours: 1 }, { style: "short" }),
    "86400": duration({ days: 1 }, { style: "short" }),
    "604800": duration({ weeks: 1 }, { style: "short" }),
  };

  const timeout = useMutation(() => ({
    mutationFn: () =>
      props.member.setTimeout(
        new Date(
          Date.now() + Number(form.controls.duration.value) * 1000,
        ).toISOString(),
      ),
    onError: showError,
  }));

  // TODO: Make it pretty on mobile
  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Timeout Member</Trans>}
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Timeout</Trans>,
          onClick: timeout.mutateAsync,
        },
      ]}
      isDisabled={timeout.isPending}
    >
      <Column gap="lg">
        <Column align gap="md">
          <Avatar src={props.member.user?.animatedAvatarURL} size={64} />
          <Text>
            <Trans>
              {props.member.user?.username} will not be able to interact with
              the server until the timeout expires.
            </Trans>
          </Text>
        </Column>

        <Column gap="s">
          <Text class="label">
            <Trans>Duration</Trans>
          </Text>

          <Form2.ButtonGroup
            control={form.controls.duration}
            buttonDefinitions={DURATION_SECONDS.map((key) => ({
              value: key,
              children: (
                <span class={css({ whiteSpace: "nowrap", fontSize: "0.9em" })}>
                  {labels[key as DurationKey]}
                </span>
              ),
            }))}
          />
        </Column>
      </Column>
    </Dialog>
  );
}
