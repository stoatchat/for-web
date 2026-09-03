import { For, JSX, Show } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { Column } from "../layout";
import { Symbol } from "../utils/Symbol";

import { Button } from "./Button";
import { Ripple } from "./Ripple";
import { Text } from "./Text";

/**
 * Colours offered before anyone reaches for the custom picker
 */
export const COLOUR_PALETTE = [
  [
    "#fca5a5",
    "#fdba74",
    "#fcd34d",
    "#86efac",
    "#6ee7b7",
    "#67e8f9",
    "#93c5fd",
    "#c4b5fd",
    "#f0abfc",
    "#f9a8d4",
    "#cbd5e1",
  ],
  [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#d946ef",
    "#ec4899",
    "#64748b",
  ],
  [
    "#991b1b",
    "#9a3412",
    "#854d0e",
    "#166534",
    "#065f46",
    "#155e75",
    "#1e40af",
    "#5b21b6",
    "#86198f",
    "#9d174d",
    "#334155",
  ],
] as const;

const PALETTE_VALUES: ReadonlySet<string> = new Set(COLOUR_PALETTE.flat());

/**
 * Pick a colour from a palette, from the system picker, or not at all
 */
export function ColourPicker(props: {
  /**
   * What is being coloured
   */
  label: JSX.Element;

  /**
   * Currently chosen colour, or null for whatever the default is
   */
  colour: string | null;

  /**
   * How to describe a swatch to a screen reader
   */
  swatchLabel?: (colour: string) => string;

  onChange: (colour: string | null) => void;
}) {
  const { t } = useLingui();

  function isSelected(colour: string) {
    return props.colour?.toLowerCase() === colour;
  }

  function isCustom() {
    const colour = props.colour?.toLowerCase();
    return !!colour && !PALETTE_VALUES.has(colour);
  }

  return (
    <ColourSelector gap="md">
      <Text class="label">{props.label}</Text>

      <ColourPalette>
        <For each={COLOUR_PALETTE}>
          {(row) => (
            <For each={row}>
              {(colour) => (
                <ColourSwatch
                  type="button"
                  selected={isSelected(colour)}
                  aria-label={
                    props.swatchLabel?.(colour) ?? t`Set colour to ${colour}`
                  }
                  aria-pressed={isSelected(colour)}
                  style={{ background: colour }}
                  onClick={() => props.onChange(colour)}
                >
                  <Ripple />
                </ColourSwatch>
              )}
            </For>
          )}
        </For>
      </ColourPalette>

      <ColourActions>
        <div style={{ position: "relative", display: "grid" }}>
          <Button
            size="sm"
            variant={isCustom() ? "tonal" : "outlined"}
            tabIndex={-1}
            aria-hidden="true"
          >
            <ColourActionContent>
              <Show
                when={isCustom()}
                fallback={
                  <Symbol size={20} marginRight="var(--gap-sm)">
                    palette
                  </Symbol>
                }
              >
                <ColourIndicator
                  style={{ background: props.colour ?? "transparent" }}
                />
              </Show>{" "}
              <Trans>Custom colour</Trans>
            </ColourActionContent>
          </Button>

          {/* the input sits over the button so that opening the browser's own
              picker is a real click on it, rather than something we ask for */}
          <input
            type="color"
            aria-label={t`Custom colour`}
            value={props.colour ?? "#ffffff"}
            onInput={(event) => props.onChange(event.currentTarget.value)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              padding: 0,
              border: "none",
              opacity: 0,
              cursor: "pointer",
            }}
          />
        </div>
        <Button
          size="sm"
          variant={props.colour === null ? "tonal" : "outlined"}
          onPress={() => props.onChange(null)}
        >
          <ColourActionContent>
            <NoColourIndicator /> <Trans>Default</Trans>
          </ColourActionContent>
        </Button>
      </ColourActions>
    </ColourSelector>
  );
}

const ColourSelector = styled(Column, {
  base: {
    width: "fit-content",
    maxWidth: "100%",
    flexShrink: 0,
  },
});

const ColourPalette = styled("div", {
  base: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(11, minmax(0, 36px))",
    gap: "var(--gap-sm)",
  },
});

const ColourSwatch = styled("button", {
  base: {
    width: "100%",
    aspectRatio: "1 / 1",
    padding: 0,
    border: 0,
    borderRadius: "50%",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "border-radius 200ms cubic-bezier(0.2, 0, 0, 1)",

    _focusVisible: {
      outline: "2px solid var(--md-sys-color-on-surface)",
      outlineOffset: "2px",
    },
  },
  variants: {
    selected: {
      true: {
        borderRadius: "var(--borderRadius-md)",
      },
    },
  },
});

const ColourActions = styled("div", {
  base: {
    width: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "var(--gap-sm)",
    position: "relative",
  },
});

const ColourActionContent = styled("span", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--gap-sm)",

    "& svg": {
      width: "20px",
      height: "20px",
    },
  },
});

const ColourIndicator = styled("span", {
  base: {
    width: "18px",
    height: "18px",
    flexShrink: 0,
    borderRadius: "50%",
    marginRight: "var(--gap-sm)",
  },
});

const NoColourIndicator = styled(ColourIndicator, {
  base: {
    border: "2px solid var(--md-sys-color-outline)",
  },
});
