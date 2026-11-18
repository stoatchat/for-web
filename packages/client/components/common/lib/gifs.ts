import { MessageEmbed, WebsiteEmbed } from "stoat.js";

/**
 * Check the giffyness of an embed
 *
 * @param embed MessageEmbed to check for giffyness
 * @returns Whether embed is a gif
 */
export function isGif(embed: MessageEmbed) {
  if (embed.type === "Website") {
    const webEmbed = embed as WebsiteEmbed;
    if (webEmbed.specialContent?.type === "GIF") {
      return true;
    }
  }
  return false;
}
