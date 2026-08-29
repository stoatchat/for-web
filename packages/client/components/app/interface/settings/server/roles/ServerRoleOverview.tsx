import { onCleanup, onMount, Show } from "solid-js";

import { Trans } from "@lingui/solid/macro";
import { useMutation } from "@tanstack/solid-query";
import { Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useModals } from "@revolt/modal";
import {
  Avatar,
  CategoryButton,
  Column,
  Draggable,
  Fab,
  Row,
  Text,
} from "@revolt/ui";
import { createDragHandle } from "@revolt/ui/components/utils/Draggable";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import MdDragIndicator from "@material-design-icons/svg/outlined/drag_indicator.svg?component-solid";

import { css } from "styled-system/css";
import { useSettingsNavigation } from "../../Settings";

/**
 * Placeholder name given to a freshly created role.
 *
 * Deliberately not translated: it is written to the server as real role
 * data, so it must not depend on the creator's locale.
 */
const DEFAULT_ROLE_NAME = "New role";

/**
 * Menu to see all roles
 */
export function ServerRoleOverview(props: { context: Server }) {
  const { navigate, registerAction } = useSettingsNavigation();
  const { showError } = useModals();

  const change = useMutation(() => ({
    mutationFn: (order: string[]) => props.context.setRoleOrdering(order),
    onError: showError,
  }));

  /**
   * Create a role and open its editor straight away.
   *
   * Asking for a name in a modal first added a step for something the editor
   * already asks for, so the role is created with a placeholder name that the
   * editor's own name field is there to replace.
   */
  const create = useMutation(() => ({
    mutationFn: () => props.context.createRole(DEFAULT_ROLE_NAME),
    onSuccess: (created) => navigate(`roles/${created.id}`),
    onError: showError,
  }));

  function createRole() {
    if (!create.isPending) create.mutate();
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
                  action="chevron"
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
              action="chevron"
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

const DragHandleSpacer = styled("div", {
  base: {
    width: "24px",
    flexShrink: 0,
  },
});
