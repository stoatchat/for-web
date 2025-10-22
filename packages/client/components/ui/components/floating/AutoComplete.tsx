import { For, JSX, Match, Switch } from "solid-js";

import { ServerMember } from "stoat.js";
import { styled } from "styled-system/jsx";

import { CustomEmoji, UnicodeEmoji } from "@revolt/markdown/emoji";
import { useState } from "@revolt/state";

import { AutoCompleteState } from "../../directives";
import { Avatar } from "../design";
import { Column } from "../layout";
import { ColouredText } from "../utils";

/**
 * Auto complete popup
 *
 * @deprecated use TextEditor instead
 */
export function AutoComplete(
  props: Exclude<JSX.Directives["floating"]["autoComplete"], undefined>,
) {
  const state = useState();
  const emoji_pack = state.settings.getValue("appearance:unicode_emoji");

  return (
    <Base>
      <Switch>
        <Match when={props.state().matched === "emoji"}>
          <For
            each={
              (props.state() as AutoCompleteState & { matched: "emoji" })
                .matches
            }
          >
            {(match, index) => (
              <Entry
                selected={index() === props.selection()}
                onMouseDown={() => props.select(index())}
                onMouseEnter={() => props.setSelection(index())}
              >
                <Switch
                  fallback={
                    <>
                      <UnicodeEmoji
                        emoji={(match as { codepoint: string }).codepoint}
                        pack={emoji_pack}
                      />{" "}
                      <Name>:{match.shortcode}:</Name>
                    </>
                  }
                >
                  <Match when={match.type === "custom"}>
                    <CustomEmoji id={(match as { id: string }).id} />{" "}
                    <Name>:{match.shortcode}:</Name>
                  </Match>
                </Switch>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state().matched === "user"}>
          <For
            each={
              (
                props.state() as AutoCompleteState & {
                  matched: "user";
                }
              ).matches
            }
          >
            {(match, index) => (
              <Entry
                selected={index() === props.selection()}
                onMouseDown={() => props.select(index())}
                onMouseEnter={() => props.setSelection(index())}
              >
                <Avatar src={match.user.animatedAvatarURL} size={24} />{" "}
                <Name>{match.user.displayName}</Name>
                {match.user instanceof ServerMember &&
                  match.user.displayName !== match.user.user?.username && (
                    <>
                      {" "}
                      @{match.user.user?.username}#
                      {match.user.user?.discriminator}
                    </>
                  )}
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state().matched === "role"}>
          <For
            each={
              (
                props.state() as AutoCompleteState & {
                  matched: "role";
                }
              ).matches
            }
          >
            {(match, index) => (
              <Entry
                selected={index() === props.selection()}
                onMouseDown={() => props.select(index())}
                onMouseEnter={() => props.setSelection(index())}
              >
                <Name>
                  <ColouredText colour={match.role.colour}>
                    {match.role.name}
                  </ColouredText>
                </Name>
              </Entry>
            )}
          </For>
        </Match>
        <Match when={props.state().matched === "channel"}>
          <For
            each={
              (
                props.state() as AutoCompleteState & {
                  matched: "channel";
                }
              ).matches
            }
          >
            {(match, index) => (
              <Entry
                selected={index() === props.selection()}
                onMouseDown={() => props.select(index())}
                onMouseEnter={() => props.setSelection(index())}
              >
                <Name>#{match.channel.name}</Name>
              </Entry>
            )}
          </For>
        </Match>
      </Switch>
    </Base>
  );
}

/**
 * Individual auto complete entry
 */
const Entry = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",

    cursor: "pointer",
    padding: "var(--gap-sm) var(--gap-md)",
    background: "transparent",
  },
  variants: {
    selected: {
      true: {
        background:
          "color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent)",
      },
    },
  },
});

/**
 * Entry name
 */
const Name = styled("div", {
  base: {
    fontSize: "0.9em",
  },
});

/**
 * Auto complete container
 */
const Base = styled(Column, {
  base: {
    "--emoji-size": "1.4em",
    padding: "var(--gap-md) 0",
    borderRadius: "var(--borderRadius-xs)",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container)",
    boxShadow: "0 0 3px var(--md-sys-color-shadow)",
  },
});
