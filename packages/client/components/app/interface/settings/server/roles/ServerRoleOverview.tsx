import { onCleanup, onMount, Show } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  Avatar,
  CategoryButton,
  Column,
  Draggable,
  Fab,
  Row,
  Text,
  Tooltip,
} from "@revolt/ui";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdDragIndicator from "@material-design-icons/svg/outlined/drag_indicator.svg?component-solid";

import { css } from "styled-system/css";
import { useSettingsNavigation } from "../../Settings";

/**
 * Menu to see all roles
 */
export function ServerRoleOverview(props: { context: Server }) {
  const { navigate, registerAction } = useSettingsNavigation();
  const { openModal, showError, closeAll } = useModals();
  const { t } = useLingui();
  const client = useClient();

  // Previewing needs the same access as the server context menu entry
  const canViewAs = () =>
    props.context.owner?.self || props.context.havePermission("ManageRole");

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

  let unregisterAction: (() => void) | undefined;

  onMount(() => {
    unregisterAction = registerAction(() => (
      <Fab variant="primary" onClick={createRole}>
        <Symbol slot="icon" size={24}>
          add
        </Symbol>
      </Fab>
    ));
  });

  onCleanup(() => unregisterAction?.());

  return (
    <Column gap="lg">
      <Column gap="sm">
        <Text class="label">
          <Trans>Server Roles</Trans>
          <Show when={change.isPending}>
            {" "}
            <Trans>(changes are being saved…)</Trans>
          </Show>
        </Text>
        <div
          class={css({
            marginTop: "var(--gap-sm)",
            _tablet: { paddingBlockEnd: "80px" },
          })}
        >
          <Draggable
            dragHandles
            items={props.context.orderedRoles}
            onChange={change.mutate}
          >
            {(entry) => (
              <ItemContainer>
                <MdDragIndicator
                  fill="var(--md-sys-color-on-surface)"
                  {...createDragHandle(
                    entry.dragDisabled,
                    entry.setDragDisabled,
                  )}
                />

                <CategoryButton
                  icon={
                    <RoleIcon
                      style={{
                        background: entry.item.colour || "transparent",
                        border: entry.item.colour
                          ? undefined
                          : "2px dashed var(--md-sys-color-on-surface-variant)",
                      }}
                    />
                  }
                  iconBackground={!!entry.item.colour}
                  action={[
                    <Show
                      when={
                        canViewAs() &&
                        entry.item.rank! >
                          (props.context.member?.realRanking ?? Infinity)
                      }
                    >
                      <Tooltip content={t`View server as role`} placement="top">
                        <ViewAsAction
                          type="button"
                          aria-label={t`View server as role`}
                          onClick={(event) => {
                            event.stopPropagation();
                            client().setViewAs(props.context.id, [
                              entry.item.id,
                            ]);
                            closeAll();
                          }}
                        >
                          <Symbol size={20}>visibility</Symbol>
                        </ViewAsAction>
                      </Tooltip>
                    </Show>,
                    "chevron",
                  ]}
                  onClick={() => navigate(`roles/${entry.item.id}`)}
                >
                  <Row>
                    {entry.item.name}{" "}
                    <Show when={entry.item.icon}>
                      <Avatar
                        shape="rounded-square"
                        src={entry.item.icon!.previewUrl}
                        size={24}
                      />
                    </Show>
                  </Row>
                </CategoryButton>
              </ItemContainer>
            )}
          </Draggable>
          <ItemContainer>
            <DragHandleSpacer />
            <CategoryButton
              icon={<Symbol size={20}>public</Symbol>}
              action={[
                <Show when={canViewAs()}>
                  <Tooltip content={t`View server as role`} placement="top">
                    <ViewAsAction
                      type="button"
                      aria-label={t`View server as role`}
                      onClick={(event) => {
                        event.stopPropagation();
                        client().setViewAs(props.context.id);
                        closeAll();
                      }}
                    >
                      <Symbol size={20}>visibility</Symbol>
                    </ViewAsAction>
                  </Tooltip>
                </Show>,
                "chevron",
              ]}
              description={
                <Trans>Permissions available without any role</Trans>
              }
              onClick={() => navigate("roles/default")}
            >
              <Trans>Everyone</Trans>
            </CategoryButton>
          </ItemContainer>
        </div>
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

const ViewAsAction = styled("button", {
  base: {
    display: "flex",
    cursor: "pointer",
    padding: "var(--gap-sm)",
    border: "none",
    borderRadius: "var(--borderRadius-full)",
    color: "inherit",
    background: "transparent",
    "&:focus-visible": {
      outline: "2px solid var(--md-sys-color-primary)",
    },
  },
});

const DragHandleSpacer = styled("div", {
  base: {
    width: "24px",
    flexShrink: 0,
  },
});
