import { ImageEmbed, MessageEmbed, VideoEmbed, WebsiteEmbed } from "stoat.js";

/**
 * Regex for matching gif providers
 */
const GIF_PROVIDERS_REGEX = /^https:\/\/(tenor\.com|gifbox\.me|giphy\.com)/;

/**
 * Check the giffyness of an embed
 *
 * @param embed MessageEmbed to check for giffyness
 * @returns Whether embed is a gif
 */
export function isGif(embed: MessageEmbed) {
  return (
    (embed.type === "Website" &&
      ((embed as WebsiteEmbed).specialContent?.type === "GIF" ||
        !!(
          (embed as WebsiteEmbed).originalUrl || (embed as WebsiteEmbed).url
        )?.match(GIF_PROVIDERS_REGEX))) ||
    (embed.type === "Image" &&
      !!(embed as ImageEmbed).url?.match(GIF_PROVIDERS_REGEX)) ||
    (embed.type === "Video" &&
      !!(embed as VideoEmbed).url?.match(GIF_PROVIDERS_REGEX))
  );
}

export function isGifBox(embed: MessageEmbed) {
  return (
    (embed.type === "Website" &&
      ((embed as WebsiteEmbed).specialContent?.type === "GIF" ||
        !!(
          (embed as WebsiteEmbed).originalUrl || (embed as WebsiteEmbed).url
        )?.startsWith("https://gifbox.me"))) ||
    (embed.type === "Image" &&
      !!(embed as ImageEmbed).url?.startsWith("https://gifbox.me")) ||
    (embed.type === "Video" &&
      !!(embed as VideoEmbed).url?.startsWith("https://gifbox.me"))
  );
}
