import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { useTime } from "@revolt/i18n";
import { renderChangelogMarkdown } from "@revolt/markdown";
import { Column, Dialog, DialogProps } from "@revolt/ui";
import type { DialogAction } from "@revolt/ui/components/design/Dialog";

import { Modals } from "../types";

export interface ChangelogResponse {
  id: string;
  title: string;
  markdown_content: string;
  ios_version?: string;
  android_version?: string;
  web_version?: string;
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

const CHANGELOG_ENDPOINT = "https://changelog.stoat.chat/v1/changelogs/latest";

export async function fetchLatestChangelog(): Promise<ChangelogResponse | null> {
  try {
    const response = await fetch(CHANGELOG_ENDPOINT, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Partial<ChangelogResponse>;

    if (
      typeof data?.id !== "string" ||
      typeof data?.title !== "string" ||
      typeof data?.markdown_content !== "string" ||
      typeof data?.published_at !== "string"
    ) {
      return null;
    }

    return data as ChangelogResponse;
  } catch {
    return null;
  }
}

export function ChangelogModal(
  props: DialogProps & Modals & { type: "changelog" },
) {
  const dayjs = useTime();
  const actions: DialogAction[] = [{ text: <Trans>Close</Trans> }];

  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>What's new</Trans>}
      actions={actions}
    >
      <Column>
        <Subtitle>{dayjs(props.changelog.published_at).format("LL")}</Subtitle>
        <div>{renderChangelogMarkdown(props.changelog.markdown_content)}</div>
      </Column>
    </Dialog>
  );
}

const Subtitle = styled("span", {
  base: {
    marginBlockEnd: "var(--gap-md)",
    fontSize: "0.875rem",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});
