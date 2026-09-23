import { For, Show, createMemo } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { Channel } from "stoat.js";
import { styled } from "styled-system/jsx";

import { CategoryButton, Column, Text, typography } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

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
      overrides: ordered?.filter(
        (role) =>
          countBits(props.context.rolePermissions?.[role.id]?.a || 0n) > 0 ||
          countBits(props.context.rolePermissions?.[role.id]?.d || 0n) > 0,
      ),
      withoutOverrides: ordered?.filter(
        (role) =>
          countBits(props.context.rolePermissions?.[role.id]?.a || 0n) === 0 &&
          countBits(props.context.rolePermissions?.[role.id]?.d || 0n) === 0,
      ),
    };
  });

  return (
    <Column gap="lg">
      <CategoryButton
        icon={<Symbol size={20}>public</Symbol>}
        action="chevron"
        description={
          <Trans>Permissions available when no role overrides apply</Trans>
        }
        onClick={() => navigate("permissions/default")}
      >
        <Trans>Everyone</Trans>
      </CategoryButton>

      <Column gap="sm">
        <Text class="label">
          <Trans>Role Overrides</Trans>
        </Text>
        <Show
          when={roles().overrides?.length}
          fallback={
            <EmptyState>
              <Trans>No role overrides have been configured.</Trans>
            </EmptyState>
          }
        >
          <For each={roles().overrides}>
            {(role) => (
              <CategoryButton
                icon={
                  <RoleIcon
                    style={{
                      background: role.colour ?? "transparent",
                      border: role.colour
                        ? undefined
                        : "2px dashed var(--md-sys-color-on-surface-variant)",
                    }}
                  />
                }
                iconBackground={!!role.colour}
                action="chevron"
                onClick={() => navigate(`permissions/${role.id}`)}
                description={
                  <Trans>
                    Grants{" "}
                    {countBits(props.context.rolePermissions![role.id].a)}{" "}
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
        </Show>
      </Column>

      <Column gap="sm">
        <Text class="label">
          <Trans>Roles with No Overrides</Trans>
        </Text>
        <Show
          when={roles().withoutOverrides?.length}
          fallback={
            <EmptyState>
              <Trans>All roles have overrides.</Trans>
            </EmptyState>
          }
        >
          <For each={roles().withoutOverrides}>
            {(role) => (
              <CategoryButton
                icon={
                  <RoleIcon
                    style={{
                      background: role.colour ?? "transparent",
                      border: role.colour
                        ? undefined
                        : "2px dashed var(--md-sys-color-on-surface-variant)",
                    }}
                  />
                }
                iconBackground={!!role.colour}
                action="chevron"
                onClick={() => navigate(`permissions/${role.id}`)}
                description={<Trans>No permissions set yet</Trans>}
              >
                {role.name}
              </CategoryButton>
            )}
          </For>
        </Show>
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

const EmptyState = styled("span", {
  base: {
    color: "var(--md-sys-color-on-surface-variant)",
    ...typography.raw({ class: "body", size: "medium" }),
  },
});
