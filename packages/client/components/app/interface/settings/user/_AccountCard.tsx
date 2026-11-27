import { Trans } from "@lingui/solid/macro";

import { useClient } from "@revolt/client";
import {
  Avatar,
  OverflowingText,
  Ripple,
  Symbol,
  typography,
} from "@revolt/ui";

import { Show } from "solid-js";
import { css, cva } from "styled-system/css";
import { pendingUpdate } from "../../../../../src/serviceWorkerInterface";
import { useSettingsNavigation } from "../Settings";
import {
  SidebarButton,
  SidebarButtonBase,
  SidebarButtonContent,
  SidebarButtonTitle,
} from "../_layout/SidebarButton";

/**
 * Account Card
 */
export function AccountCard() {
  const client = useClient();
  const { page, navigate } = useSettingsNavigation();

  return (
    <SidebarButton
      onClick={() => navigate("account")}
      aria-selected={page() === "account"}
    >
      <Ripple />
      <SidebarButtonTitle>
        <Avatar size={36} src={client().user!.animatedAvatarURL} />
        <SidebarButtonContent>
          <OverflowingText
            class={typography({ class: "label", size: "small" })}
          >
            {client().user!.displayName}
          </OverflowingText>
          <Trans>My Account</Trans>
        </SidebarButtonContent>
      </SidebarButtonTitle>
      {/*<SidebarButtonIcon>
        <Symbol size={20}>error</Symbol>
      </SidebarButtonIcon>*/}
    </SidebarButton>
  );
}

export function BackCard(props: { onClose?: () => void }) {
  return (
    <SidebarButton
      class={"back " + mobileOnly}
      onClick={props.onClose}
      noDrawer
    >
      <Ripple />
      <SidebarButtonTitle>
        <Symbol>arrow_back</Symbol>
        <SidebarButtonContent>
          <Trans>Back</Trans>
        </SidebarButtonContent>
      </SidebarButtonTitle>
    </SidebarButton>
  );
}

export function UpdateCard() {
  return (
    <Show when={pendingUpdate()}>
      <button
        style={{ overflow: "clip" }}
        class={css(SidebarButtonBase.raw(), UpdateSidebarButton.raw())}
        onClick={pendingUpdate()}
      >
        <div role="presentation" class={CTABackgroundOverlay()}>
          <Symbol>update</Symbol>
        </div>
        <Ripple />
        <SidebarButtonTitle>
          <SidebarButtonContent>
            <span class={typography({ class: "title", size: "medium" })}>
              <Trans>Update available</Trans>
            </span>
            <p class={typography({ class: "body" })}>
              <Trans>Click to update to the latest version</Trans>
            </p>
          </SidebarButtonContent>
        </SidebarButtonTitle>
      </button>
    </Show>
  );
}

const mobileOnly = css({
  display: "none",
  _tablet: { display: "flex" },
});

const UpdateSidebarButton = cva({
  base: {
    textAlign: "start",
    background: "var(--md-sys-color-tertiary-fixed-dim)",
    color: "var(--md-sys-color-on-tertiary-fixed)",
  },
});

const CTABackgroundOverlay = cva({
  base: {
    position: "absolute",
    opacity: "10%",
    color: "var(--md-sys-color-on-tertiary-fixed-variant)",
    transform: "scale(3) translateY(5px)",
  },
});
