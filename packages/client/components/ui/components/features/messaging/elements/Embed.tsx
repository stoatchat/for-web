import { Match, Show, Switch } from "solid-js";

import {
  ImageEmbed,
  MessageEmbed,
  TextEmbed as TextEmbedClass,
  VideoEmbed,
  WebsiteEmbed,
} from "stoat.js";
import { css } from "styled-system/css";

import { isGifBox, isGif as isGifLib } from "@revolt/common/lib/gifs";
import { useModals } from "@revolt/modal";
import { SizedContent, Symbol } from "@revolt/ui/components/utils";

import { MessageContextMenu } from "@revolt/app";
import { useState } from "@revolt/state";
import { styled } from "styled-system/jsx";
import { TextEmbed } from "./TextEmbed";

/**
 * Render a given embed
 */
export function Embed(props: { embed: MessageEmbed }) {
  const { openModal } = useModals();

  /**
   * Whether the embed is a GIF
   */
  const isGIF = () => isGifLib(props.embed);

  const asWebsiteEmbed = () => props.embed as WebsiteEmbed;

  const gifFavouriteURL = () =>
    isGIF()
      ? asWebsiteEmbed().originalUrl
        ? asWebsiteEmbed().originalUrl
        : (video()?.url ?? image()?.url)
      : undefined;

  /**
   * Whether there is a video
   */
  const video = () =>
    (props.embed.type === "Video"
      ? (props.embed as VideoEmbed)
      : isGIF() && asWebsiteEmbed().video) || undefined;

  /**
   * Whether there is a image
   */
  const image = () =>
    (props.embed.type === "Image"
      ? (props.embed as ImageEmbed)
      : isGIF() && asWebsiteEmbed().image) || undefined;

  return (
    <Switch fallback={`Could not render ${props.embed.type}!`}>
      <Match when={image()}>
        <SizedContent width={image()!.width} height={image()!.height}>
          <GifFavouriterHolder>
            <GifFavouriter
              url={gifFavouriteURL()}
              preview={
                isGIF() && !isGifBox(props.embed)
                  ? image()!.url
                  : image()!.proxiedURL
              }
            />
            <img
              // bypass proxy for known GIF providers
              // TODO: Remove the Gifbox check here once gifbox embeds are fixed
              src={
                isGIF() && !isGifBox(props.embed)
                  ? image()!.url
                  : image()!.proxiedURL
              }
              use:floating={{
                contextMenu: () => <MessageContextMenu file={image()} />,
              }}
              loading="lazy"
              class={css({ cursor: "pointer" })}
              onClick={() =>
                openModal({
                  type: "image_viewer",
                  embed: image(),
                })
              }
            />
          </GifFavouriterHolder>
        </SizedContent>
      </Match>
      <Match when={video()}>
        <SizedContent width={video()!.width} height={video()!.height}>
          <GifFavouriterHolder>
            <GifFavouriter
              url={gifFavouriteURL()}
              preview={
                isGIF() && !isGifBox(props.embed)
                  ? video()!.url
                  : video()!.proxiedURL
              }
            />
            <video
              playsinline
              loop={isGIF()}
              muted={isGIF()}
              autoplay={isGIF()}
              controls={!isGIF()}
              preload="metadata"
              // bypass proxy for known GIF providers
              // TODO: Remove the Gifbox check here once gifbox embeds are fixed
              src={
                isGIF() && !isGifBox(props.embed)
                  ? video()!.url
                  : video()!.proxiedURL
              }
              use:floating={{
                contextMenu: () => <MessageContextMenu file={video()} />,
              }}
              class={css({ cursor: isGIF() ? "pointer" : "unset" })}
              onClick={() =>
                isGIF() &&
                openModal({
                  type: "image_viewer",
                  gif: video(),
                })
              }
            />
          </GifFavouriterHolder>
        </SizedContent>
      </Match>
      <Match
        when={props.embed.type === "Website" || props.embed.type === "Text"}
      >
        <TextEmbed embed={props.embed as WebsiteEmbed | TextEmbedClass} />
      </Match>
      <Match when={props.embed.type === "None"}> </Match>
    </Switch>
  );
}

export function GifFavouriter(props: { url?: string; preview?: string }) {
  const { favourites } = useState();

  return (
    <Show when={props.url}>
      {(url) => (
        <span
          style={{
            position: "absolute",
            margin: "15px",
            padding: "var(--gap-sm)",
            "background-color": "var(--md-sys-color-surface-container-high)",
            "border-radius": "var(--borderRadius-sm)",
          }}
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
        </span>
      )}
    </Show>
  );
}

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
  },
});
