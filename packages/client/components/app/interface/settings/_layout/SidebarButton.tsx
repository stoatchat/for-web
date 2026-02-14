import { styled } from "styled-system/jsx";

/**
 * Sidebar button
 */
export const SidebarButton = styled("a", {
  base: {
    // for <Ripple />:
    position: "relative",

    minWidth: 0,

    display: "flex",
    alignItems: "center",
    padding: "6px 8px",
    borderRadius: "8px",
    fontWeight: 500,
    marginInlineEnd: "12px",
    fontSize: "15px",
    userSelect: "none",
    transition: "background-color 0.1s ease-in-out",
    color: "var(--md-sys-color-on-surface)",
    fill: "var(--md-sys-color-on-surface)",
    background: "unset",

    "& svg": {
      flexShrink: 0,
    },
  },
  variants: {
    "aria-selected": {
      true: {
        background: "var(--md-sys-color-primary-container)",
      },
    },
    mobileOnly: {
      true: {
        "@media (min-width: 800px)": {display: "none"}
      }
    }
  },
});

export const SidebarButtonTitle = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexGrow: 1,
    minWidth: 0,
    paddingInlineEnd: "8px",
  },
});

export const SidebarButtonContent = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
});

export const SidebarButtonIcon = styled("div", {
  base: {
    display: "flex",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flexShrink: 0,
    gap: "2px",
  },
});
