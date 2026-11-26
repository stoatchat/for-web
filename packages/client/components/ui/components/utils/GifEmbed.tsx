import { useLingui } from "@lingui/solid/macro";
import { JSX, Match, Show, Switch } from "solid-js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { WebsiteEmbed } from "stoat.js";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { SizedContent, Symbol } from "@revolt/ui/components/utils";

export function Gif(props: {
  gif: WebsiteEmbed;
  preSized?: boolean;
  noModal?: boolean;
  /**
   * Still frame shown while a video loads
   */
  poster?: string;
}) {
  const { openModal } = useModals();
  const { message, reactPicker } = useMessage();

  /**
   * Link to the page the embed came from (not the raw media)
   */
  const pageUrl = () =>
    props.gif.type === "Website"
      ? props.gif.originalUrl || props.gif.url
      : undefined;

  return (
    <GifFavouriterHolder>
      <GifFavouriter gif={props.gif} />
      <Switch>
        <Match when={props.gif.image}>
          <MaybeSizedContent
            preSized={props.preSized}
            width={props.gif.image!.width}
            height={props.gif.image!.height}
          >
            <img
              src={props.gif.image!.url}
              use:floating={{
                contextMenu: () => (
                  <MessageContextMenu
                    message={message}
                    reactPicker={reactPicker}
                    file={props.gif.image}
                    gif={props.gif}
                  />
                ),
              }}
              loading="lazy"
              class={css({ cursor: "pointer" })}
              onClick={() =>
                !props.noModal &&
                openModal({
                  type: "image_viewer",
                  gif: props.gif,
                  originalUrl: pageUrl(),
                })
              }
            />
          </MaybeSizedContent>
        </Match>
        <Match when={props.gif.video}>
          <MaybeSizedContent
            preSized={props.preSized}
            width={props.gif.video!.width}
            height={props.gif.video!.height}
          >
            <video
              playsinline
              loop
              muted
              autoplay
              preload="metadata"
              poster={props.poster}
              src={props.gif.video!.url}
              use:floating={{
                contextMenu: () => (
                  <MessageContextMenu
                    message={message}
                    reactPicker={reactPicker}
                    file={props.gif.video}
                    gif={props.gif}
                  />
                ),
              }}
              class={css({ cursor: "pointer" })}
              onClick={() =>
                !props.noModal &&
                openModal({
                  type: "image_viewer",
                  gif: props.gif,
                  originalUrl: pageUrl(),
                })
              }
            />
          </MaybeSizedContent>
        </Match>
      </Switch>
    </GifFavouriterHolder>
  );
}

function MaybeSizedContent(props: {
  preSized?: boolean;
  children: JSX.Element;
  width: number;
  height: number;
}) {
  return (
    <Show
      when={props.preSized}
      fallback={
        <SizedContent width={props.width} height={props.height}>
          {props.children}
        </SizedContent>
      }
    >
      {props.children}
    </Show>
  );
}

export function GifFavouriter(props: { gif: WebsiteEmbed }) {
  const { favourites } = useState();
  const { t } = useLingui();

  return (
    <Show when={props.gif}>
      {(gif) => (
        <GifFavouriterSpan
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              favourites.toggleGif(gif());
            }
          }}
          aria-label={
            favourites.hasGif(gif()) ? t`Unfavourite GIF` : t`Favourite GIF`
          }
          onClick={(e) => {
            e.stopPropagation();
            favourites.toggleGif(gif());
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
        >
          <Symbol fill={favourites.hasGif(gif())}>star</Symbol>
        </GifFavouriterSpan>
      )}
    </Show>
  );
}

const GifFavouriterSpan = styled("span", {
  base: {
    position: "absolute",
    margin: "var(--gap-lg)",
    padding: "var(--gap-sm)",
    backgroundColor: "var(--md-sys-color-surface-container-high)",
    borderRadius: "var(--borderRadius-sm)",
  },
});

export const GifFavouriterHolder = styled("div", {
  base: {
    position: "relative",
    "& > span": {
      display: "none",
    },
    _hover: {
      "& > span": {
        display: "inline-block",
      },
    },
    _focusWithin: {
      "& > span": {
        display: "inline-block",
      },
    },
  },
});
