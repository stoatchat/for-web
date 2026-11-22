import { Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";

import {
  gifboxAdminUrl,
  gifboxReportUrl,
  gifboxViewUrl,
} from "@revolt/common/lib/gifbox";
import { useState } from "@revolt/state";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { ContextMenuButton } from "../ContextMenu";

/**
 * Context menu entries for a Gifbox GIF
 */
export function GifboxContextMenuItems(props: { id: string }) {
  const state = useState();

  return (
    <>
      <ContextMenuButton
        icon={<Symbol size={16}>open_in_new</Symbol>}
        onClick={() =>
          window.open(gifboxViewUrl(props.id), "_blank", "noopener")
        }
      >
        <Trans>Open in Gifbox</Trans>
      </ContextMenuButton>
      <ContextMenuButton
        icon={<Symbol size={16}>link</Symbol>}
        onClick={() => navigator.clipboard.writeText(gifboxViewUrl(props.id))}
      >
        <Trans>Copy link to GIF</Trans>
      </ContextMenuButton>
      <ContextMenuButton
        icon={<Symbol size={16}>report</Symbol>}
        onClick={() =>
          window.open(gifboxReportUrl(props.id), "_blank", "noopener")
        }
        destructive
      >
        <Trans>Report GIF</Trans>
      </ContextMenuButton>
      <Show when={state.settings.getValue("advanced:admin_panel")}>
        <ContextMenuButton
          icon={<Symbol size={16}>admin_panel_settings</Symbol>}
          onClick={() =>
            window.open(gifboxAdminUrl(props.id), "_blank", "noopener")
          }
        >
          <Trans>Gifbox Admin Panel</Trans>
        </ContextMenuButton>
      </Show>
    </>
  );
}
