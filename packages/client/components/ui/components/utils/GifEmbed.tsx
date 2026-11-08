import { useLingui } from "@lingui/solid/macro";
import { JSX, Match, Show, Switch } from "solid-js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { ImageEmbed, VideoEmbed, WebsiteEmbed } from "stoat.js";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { useModals } from "@revolt/modal";
import { useState } from "@revolt/state";
import { SizedContent, Symbol } from "@revolt/ui/components/utils";

export function Gif(props: {
  embed: ImageEmbed | VideoEmbed | WebsiteEmbed;
  preSized?: boolean;
}) {
  const { openModal } = useModals();
  const { message, reactPicker } = useMessage();

  const asWebsiteEmbed = () => props.embed as WebsiteEmbed;

  /**
   * Whether there is a video
   */
  const video = () =>
    (props.embed.type === "Video"
      ? (props.embed as VideoEmbed)
      : asWebsiteEmbed().video) || undefined;

  /**
   * Whether there is a image
   */
  const image = () =>
    (props.embed.type === "Image"
      ? (props.embed as ImageEmbed)
      : asWebsiteEmbed().image) || undefined;

  const gifFavouriteURL = () =>
    asWebsiteEmbed().originalUrl
      ? asWebsiteEmbed().originalUrl
      : (video()?.url ?? image()?.url);

  const gifPreviewURL = () => video()?.url || image()!.url;

  /**
   * Link to the page the embed came from (not the raw media)
   */
  const pageUrl = () =>
    props.embed.type === "Website"
      ? asWebsiteEmbed().originalUrl || asWebsiteEmbed().url
      : undefined;

  return (
    <GifFavouriterHolder>
      <GifFavouriter url={gifFavouriteURL()} preview={gifPreviewURL()} />
      <Switch>
        <Match when={image()}>
          <MaybeSizedContent
            preSized={props.preSized}
            width={image()!.width}
            height={image()!.height}
          >
            <img
              src={image()!.url}
              use:floating={{
                contextMenu: () => (
                  <MessageContextMenu
                    message={message}
                    reactPicker={reactPicker}
                    file={image()}
                    favourite={{
                      url: gifFavouriteURL()!,
                      name: gifFavouriteURL()!,
                      preview: gifPreviewURL()!,
                    }}
                  />
                ),
              }}
              loading="lazy"
              class={css({ cursor: "pointer" })}
              onClick={() =>
                openModal({
                  type: "image_viewer",
                  embed: image(),
                  originalUrl: pageUrl(),
                })
              }
            />
          </MaybeSizedContent>
        </Match>
        <Match when={video()}>
          <MaybeSizedContent
            preSized={props.preSized}
            width={video()!.width}
            height={video()!.height}
          >
            <video
              playsinline
              loop
              muted
              autoplay
              preload="metadata"
              src={video()!.url}
              use:floating={{
                contextMenu: () => (
                  <MessageContextMenu
                    message={message}
                    reactPicker={reactPicker}
                    file={video()}
                    favourite={{
                      url: gifFavouriteURL()!,
                      name: gifFavouriteURL()!,
                      preview: gifPreviewURL()!,
                    }}
                  />
                ),
              }}
              class={css({ cursor: "pointer" })}
              onClick={() =>
                openModal({
                  type: "image_viewer",
                  gif: video(),
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

export function GifFavouriter(props: { url?: string; preview?: string }) {
  const { favourites } = useState();
  const { t } = useLingui();

  return (
    <Show when={props.url}>
      {(url) => (
        <GifFavouriterSpan
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              favourites.toggleGif(url(), url(), props.preview);
            }
          }}
          aria-label={
            favourites.hasGif(url()) ? t`Unfavourite Gif` : t`Favourite Gif`
          }
          onClick={(e) => {
            e.stopPropagation();
            favourites.toggleGif(url(), url(), props.preview);
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
        >
          <Symbol fill={favourites.hasGif(url())}>star</Symbol>
        </GifFavouriterSpan>
      )}
    </Show>
  );
}

const GifFavouriterSpan = styled("span", {
  base: {
    position: "absolute",
    margin: "15px",
    padding: "var(--gap-sm)",
    backgroundColor: "var(--md-sys-color-surface-container-high)",
    borderRadius: "var(--borderRadius-sm)",
  },
});

export const GifFavouriterHolder = styled("div", {
  base: {
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
