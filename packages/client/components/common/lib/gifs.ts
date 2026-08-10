import { MessageEmbed, WebsiteEmbed } from "stoat.js";

/**
 * Full origins of gif providers allowed to embed.
 */
const GIF_PROVIDERS = [
  "https://tenor.com",
  "https://giphy.com",
  "https://gifbox.me",
];

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
    const chosenURL = webEmbed.originalUrl || webEmbed.url;
    if (chosenURL) {
      return GIF_PROVIDERS.includes(new URL(chosenURL).origin);
    }
  }

  if (embed.type === "Image" || embed.type === "Video") {
    const embedWithURL = embed as { url?: string };
    if (embedWithURL.url)
      return GIF_PROVIDERS.includes(new URL(embedWithURL.url).origin);
  }
  return false;
}

export function isGifBox(embed: MessageEmbed) {
  if (embed.type === "Website") {
    const webEmbed = embed as WebsiteEmbed;
    const chosenURL = webEmbed.originalUrl || webEmbed.url;
    if (chosenURL) {
      return new URL(chosenURL).origin === "https://gifbox.me";
    }
  }

  if (embed.type === "Image" || embed.type === "Video") {
    const embedWithURL = embed as { url?: string };
    if (embedWithURL.url)
      return new URL(embedWithURL.url).origin === "https://gifbox.me";
  }
  return false;
}
