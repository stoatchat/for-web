import { For, createMemo } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { CategoryButton, Column, Text } from "@revolt/ui";

import { useSettingsNavigation } from "../../Settings";

/**
 * Count set bits
 * @param v Number
 * @returns Set bits
 */
function countBits(v: bigint) {
  let bits = 0;
  for (let i = 0n; i < 52n; i++) {
    if (((1n << i) & v) === 1n << i) {
      bits++;
    }
  }

  return bits;
}

/**
 * Menu to select what permission set to change
 */
export function ChannelPermissionsOverview(props: { context: Channel }) {
  const { navigate } = useSettingsNavigation();

  const roles = createMemo(() => {
    const ordered = props.context.server?.orderedRoles;

    return {
      active: ordered?.filter(
        (role) =>
          countBits(props.context.rolePermissions?.[role.id]?.a || 0n) > 0 ||
          countBits(props.context.rolePermissions?.[role.id]?.d || 0n) > 0,
      ),
      unused: ordered?.filter(
        (role) =>
          countBits(props.context.rolePermissions?.[role.id]?.a || 0n) === 0 &&
          countBits(props.context.rolePermissions?.[role.id]?.d || 0n) === 0,
      ),
    };
  });

  return (
    <Column gap="lg">
      <CategoryButton
        icon="blank"
        action="chevron"
        description={<Trans>Affects all roles and users</Trans>}
        onClick={() => navigate("permissions/default")}
      >
        <Trans>Default Permissions</Trans>
      </CategoryButton>

      <Column gap="sm">
        <Text class="label">Role Permissions</Text>
        <For each={roles().active}>
          {(role) => (
            <CategoryButton
              icon={
                <RoleIcon
                  style={{
                    background:
                      role.colour ?? "var(--md-sys-color-outline-variant)",
                  }}
                />
              }
              action="chevron"
              onClick={() => navigate(`permissions/${role.id}`)}
              description={
                <Trans>
                  Grants {countBits(props.context.rolePermissions![role.id].a)}{" "}
                  permissions and denies{" "}
                  {countBits(props.context.rolePermissions![role.id].d)}{" "}
                  permissions
                </Trans>
              }
            >
              {role.name}
            </CategoryButton>
          )}
        </For>
      </Column>

      <Column gap="sm">
        <Text class="label">Unused Roles</Text>
        <For each={roles().unused}>
          {(role) => (
            <CategoryButton
              icon={
                <RoleIcon
                  style={{
                    background:
                      role.colour ?? "var(--md-sys-color-outline-variant)",
                  }}
                />
              }
              action="chevron"
              onClick={() => navigate(`permissions/${role.id}`)}
              description={<Trans>No permissions set yet</Trans>}
            >
              {role.name}
            </CategoryButton>
          )}
        </For>
      </Column>
    </Column>
  );
}

const RoleIcon = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    aspectRatio: "1/1",
    borderRadius: "100%",
  },
});
