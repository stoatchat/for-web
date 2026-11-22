/**
 * Client for the Gifbox Stoat picker API (`/api/stoat/v1`)
 */

export type GifboxMediaFormat =
  | "gif_high"
  | "gif_low"
  | "mp4"
  | "webm"
  | "thumbnail"
  | "poster";

export type GifboxMedia = {
  url: string;
  width: number;
  height: number;
  size: number;
  /**
   * Duration in milliseconds
   */
  duration: number | null;
};

export type GifboxGif = {
  id: string;
  title: string;
  description: string;
  /**
   * Share page URL
   */
  url: string;
  tags: string[];
  media: Partial<Record<GifboxMediaFormat, GifboxMedia>>;
};

export type GifboxPage = { results: GifboxGif[]; nextCursor: string | null };

export type GifboxCategory = {
  name: string;
  query: string;
  emoji: string;
  /**
   * Media of the category's top search result
   */
  preview: GifboxGif["media"];
  special?: true;
  /**
   * CSS gradient for highlighted categories
   */
  gradient?: string;
};

export type GifboxCategoryList = {
  categories: GifboxCategory[];
  /**
   * Media of the top featured GIF; null when nothing is featured
   */
  featured: { preview: GifboxGif["media"] } | null;
};

export class GifboxError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message?: string,
  ) {
    super(message ?? `Gifbox request failed: ${status}`);
  }
}

/**
 * How to authenticate against Gifbox
 *
 * - `apiKey`: generic picker API (`/api/picker/v1`) for self-hosted instances
 * - `sessionToken`: Stoat picker API (`/api/stoat/v1`), using the user's Stoat session
 */
export type GifboxAuth = { apiKey: string } | { sessionToken: () => string };

type Params = Record<string, string | undefined>;

/**
 * Picker API client; both APIs share endpoints and response formats
 */
export class GifboxApi {
  readonly #baseUrl: string;
  readonly #auth: GifboxAuth;

  /**
   * @param origin Gifbox server origin
   * @param auth Authentication to use, which also selects the API
   */
  constructor(origin: string, auth: GifboxAuth) {
    this.#baseUrl = `${origin.replace(/\/$/, "")}${
      "apiKey" in auth ? "/api/picker/v1" : "/api/stoat/v1"
    }`;
    this.#auth = auth;
  }

  async #request<T>(
    path: string,
    params?: Params,
    method: "GET" | "POST" = "GET",
  ): Promise<T> {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined) search.set(key, value);
    }

    const query = search.toString();
    const response = await fetch(
      `${this.#baseUrl}${path}${query ? `?${query}` : ""}`,
      {
        method,
        credentials: "omit",
        headers: {
          Accept: "application/json",
          ...("apiKey" in this.#auth
            ? { Authorization: `Bearer ${this.#auth.apiKey}` }
            : { "X-Session-Token": this.#auth.sessionToken() }),
        },
      },
    );

    if (!response.ok) {
      const body = await response.json().catch(() => undefined);
      throw new GifboxError(
        response.status,
        body?.error?.code,
        body?.error?.message,
      );
    }

    return response.status === 204 ? (undefined as T) : response.json();
  }

  search(query: string, cursor?: string, limit = 20) {
    return this.#request<GifboxPage>("/search", {
      q: query.trim(),
      limit: String(limit),
      cursor,
    });
  }

  featured(cursor?: string, limit = 20) {
    return this.#request<GifboxPage>("/featured", {
      limit: String(limit),
      cursor,
    });
  }

  async categories(): Promise<GifboxCategoryList> {
    const list =
      await this.#request<Partial<GifboxCategoryList>>("/categories");

    return {
      categories: list.categories ?? [],
      featured: list.featured ?? null,
    };
  }

  /**
   * Report that a GIF was sent, counting towards its popularity
   */
  share(id: string) {
    return this.#request<void>(
      `/gifs/${encodeURIComponent(id)}/share`,
      undefined,
      "POST",
    );
  }
}

/**
 * Pick the best available media for an animated picker preview
 *
 * Videos are preferred as they are much lighter than GIFs
 */
export function gifboxPreviewMedia(
  media: GifboxGif["media"] | undefined,
): { type: "video" | "image"; media: GifboxMedia } | undefined {
  if (!media) return;

  const video = media.mp4 ?? media.webm;
  if (video) return { type: "video", media: video };

  const image =
    media.gif_low ?? media.gif_high ?? media.thumbnail ?? media.poster;
  if (image) return { type: "image", media: image };
}

/**
 * Pick a still preview for a GIF
 */
export function gifboxPosterUrl(media: GifboxGif["media"] | undefined) {
  return (media?.poster ?? media?.thumbnail)?.url;
}

/**
 * Gifbox web app origin
 */
export const GIFBOX_SITE_URL = "https://gifbox.me";

/**
 * Gifbox admin panel origin
 */
export const GIFBOX_ADMIN_URL = "https://admin.gifbox.me";

/**
 * Length of Gifbox post IDs
 */
const GIFBOX_ID_LENGTH = 21;

/**
 * Extract a Gifbox GIF ID from a share page or media URL
 *
 * Handles `gifbox.me/view/<id>[-slug]` and `<sub>.gifbox.me/media/post/<id>/<variant>`
 *
 * @param url URL to parse
 * @returns GIF ID, if the URL points at a Gifbox GIF
 */
export function gifboxIdFromUrl(url: string | undefined) {
  if (!url) return;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return;
  }

  if (
    parsed.protocol !== "https:" ||
    (parsed.hostname !== "gifbox.me" && !parsed.hostname.endsWith(".gifbox.me"))
  ) {
    return;
  }

  const match =
    parsed.pathname.match(/^\/view\/([^/]+)/) ??
    parsed.pathname.match(/^\/media\/post\/([^/]+)\//);
  if (!match) return;

  let id: string;
  try {
    id = decodeURIComponent(match[1]).slice(0, GIFBOX_ID_LENGTH);
  } catch {
    // malformed percent escape
    return;
  }

  return /^[\w-]+$/.test(id) && id.length === GIFBOX_ID_LENGTH ? id : undefined;
}

/**
 * Gifbox share page for a GIF
 */
export function gifboxViewUrl(id: string) {
  return `${GIFBOX_SITE_URL}/view/${encodeURIComponent(id)}`;
}

/**
 * Gifbox page that opens the report dialog for a GIF
 */
export function gifboxReportUrl(id: string) {
  return `${GIFBOX_SITE_URL}/view/${encodeURIComponent(id)}?report`;
}

/**
 * Gifbox admin panel page for a GIF
 */
export function gifboxAdminUrl(id: string) {
  return `${GIFBOX_ADMIN_URL}/reports/${encodeURIComponent(id)}`;
}
