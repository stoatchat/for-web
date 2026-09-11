import { For, Show, createMemo } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { ServerMember } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";

import { Ripple, Text, typography } from "../../design";

import { ProfileCard } from "./ProfileCard";

export function ProfileRoles(props: {
  member?: ServerMember;
  /** Full width, height fits content (used in the floating user card) */
  fluid?: boolean;
}) {
  const { openModal } = useModals();

  const visibleRoles = createMemo(() =>
    props.member
      ? props.member.orderedRoles.filter((r) =>
          props.member?.server ? props.member.server.roles.has(r.id) : true,
        )
      : [],
  );

  function openRoles() {
    openModal({ type: "user_profile_roles", member: props.member! });
  }

  const rolesList = (
    <RoleList>
      <For each={visibleRoles().toReversed()}>
        {(role) => (
          <RolePill>
            <RoleIcon
              style={{
                background:
                  role.colour ?? "var(--md-sys-color-outline-variant)",
                "box-shadow": role.colour
                  ? `0 0 6px 0 ${role.colour}`
                  : undefined,
              }}
            />
            <Role style={{ color: role.colour || undefined }}>
              {role.name}
            </Role>
          </RolePill>
        )}
      </For>
    </RoleList>
  );

  return (
    <Show when={visibleRoles().length}>
      <ProfileCard
        isLink
        onClick={openRoles}
        width={props.fluid ? "full" : undefined}
      >
        <Ripple />

        <Text class="title" size={props.fluid ? "small" : "large"}>
          <Trans>Roles</Trans>
        </Text>
        <Show
          when={props.fluid}
          fallback={<div use:invisibleScrollable>{rolesList}</div>}
        >
          {rolesList}
        </Show>
      </ProfileCard>
    </Show>
  );
}

const RoleList = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--gap-xs)",
  },
});

const RolePill = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    minWidth: 0,
    maxWidth: "100%",
    gap: "var(--gap-xs)",
    padding: "4px 10px",
    borderRadius: "var(--borderRadius-full)",
    background: "var(--md-sys-color-surface-container)",
    transition: "background-color 0.15s ease, transform 0.15s ease",
    _hover: {
      background: "var(--md-sys-color-surface-container-high)",
      transform: "translateX(2px)",
    },
  },
});

const Role = styled("span", {
  base: {
    minWidth: 0,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    ...typography.raw({ class: "label" }),
  },
});

const RoleIcon = styled("div", {
  base: {
    flexShrink: 0,
    width: "8px",
    height: "8px",
    aspectRatio: "1/1",
    borderRadius: "100%",
  },
});
