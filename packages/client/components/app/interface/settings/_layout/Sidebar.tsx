import { Accessor, For, Setter, Show, onMount } from "solid-js";

import { styled } from "styled-system/jsx";

import { Column, OverflowingText, Ripple } from "@revolt/ui";

// import MdError from "@material-design-icons/svg/filled/error.svg?component-solid";
// import MdOpenInNew from "@material-design-icons/svg/filled/open_in_new.svg?component-solid";
import { SettingsList } from "..";
import { useSettingsNavigation } from "../Settings";

import {
  SidebarButton,
  SidebarButtonContent,
  SidebarButtonTitle,
} from "./SidebarButton";

/**
 * Settings Sidebar Layout
 */
export function SettingsSidebar(props: {
  list: Accessor<SettingsList<unknown>>;
  setPage: Setter<string | undefined>;
  page: Accessor<string | undefined>;
}) {
  const { navigate } = useSettingsNavigation();
  const list = props.list();

  /**
   * Select first page on load
   */
  onMount(() => {
    if (!props.page()) {
      props.setPage(list.entries[0].entries[0].id);
    }
  });

  return (
    <Base class="setSbBase">
      <div use:invisibleScrollable>
        <Content class="setSidebar">
          <Column gap="lg">
            {list.prepend}
            <For each={list.entries}>
              {(category) => (
                <Show when={!category.hidden}>
                  <Column>
                    <Show when={category.title}>
                      <CategoryTitle>{category.title}</CategoryTitle>
                    </Show>
                    <Column gap="s">
                      <For each={category.entries}>
                        {(entry) => (
                          <Show when={!entry.hidden}>
                            <SidebarButton
                              onClick={() => navigate(entry)}
                              aria-selected={
                                props.page()?.split("/")[0] ===
                                entry.id?.split("/")[0]
                              }
                            >
                              <Ripple />
                              <SidebarButtonTitle>
                                {entry.icon}
                                <SidebarButtonContent>
                                  <OverflowingText>
                                    {entry.title}
                                  </OverflowingText>
                                </SidebarButtonContent>
                              </SidebarButtonTitle>
                              {/*<SidebarButtonIcon>
                                <MdOpenInNew
                                  {...iconSize(20)}
                                  fill={theme!.colour("primary")}
                                />
                                <MdError
                                  {...iconSize(20)}
                                  fill={theme!.colour("primary")}
                                />
                              </SidebarButtonIcon>*/}
                            </SidebarButton>
                          </Show>
                        )}
                      </For>
                    </Column>
                  </Column>
                </Show>
              )}
            </For>
            {list.append}
          </Column>
        </Content>
      </div>
    </Base>
  );
}

/**
 * Base layout of the sidebar
 */
const Base = styled("div", {
  base: {
    display: "flex",
    flex: "1 0 218px",
    paddingLeft: "8px",
    justifyContent: "flex-end",
    height: "100%",
  },
});

/**
 * Aligned content within the sidebar
 */
const Content = styled("div", {
  base: {
    minWidth: "230px",
    maxWidth: "300px",
    padding: "74px 0 8px",
    display: "flex",
    gap: "2px",

    flexDirection: "column",

    "& a > div": {
      margin: 0,
    },
  },
});

/**
 * Titles for each category
 */
const CategoryTitle = styled("span", {
  base: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    textTransform: "uppercase",
    fontSize: "0.75rem",
    fontWeight: 700,
    margin: "0 8px",
    marginInlineEnd: "20px",

    color: "var(--md-sys-color-outline)",
  },
});
