import { For } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Dialog, DialogProps } from "@revolt/ui";

import { Modals } from "../types";

/**
 * Server selection item
 */
const ServerItem = styled("div", {
  base: {
    padding: "12px 16px",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "background-color 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "12px",

    "&:hover": {
      backgroundColor: "var(--md-sys-color-surface-container-high)",
    },

    "&:active": {
      backgroundColor: "var(--md-sys-color-surface-container-highest)",
    },
  },
});

/**
 * Server icon placeholder
 */
const ServerIcon = styled("div", {
  base: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "var(--md-sys-color-primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--md-sys-color-on-primary-container)",
    fontWeight: "bold",
    fontSize: "16px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  },
});

/**
 * Server info
 */
const ServerInfo = styled("div", {
  base: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
});

/**
 * Server name
 */
const ServerName = styled("div", {
  base: {
    fontSize: "16px",
    fontWeight: "500",
    color: "var(--md-sys-color-on-surface)",
  },
});

/**
 * Modal to select a server for invitation
 */
export function ServerSelectionModal(
  props: DialogProps & Modals & { type: "server_selection" },
) {
  return (
    <Dialog
      show={props.show}
      onClose={props.onClose}
      title={<Trans>Invite to Server</Trans>}
      actions={[
        {
          text: <Trans>Cancel</Trans>,
          onClick: () => props.onClose(),
        },
      ]}
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          gap: "8px",
          "max-height": "400px",
          "overflow-y": "auto",
          padding: "4px 0",
        }}
      >
        <For each={props.servers}>
          {(server) => (
            <ServerItem
              onClick={() => {
                props.onSelect(server.id);
                props.onClose();
              }}
            >
              <ServerIcon
                style={{
                  "background-image": server.animatedIconURL
                    ? `url('${server.animatedIconURL}')`
                    : server.iconURL
                      ? `url('${server.iconURL}')`
                      : undefined,
                }}
              >
                {!server.iconURL &&
                  !server.animatedIconURL &&
                  server.name.charAt(0).toUpperCase()}
              </ServerIcon>
              <ServerInfo>
                <ServerName>{server.name}</ServerName>
              </ServerInfo>
            </ServerItem>
          )}
        </For>
      </div>
    </Dialog>
  );
}
