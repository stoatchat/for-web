import { createFormControl, createFormGroup } from "solid-forms";
import { For, Match, Switch, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { t } from "@lingui/core/macro";
import { API, Message as MessageI, Server, User } from "revolt.js";
import { cva } from "styled-system/css";

import { Message } from "@revolt/app";
import {
  Avatar,
  Column,
  Dialog,
  DialogProps,
  Form2,
  Initials,
  MenuItem,
} from "@revolt/ui";

import { useModals } from "..";
import { Modals } from "../types";

import { TextEditor } from "@revolt/ui";
import { AutoCompleteSearchSpace } from "@revolt/ui/components/design/TextEditor";

const CONTENT_REPORT_REASONS: API.ContentReportReason[] = [
  "Illegal",
  "IllegalGoods",
  "IllegalExtortion",
  "IllegalPornography",
  "IllegalHacking",
  "ExtremeViolence",
  "PromotesHarm",
  "UnsolicitedSpam",
  "Raid",
  "SpamAbuse",
  "ScamsFraud",
  "Malware",
  "Harassment",
  "NoneSpecified",
];

const USER_REPORT_REASONS: API.UserReportReason[] = [
  "UnsolicitedSpam",
  "SpamAbuse",
  "InappropriateProfile",
  "Impersonation",
  "BanEvasion",
  "Underage",
  "NoneSpecified",
];

/**
 * Modal to report content
 */
export function ReportContentModal(
  props: DialogProps & Modals & { type: "report_content" },
) {
  const { showError } = useModals();

  const strings: Record<
    API.ContentReportReason | API.UserReportReason,
    string
  > = {
    Illegal: t`Content breaks one or more laws`,
    IllegalGoods: t`Drugs or illegal goods`,
    IllegalExtortion: t`Extortion or blackmail`,
    IllegalPornography: t`Revenge or underage pornography`,
    IllegalHacking: t`Illegal hacking or cracking`,
    ExtremeViolence: t`Extreme violence, gore or animal cruelty`,
    PromotesHarm: t`Promotes harm`,
    UnsolicitedSpam: t`Unsolicited advertising or spam`,
    Raid: t`Raid or spam attack`,
    SpamAbuse: t`Spam or similar platform abuse`,
    ScamsFraud: t`Scams or fraud`,
    Malware: t`Malware or phishing`,
    Harassment: t`Harassment or cyberbullying`,
    NoneSpecified: t`Other`,

    InappropriateProfile: t`User's profile has inappropriate content`,
    Impersonation: t`Impersonation`,
    BanEvasion: t`Ban evasion`,
    Underage: t`Not of minimum age to use the platform`,
  };

  const group = createFormGroup({
    category: createFormControl("", { required: true }),
    detail: createFormControl(""),
  });

  const reasons =
    props.target instanceof User ? USER_REPORT_REASONS : CONTENT_REPORT_REASONS;

  const [detailValue, setDetailValue] = createSignal(
    group.controls.detail.value,
  );

  const autoCompleteSpace: AutoCompleteSearchSpace = {
    users: props.client.users.toList(),
    channels: props.client.channels.toList(),
    roles: [],
    members: [],
  };

  async function onSubmit() {
    try {
      const category = group.controls.category.value;
      const detail = group.controls.detail.value;

      if (!category || (category === "NoneSpecified" && !detail)) {
        throw new Error("NoReasonProvided");
      }

      await props.client.api.post("/safety/report", {
        content:
          props.target instanceof User
            ? {
                type: "User",
                id: props.target.id,
                report_reason: category as API.UserReportReason,
                message_id: props.contextMessage?.id,
              }
            : props.target instanceof Server
              ? {
                  type: "Server",
                  id: props.target.id,
                  report_reason: category as API.ContentReportReason,
                }
              : {
                  type: "Message",
                  id: props.target.id,
                  report_reason: category as API.ContentReportReason,
                },
        additional_context: detail,
      });
      props.onClose();
    } catch (error) {
      showError(error);
    }
  }

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={
        <Switch>
          <Match when={props.target instanceof User}>
            <Trans>Tell us what's wrong with this user</Trans>
          </Match>
          <Match when={props.target instanceof Server}>
            <Trans>Tell us what's wrong with this server</Trans>
          </Match>
          <Match when={props.target instanceof MessageI}>
            <Trans>Tell us what's wrong with this message</Trans>
          </Match>
        </Switch>
      }
      actions={[
        { text: <Trans>Cancel</Trans> },
        {
          text: <Trans>Report</Trans>,
          onClick: () => {
            onSubmit();
            return false;
          },
          isDisabled: !Form2.canSubmit(group),
        },
      ]}
      isDisabled={group.isPending}
    >
      <form onSubmit={Form2.submitHandler(group, onSubmit)}>
        <Column gap="md">
          <div class={contentContainer()}>
            {props.target instanceof User ? (
              <Column align>
                <Avatar src={props.target.animatedAvatarURL} size={64} />
                {props.target.displayName}
              </Column>
            ) : props.target instanceof Server ? (
              <Column align>
                <Avatar
                  src={props.target.animatedIconURL}
                  fallback={<Initials input={props.target.name} />}
                  size={64}
                />
                {props.target.name}
              </Column>
            ) : (
              <Message message={props.target as never} />
            )}
          </div>

          <Form2.TextField.Select
            control={group.controls.category}
            placement="top"
          >
            <MenuItem value="">
              <Trans>Please select a reason</Trans>
            </MenuItem>
            <For each={reasons}>
              {(value) => <MenuItem value={value}>{strings[value]}</MenuItem>}
            </For>
          </Form2.TextField.Select>

          <Form2.TextField
            label={t`Give us some detail`}
            control={group.controls.detail}
          >
            <TextEditor
              initialValue={[detailValue()]}
              autoCompleteSearchSpace={autoCompleteSpace}
              placeholder={t`Provide more detail here...`}
              onChange={(value) => {
                setDetailValue(value);
                group.controls.detail.setValue(value);
              }}
            />
          </Form2.TextField>
        </Column>
      </form>
    </Dialog>
  );
}
const contentContainer = cva({
  base: {
    width: "100%",
    maxWidth: "100%",
    maxHeight: "50vh", 
    overflowY: "auto", 
    "& > div": {
      marginTop: "0 !important",
      pointerEvents: "none",
      userSelect: "none",
    },
  },
});
