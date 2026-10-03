import { getEmojiByShorthand } from "@revolt/ui";
import { AbstractSyncedStore } from ".";
import { State } from "..";

const RECENCY_HALFLIFE_MS = 7 * 24 * 60 * 60 * 1000; // a week

type FavouriteEmoji = {
  id: string;
  favouritedAt: Date;
};

type FavouriteGif = {
  url: string;
  name: string;
  preview: string;
  favouritedAt: Date;
};

type EmojiUsage = {
  lastUsed: Date;
  score: number;
};

export type TypeFavourites = {
  gifs: FavouriteGif[];
  emojis: {
    favourites: FavouriteEmoji[];
    usageMap: Record<string, EmojiUsage>;
  };
};

export class Favourites extends AbstractSyncedStore<
  "favourites",
  TypeFavourites
> {
  constructor(state: State) {
    super(state, "favourites");
  }

  hydrate(): void {}

  default(): TypeFavourites {
    return {
      gifs: [],
      emojis: {
        favourites: [],
        usageMap: {},
      },
    };
  }

  clean(input: Partial<TypeFavourites>): TypeFavourites {
    const gifs: FavouriteGif[] = [];
    const emojiFavourites: FavouriteEmoji[] = [];
    const emojiUsage: Record<string, EmojiUsage> = {};

    if (Array.isArray(input.gifs)) {
      for (const entry of input.gifs) {
        if (
          !entry ||
          typeof entry !== "object" ||
          !entry.url ||
          typeof entry.url !== "string" ||
          !entry.name ||
          typeof entry.name !== "string" ||
          !entry.preview ||
          typeof entry.preview !== "string" ||
          !entry.favouritedAt ||
          typeof entry.favouritedAt !== "string"
        ) {
          continue;
        }

        gifs.push({
          url: entry.url,
          name: entry.name,
          preview: entry.preview,
          favouritedAt: new Date(entry.favouritedAt),
        });
      }
    }

    if (typeof input.emojis === "object" && input.emojis) {
      if (Array.isArray(input.emojis.favourites)) {
        for (const entry of input.emojis.favourites) {
          if (
            !entry ||
            typeof entry !== "object" ||
            !entry.id ||
            typeof entry.id !== "string" ||
            !entry.favouritedAt ||
            typeof entry.favouritedAt !== "string"
          ) {
            continue;
          }

          emojiFavourites.push({
            id: entry.id,
            favouritedAt: new Date(entry.favouritedAt),
          });
        }
      }

      if (typeof input.emojis.usageMap === "object" && input.emojis.usageMap) {
        for (const usage in input.emojis.usageMap) {
          if (
            !usage ||
            typeof usage !== "string" ||
            !input.emojis.usageMap[usage] ||
            typeof input.emojis.usageMap[usage] !== "object" ||
            !input.emojis.usageMap[usage].lastUsed ||
            typeof input.emojis.usageMap[usage].lastUsed !== "string" ||
            !input.emojis.usageMap[usage].score ||
            typeof input.emojis.usageMap[usage].score !== "number"
          ) {
            continue;
          }

          emojiUsage[usage] = {
            lastUsed: new Date(input.emojis.usageMap[usage].lastUsed),
            score: input.emojis.usageMap[usage].score,
          };
        }
      }
    }

    return {
      gifs,
      emojis: {
        favourites: emojiFavourites,
        usageMap: emojiUsage,
      },
    };
  }

  hasGif(url: string): boolean {
    return !!this.get().gifs.find((gif) => gif.url === url);
  }

  /**
   * Toggle favourability of a gif
   * @param url Location of the gif to toggle
   * @param name Gif name. Defaults to the passed url.
   * @param preview A preview url for the gif. Defaults to the passed url.
   */
  toggleGif(url: string, name: string = url, preview: string = url) {
    // Check for favourability
    const i = this.get().gifs.findIndex((gif) => gif.url === url);
    if (i >= 0) {
      this.set("gifs", [...this.get().gifs.toSpliced(i, 1)]);
      return;
    }
    this.set("gifs", [
      ...this.get().gifs,
      { url, name, preview, favouritedAt: new Date() },
    ]);
  }

  /**
   * Toggle favourability of an emoji
   * @param id id of the emoji to toggle
   */
  toggleEmoji(id: string) {
    // Check for favourability
    const i = this.get().emojis.favourites.findIndex(
      (emoji) => emoji.id === id,
    );
    if (i >= 0) {
      this.set("emojis", "favourites", [
        ...this.get().emojis.favourites.toSpliced(i, 1),
      ]);
      return;
    }
    this.set("emojis", "favourites", [
      ...this.get().emojis.favourites,
      { id, favouritedAt: new Date() },
    ]);
  }

  /**
   * Record a use of an emoji, using the recency algorithm
   * @param emoji The ID of the emoji to record use
   */
  recordUse(emoji: string) {
    const now = new Date();
    const record = this.get().emojis.usageMap;
    const entry = {
      ...(record[emoji] ?? {
        score: 0,
        lastUsed: now,
      }),
    };
    const elapsed = now.getTime() - entry.lastUsed.getTime();
    entry.score =
      entry.score * Math.pow(0.5, elapsed / RECENCY_HALFLIFE_MS) + 1;
    entry.lastUsed = now;
    this.set("emojis", "usageMap", { ...record, [emoji]: entry });
  }

  /**
   * Get the top used emojis according to the recenct algorithm
   * @param n How many emojis to return
   * @returns An ordered list of most used emojis according to the recency algorithm
   */
  topEmoji(n = 27): string[] {
    const now = new Date();
    const record = this.get().emojis.usageMap;
    return Object.entries(record)
      .map(([emoji, { score, lastUsed }]) => [
        emoji,
        score *
          Math.pow(
            0.5,
            (now.getTime() - lastUsed.getTime()) / RECENCY_HALFLIFE_MS,
          ),
      ])
      .filter(
        ([emoji]) =>
          (emoji as string).length === 26 ||
          getEmojiByShorthand(emoji as string),
      )
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, n)
      .map(([emoji]) => emoji as string);
  }

  emojis(): string[] {
    return this.get().emojis.favourites.map((fav) => fav.id);
  }

  gifs(): FavouriteGif[] {
    return this.get().gifs;
  }
}
