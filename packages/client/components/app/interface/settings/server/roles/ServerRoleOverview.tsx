import { BiRegularListUl } from "solid-icons/bi";
import { Show, createMemo } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import {
  CategoryButton,
  Column,
  Draggable,
  Text,
  Tooltip,
  iconSize,
} from "@revolt/ui";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";

import MdDragIndicator from "@material-design-icons/svg/outlined/drag_indicator.svg?component-solid";
import MdGroupAdd from "@material-design-icons/svg/outlined/group_add.svg?component-solid";

import { useSettingsNavigation } from "../../Settings";

/**
 * Menu to see all roles
 */
export function ServerRoleOverview(props: { context: Server }) {
  const { navigate } = useSettingsNavigation();
  const { openModal, showError } = useModals();
  const { t } = useLingui();

  const change = useMutation(() => ({
    mutationFn: (order: string[]) => props.context.setRoleOrdering(order),
    onError: showError,
  }));

  function createRole() {
    openModal({
      type: "create_role",
      server: props.context,
      callback(roleId) {
        navigate(`roles/${roleId}`);
      },
    });
  }

  const originalAssignedRoleRanks = createMemo(() => {
    const member = props.context.member;
    if (!member) return [];
    const result = [];
    for (const id of member.roles) {
      const role = props.context.roles.get(id);
      if (role) {
        result.push({
          id: id,
          rank: role.rank ?? Infinity,
        });
      }
    }
    return result;
  });

  // Highest Rank is needed to determine which roles the user can manage.
  function getMyHighestRank() {
    const server = props.context;
    const member = server.member;

    if (member && member.user && member.user.id === server.ownerId) {
      return -Infinity;
    }

    const ranks = originalAssignedRoleRanks();
    if (ranks.length === 0) {
      return Infinity;
    }

    let minRank = Infinity;
    for (const r of ranks) {
      if (r.rank < minRank) {
        minRank = r.rank;
      }
    }
    return minRank;
  }

  function handleReorder(newOrder: string[]) {
    const roles = props.context.orderedRoles;
    const myRank = getMyHighestRank();

    let firstMovableIdx = -1;
    for (let i = 0; i < roles.length; i++) {
      const rank = roles[i].rank ?? Infinity;
      if (rank > myRank) {
        firstMovableIdx = i;
        break;
      }
    }
    if (firstMovableIdx === -1) return;

    const lockedIds = roles.slice(0, firstMovableIdx).map((r) => r.id);
    const movableIds = roles.slice(firstMovableIdx).map((r) => r.id);

    const newLocked = [];
    const newMovable = [];
    for (const id of newOrder) {
      if (lockedIds.includes(id)) {
        newLocked.push(id);
      } else if (movableIds.includes(id)) {
        newMovable.push(id);
      }
    }

    // If locked roles got moved, put them back at the top.
    if (newLocked.length < lockedIds.length) {
      change.mutate([...lockedIds, ...newMovable]);
      return;
    }
    // If locked section is unchanged, allow the new order.
    if (newLocked.join() === lockedIds.join()) {
      change.mutate([...newLocked, ...newMovable]);
    }
  }

  return (
    <Column gap="lg">
      <Column gap="sm">
        <CategoryButton
          icon={<BiRegularListUl size={20} />}
          action="chevron"
          description={<Trans>Affects all roles and users</Trans>}
          onClick={() => navigate("roles/default")}
        >
          <Trans>Default Permissions</Trans>
        </CategoryButton>
        <CategoryButton
          icon={<MdGroupAdd {...iconSize(20)} />}
          action="chevron"
          description={<Trans>Create a new role</Trans>}
          onClick={createRole}
        >
          <Trans>Create Role</Trans>
        </CategoryButton>
      </Column>

      <Column gap="sm">
        <Text class="label">
          <Trans>Server Roles</Trans>
          <Show when={change.isPending}>
            {" "}
            <Trans>(changes are being saved…)</Trans>
          </Show>
        </Text>
        <Draggable
          dragHandles
          items={props.context.orderedRoles}
          onChange={handleReorder}
        >
          {(entry) => {
            const server = props.context;
            const member = server.member;
            const isOwner = member && member.user?.id === server.ownerId;
            const myRank = getMyHighestRank();
            const roleRank = entry.item.rank ?? Infinity;
            // allow moving/editing for roles with a lower rank
            const canEdit = isOwner || myRank < roleRank;
            const tooltipMsg = canEdit
              ? undefined
              : t`You cannot move or adjust roles equal to or higher than your own.`;

            return tooltipMsg ? (
              <Tooltip content={tooltipMsg} placement="top">
                <ItemContainer>
                  <span
                    style={{
                      opacity: 0.35,
                      filter: "grayscale(1)",
                      "pointer-events": "none",
                    }}
                  >
                    <MdDragIndicator
                      style={{ cursor: "not-allowed" }}
                      {...createDragHandle(() => true, entry.setDragDisabled)}
                    />
                  </span>
                  <span
                    style={{
                      width: "100%",
                      opacity: 0.35,
                      filter: "grayscale(1)",
                    }}
                  >
                    <CategoryButton
                      icon={
                        <RoleIcon
                          style={{
                            background:
                              entry.item.colour ??
                              "var(--md-sys-color-outline-variant)",
                          }}
                        />
                      }
                      action="chevron"
                      disabled={true}
                    >
                      {entry.item.name}
                    </CategoryButton>
                  </span>
                </ItemContainer>
              </Tooltip>
            ) : (
              <ItemContainer>
                <MdDragIndicator
                  {...createDragHandle(
                    entry.dragDisabled,
                    entry.setDragDisabled,
                  )}
                />
                <CategoryButton
                  icon={
                    <RoleIcon
                      style={{
                        background:
                          entry.item.colour ??
                          "var(--md-sys-color-outline-variant)",
                      }}
                    />
                  }
                  action="chevron"
                  onClick={() => navigate(`roles/${entry.item.id}`)}
                >
                  {entry.item.name}
                </CategoryButton>
              </ItemContainer>
            );
          }}
        </Draggable>
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

const ItemContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-md)",
    paddingBottom: "var(--gap-md)",

    // grow the button to full width
    "& > :nth-child(2)": {
      flexGrow: 1,
    },
  },
});
