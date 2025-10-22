import { Match, Switch } from "solid-js";

import {
  ImageEmbed,
  MessageEmbed,
  TextEmbed as TextEmbedClass,
  VideoEmbed,
  WebsiteEmbed,
} from "stoat.js";
import { css } from "styled-system/css";

import { useModals } from "@revolt/modal";
import { SizedContent } from "@revolt/ui/components/utils";

import { TextEmbed } from "./TextEmbed";

/**
 * Render a given embed
 */
export function Embed(props: { embed: MessageEmbed }) {
  const { openModal } = useModals();

  /**
   * Whether the embed is a GIF
   */
  const isGIF = () =>
    props.embed.type === "Website" &&
    ((props.embed as WebsiteEmbed).specialContent?.type === "GIF" ||
      (props.embed as WebsiteEmbed).originalUrl?.startsWith(
        "https://tenor.com",
      ));

  /**
   * Whether there is a video
   */
  const video = () =>
    (props.embed.type === "Video"
      ? (props.embed as VideoEmbed)
      : isGIF() && (props.embed as WebsiteEmbed).video) || undefined;

  /**
   * Whether there is a image
   */
  const image = () =>
    (props.embed.type === "Image"
      ? (props.embed as ImageEmbed)
      : isGIF() && (props.embed as WebsiteEmbed).image) || undefined;

  return (
    <Switch fallback={`Could not render ${props.embed.type}!`}>
      <Match when={image()}>
        <SizedContent width={image()!.width} height={image()!.height}>
          <img
            // bypass proxy for known GIF providers
            src={isGIF() ? image()!.url : image()!.proxiedURL}
            loading="lazy"
            class={css({ cursor: "pointer" })}
            onClick={() =>
              openModal({
                type: "image_viewer",
                embed: image(),
              })
            }
          />
        </SizedContent>
      </Match>
      <Match when={video()}>
        <SizedContent width={video()!.width} height={video()!.height}>
          <video
            loop={isGIF()}
            muted={isGIF()}
            autoplay={isGIF()}
            controls={!isGIF()}
            preload="metadata"
            // bypass proxy for known GIF providers
            src={isGIF() ? video()!.url : video()!.proxiedURL}
            class={css({ cursor: isGIF() ? "pointer" : "unset" })}
            onClick={() =>
              isGIF() &&
              openModal({
                type: "image_viewer",
                gif: video(),
              })
            }
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
