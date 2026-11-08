import { Match, Switch } from "solid-js";

import {
  ImageEmbed,
  MessageEmbed,
  TextEmbed as TextEmbedClass,
  VideoEmbed,
  WebsiteEmbed,
} from "stoat.js";
import { css } from "styled-system/css";

import { isGif as isGifLib } from "@revolt/common/lib/gifs";
import { useModals } from "@revolt/modal";
import { SizedContent } from "@revolt/ui/components/utils";

import { MessageContextMenu, useMessage } from "@revolt/app";
import { Gif } from "@revolt/ui/components/utils/GifEmbed";
import { TextEmbed } from "./TextEmbed";

/**
 * Render a given embed
 */
export function Embed(props: { embed: MessageEmbed }) {
  const { openModal } = useModals();
  const { message, reactPicker } = useMessage();

  /**
   * Whether the embed is a GIF
   */
  const isGIF = () => isGifLib(props.embed);

  /**
   * Whether there is a video
   */
  const video = () =>
    props.embed.type === "Video" ? (props.embed as VideoEmbed) : undefined;

  /**
   * Whether there is a image
   */
  const image = () =>
    props.embed.type === "Image" ? (props.embed as ImageEmbed) : undefined;

  /**
   * Link to the page the embed came from (not the raw media)
   */
  const pageUrl = () =>
    props.embed.type === "Website"
      ? (props.embed as WebsiteEmbed).originalUrl ||
        (props.embed as WebsiteEmbed).url
      : undefined;

  return (
    <Switch fallback={`Could not render ${props.embed.type}!`}>
      <Match when={isGIF()}>
        <Gif embed={props.embed as ImageEmbed | VideoEmbed | WebsiteEmbed} />
      </Match>
      <Match when={image()}>
        <SizedContent width={image()!.width} height={image()!.height}>
          <img
            src={image()!.proxiedURL}
            use:floating={{
              contextMenu: () => (
                <MessageContextMenu
                  message={message}
                  reactPicker={reactPicker}
                  file={image()}
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
        </SizedContent>
      </Match>
      <Match when={video()}>
        <SizedContent width={video()!.width} height={video()!.height}>
          <video
            playsinline
            controls
            preload="metadata"
            // bypass proxy for known GIF providers
            src={video()!.proxiedURL}
            use:floating={{
              contextMenu: () => (
                <MessageContextMenu
                  message={message}
                  reactPicker={reactPicker}
                  file={video()}
                />
              ),
            }}
            class={css({ cursor: "unset" })}
          />
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
