import { createSignal, For, Match, Show, Switch } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useUser } from "@revolt/client";
import {
  UNICODE_EMOJI_PACKS,
  UnicodeEmoji,
  UnicodeEmojiPacks,
} from "@revolt/markdown/emoji/UnicodeEmoji";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import {
  Avatar,
  Button,
  Checkbox,
  Column,
  FloatingSelect,
  IconButton,
  MenuItem,
  MessageContainer,
  Row,
  Slider,
  Text,
} from "@revolt/ui";
import {
  FONT_KEYS,
  FONTS,
  Fonts,
  MONOSPACE_FONT_KEYS,
  MONOSPACE_FONTS,
  MonospaceFonts,
} from "@revolt/ui/themes/fonts";

import MDPalette from "@material-design-icons/svg/outlined/palette.svg?component-solid";
import SDCornerCircular from "../../../../../../public/assets/icons/corner_circular.svg?component-solid";
import SDCornerOther from "../../../../../../public/assets/icons/corner_other.svg?component-solid";
import SDCornerRounded from "../../../../../../public/assets/icons/corner_rounded.svg?component-solid";
import SDCornerSharp from "../../../../../../public/assets/icons/corner_sharp.svg?component-solid";

/**
 * All appearance options for the client
 */
export function AppearanceMenu() {
  const user = useUser();
  const state = useState();
  const { t } = useLingui();
  const [pickerRef, setPickerRef] = createSignal<HTMLDivElement>();
  const { openModal } = useModals();

  function loadFonts() {
    for (const f in FONTS) FONTS[f as Fonts].load();
  }

  function loadMonoFonts() {
    for (const f in MONOSPACE_FONTS)
      MONOSPACE_FONTS[f as MonospaceFonts].load();
  }

  return (
    <Column gap="lg">
      <MessagePreview>
        <Text>
          Welcome to the new appearance menu, custom themes are not available
          just yet but we are looking for feedback on how to best implement
          them!
        </Text>
      </MessagePreview>

      <Column>
        <Text class="title" size="small">
          Colours
        </Text>

        <Row justify="stretch">
          <Button
            group="connected-start"
            groupActive={state.theme.mode === "light"}
            onPress={() => state.theme.setMode("light")}
          >
            <Trans>Light</Trans>
          </Button>
          <Button
            group="connected"
            groupActive={state.theme.mode === "dark"}
            onPress={() => state.theme.setMode("dark")}
          >
            <Trans>Dark</Trans>
          </Button>
          <Button
            group="connected-end"
            groupActive={state.theme.mode === "system"}
            onPress={() => state.theme.setMode("system")}
          >
            <Trans>System</Trans>
          </Button>
        </Row>

        {/* <Row justify="stretch">
          <Button
            group="connected-start"
            groupActive={state.theme.preset === "stoat"}
            onPress={() => state.theme.setPreset("stoat")}
          >
            <Trans>Stoat</Trans>
          </Button>
          <Button
            group="connected-end"
            groupActive={state.theme.preset === "you"}
            onPress={() => state.theme.setPreset("you")}
          >
            <Trans>Material You</Trans>
          </Button>
        </Row> */}

        <Show when={state.theme.preset === "you"}>
          <Row align justify wrap>
            <IconButton
              ref={setPickerRef}
              variant="filled"
              shape="square"
              size="md"
              onPress={() => pickerRef()?.click()}
            >
              <MDPalette />
            </IconButton>
            <input
              ref={setPickerRef}
              type="color"
              value={state.theme.m3Accent ?? "#ffffff"}
              onInput={(e) => {
                const colour = (e.currentTarget as HTMLInputElement).value;
                state.theme.setM3Accent(colour);
              }}
              style={{
                position: "absolute",
                opacity: 0,
                width: "0px",
                height: "0px",
                padding: 0,
                border: "none",
              }}
            />
            <For
              each={[
                "#FF5733",
                "#ffdc2f",
                "#9bf088",
                "#54ecc1",
                "#549bec",
                "#5470ec",
                "#8C5FD3",
              ]}
            >
              {(colour) => (
                <Button
                  size="md"
                  bg={colour}
                  group="standard"
                  groupActive={state.theme.m3Accent === colour}
                  onPress={() => state.theme.setM3Accent(colour)}
                />
                // <div
                //   class={css({
                //     borderRadius: "var(--borderRadius-full)",
                //     width: "48px",
                //     height: "48px",
                //     cursor: "pointer",
                //   })}
                //   style={{ "background-color": colour }}
                //   onClick={() => state.theme.setM3Accent(colour)}
                // />
              )}
            </For>
            {/* <div
            class={css({
              borderRadius: "var(--borderRadius-full)",
              width: "48px",
              height: "48px",
              cursor: "pointer",
            })}
          >
            <MdColorize />
          </div> */}
          </Row>

          {/* TODO: Cursed on mobile; may need to be replaced
          with FloatingSelect / similar on small screens */}
          <Row justify="stretch">
            <Button
              size="xs"
              group="connected-start"
              groupActive={state.theme.m3Contrast.toFixed(1) === "-1.0"}
              onPress={() => state.theme.setM3Contrast(-1.0)}
            >
              <Trans>Reduced</Trans>
            </Button>
            <Button
              size="xs"
              group="connected"
              groupActive={state.theme.m3Contrast.toFixed(1) === "0.0"}
              onPress={() => state.theme.setM3Contrast(0)}
            >
              <Trans>Normal</Trans>
            </Button>
            <Button
              size="xs"
              group="connected"
              groupActive={state.theme.m3Contrast.toFixed(1) === "0.5"}
              onPress={() => state.theme.setM3Contrast(0.5)}
            >
              <Trans>More Contrast</Trans>
            </Button>
            <Button
              size="xs"
              group="connected-end"
              groupActive={state.theme.m3Contrast.toFixed(1) === "1.0"}
              onPress={() => state.theme.setM3Contrast(1.0)}
            >
              <Trans>High Contrast</Trans>
            </Button>
          </Row>

          <Row justify="stretch">
            <Button
              size="xs"
              group="connected-start"
              groupActive={state.theme.m3Variant === "monochrome"}
              onPress={() => state.theme.setM3Variant("monochrome")}
            >
              <Trans>Monochrome</Trans>
            </Button>
            <Button
              size="xs"
              group="connected"
              groupActive={state.theme.m3Variant === "neutral"}
              onPress={() => state.theme.setM3Variant("neutral")}
            >
              <Trans>Neutral</Trans>
            </Button>
            <Button
              size="xs"
              group="connected"
              groupActive={state.theme.m3Variant === "tonal_spot"}
              onPress={() => state.theme.setM3Variant("tonal_spot")}
            >
              <Trans>Tonal Spot</Trans>
            </Button>
            {/* <Button
            size="xs"
            group="connected"
            groupActive={state.theme.m3Variant === "vibrant"}
            onPress={() => state.theme.setM3Variant("vibrant")}
          >
            <Trans>Vibrant</Trans>
          </Button>
          <Button
            size="xs"
            group="connected"
            groupActive={state.theme.m3Variant === "expressive"}
            onPress={() => state.theme.setM3Variant("expressive")}
          >
            <Trans>Expressive</Trans>
          </Button>
          <Button
            size="xs"
            group="connected"
            groupActive={state.theme.m3Variant === "fidelity"}
            onPress={() => state.theme.setM3Variant("fidelity")}
          >
            <Trans>Fidelity</Trans>
          </Button>
          <Button
            size="xs"
            group="connected"
            groupActive={state.theme.m3Variant === "content"}
            onPress={() => state.theme.setM3Variant("content")}
          >
            <Trans>Content</Trans>
          </Button>
          <Button
            size="xs"
            group="connected"
            groupActive={state.theme.m3Variant === "rainbow"}
            onPress={() => state.theme.setM3Variant("rainbow")}
          >
            <Trans>Rainbow</Trans>
          </Button> */}
            <Button
              size="xs"
              group="connected-end"
              groupActive={state.theme.m3Variant === "fruit_salad"}
              onPress={() => state.theme.setM3Variant("fruit_salad")}
            >
              <Trans>Fruit Salad</Trans>
            </Button>
          </Row>
        </Show>
      </Column>

      <Column>
        <Text class="title" size="small">
          <Trans>Display & Text</Trans>
        </Text>

        <Checkbox checked={state.theme.blur} onChange={state.theme.toggleBlur}>
          <Trans>
            Enable transparency glass/blur effects (slow on older machines)
          </Trans>
        </Checkbox>

        <Preview>
          <MessagePreview>
            <MessageContainer
              avatar={
                <Avatar
                  size={36}
                  src={user()?.animatedAvatarURL}
                  fallback={user()?.displayName}
                />
              }
              timestamp={new Date()}
              username={user()?.displayName}
              pronouns={user()?.pronouns}
              isLink="hide"
            >
              Sphinx of black quartz, judge my vow
            </MessageContainer>
            <MessageContainer
              avatar={<Avatar size={36} fallback={"M"} />}
              timestamp={new Date()}
              username={"MysticPixie"}
              isLink="hide"
            >
              <code class={css({ fontFamily: `var(--fonts-monospace)` })}>
                The quick brown fox jumped over the lazy dog
              </code>
            </MessageContainer>
          </MessagePreview>
        </Preview>

        <Text class="label">
          <Trans>Message Size</Trans>
        </Text>
        <Slider
          min={12}
          max={24}
          value={state.theme.messageSize}
          onInput={(event) =>
            (state.theme.messageSize = event.currentTarget.value)
          }
        />
      </Column>

      <Text class="label">
        <Trans>Message Group Spacing</Trans>
      </Text>
      <Slider
        min={0}
        max={16}
        value={state.theme.messageGroupSpacing}
        onInput={(event) =>
          (state.theme.messageGroupSpacing = event.currentTarget.value)
        }
      />

      <Text class="label">
        <Trans>Profile Picture shape</Trans>
      </Text>
      <Row justify="stretch">
        <Button
          group="standard"
          groupActive={state.theme.avatarRadius === 0}
          onPress={() => (state.theme.avatarRadius = 0)}
        >
          <Row align>
            <SDCornerSharp width={25} height={25} />
            <Trans>Sharp</Trans>
          </Row>
        </Button>
        <Button
          group="standard"
          groupActive={state.theme.avatarRadius === 15}
          onPress={() => (state.theme.avatarRadius = 15)}
        >
          <Row align>
            <SDCornerRounded width={25} height={25} />
            <Trans>Rounded</Trans>
          </Row>
        </Button>
        <Button
          group="standard"
          groupActive={state.theme.avatarRadius === 50}
          onPress={() => (state.theme.avatarRadius = 50)}
        >
          <Row align>
            <SDCornerCircular width={25} height={25} />
            <Trans>Circular</Trans>
          </Row>
        </Button>
        <Button
          group="standard"
          groupActive={
            (state.theme.avatarRadius > 0 && state.theme.avatarRadius < 15) ||
            (state.theme.avatarRadius > 15 && state.theme.avatarRadius < 50)
          }
          onPress={() => openModal({ type: "avatar_radius" })}
        >
          <Row align>
            <SDCornerOther width={25} height={25} />
            <Trans>Custom</Trans>
          </Row>
        </Button>
      </Row>

      <Text class="label">
        <Trans>Interface Font</Trans>
      </Text>
      <FloatingSelect
        label={t`Interface Font`}
        value={state.theme.interfaceFont}
        onChange={(e) =>
          state.theme.setInterfaceFont(e.currentTarget.value as Fonts)
        }
        onOpened={loadFonts}
      >
        <For each={FONT_KEYS}>
          {(key) => (
            <MenuItem value={key} style={{ "font-family": key }}>
              {key}
            </MenuItem>
          )}
        </For>
      </FloatingSelect>

      <FloatingSelect
        label={t`Monospace Font`}
        value={state.theme.monospaceFont}
        onChange={(e) =>
          state.theme.setMonospaceFont(e.currentTarget.value as MonospaceFonts)
        }
        onOpened={loadMonoFonts}
      >
        <For each={MONOSPACE_FONT_KEYS}>
          {(key) => (
            <MenuItem value={key} style={{ "font-family": key }}>
              {key}
            </MenuItem>
          )}
        </For>
      </FloatingSelect>

      <Column>
        <Text class="title" size="small">
          <Trans>Chat Input</Trans>
        </Text>

        <Checkbox
          checked={state.settings.getValue("appearance:show_send_button")}
          onChange={(event) =>
            state.settings.setValue(
              "appearance:show_send_button",
              event.currentTarget.checked,
            )
          }
        >
          <Trans>Show send message button</Trans>
        </Checkbox>

        <FloatingSelect
          label={t`Emoji Pack (affects your messages only)`}
          value={state.settings.getValue("appearance:unicode_emoji")}
          onChange={(e) =>
            state.settings.setValue(
              "appearance:unicode_emoji",
              e.currentTarget.value as never,
            )
          }
        >
          <For each={UNICODE_EMOJI_PACKS}>
            {(pack) => <EmojiPack pack={pack} />}
          </For>
        </FloatingSelect>
      </Column>
    </Column>
  );
}

/**
 * Render an individual emoji pack
 * @param pack Pack
 */
function EmojiPack(props: { pack: UnicodeEmojiPacks }) {
  return (
    <MenuItem value={props.pack}>
      <Row>
        <UnicodeEmoji emoji="😃" pack={props.pack} />
        <UnicodeEmoji emoji="😂" pack={props.pack} />
        <UnicodeEmoji emoji="😶‍🌫️" pack={props.pack} />
        <UnicodeEmoji emoji="🤨" pack={props.pack} />
        <UnicodeEmoji emoji="🤔" pack={props.pack} />
        <Switch>
          <Match when={props.pack === "fluent-3d"}>Fluent 3D</Match>
          <Match when={props.pack === "fluent-color"}>Fluent Color</Match>
          <Match when={props.pack === "fluent-flat"}>Fluent Flat</Match>
          <Match when={props.pack === "mutant"}>Mutant Remix</Match>
          <Match when={props.pack === "noto"}>Noto</Match>
          {/* <Match when={props.pack === "openmoji"}>OpenMoji</Match> */}
          <Match when={props.pack === "twemoji"}>Twemoji</Match>
        </Switch>
      </Row>
    </MenuItem>
  );
}

const Preview = styled("div", {
  base: {
    height: "126px",
    overflow: "hidden",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface-container-lowest)",
  },
});

const MessagePreview = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md)",
    gap: "var(--message-group-spacing)",
  },
});
