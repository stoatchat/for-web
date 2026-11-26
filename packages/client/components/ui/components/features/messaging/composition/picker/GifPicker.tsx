import {
  For,
  Match,
  Setter,
  Show,
  Suspense,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useInfiniteQuery, useQuery } from "@tanstack/solid-query";
import { ImageEmbed, VideoEmbed, WebsiteEmbed } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { debounce, useDevice } from "@revolt/common";
import {
  GifboxApi,
  GifboxCategory,
  GifboxCategoryList,
  GifboxPage,
  gifboxIdFromUrl,
  gifboxPosterUrl,
  gifboxPreviewMedia,
} from "@revolt/common/lib/gifbox";
import { useInstance } from "@revolt/instance";
import { useState } from "@revolt/state";
import {
  Button,
  CircularProgress,
  IconButton,
  Text,
  TextField,
  typography,
} from "@revolt/ui/components/design";
import { Gif } from "@revolt/ui/components/utils/GifEmbed";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";

/**
 * Section ID used to persist permanent dismissal of the Gifbox explainer
 */
const GIFBOX_EXPLAINER_DISMISS_KEY = "gifbox-explainer-dismissed";

/**
 * Link to more information about Gifbox
 */
const GIFBOX_LEARN_MORE_URL = "https://stoat.gg/meet-gifbox";

/**
 * Link to upload GIFs to Gifbox
 */
const GIFBOX_UPLOAD_URL = "https://gifbox.me/upload";

/**
 * Filter value used to show featured GIFs instead of searching
 */
const FEATURED_FILTER = "trending";

/**
 * Number of GIFs to request per page
 */
const PAGE_SIZE = 30;

/**
 * GIF shown in the picker grid
 */
type PickerGif = {
  /**
   * URL sent as the message
   */
  url: string;
  /**
   * Gifbox GIF ID, used to report shares
   */
  id?: string;
  title?: string;
  /**
   * Still frame shown while the preview loads
   */
  poster?: string;
  preview: {
    type: "video" | "image";
    url: string;
    /**
     * Dimensions, or 0 if unknown
     */
    width: number;
    height: number;
  };
};

/**
 * Preview media for a category tile
 */
type TilePreview = { type: "video" | "image"; url: string; poster?: string };

/**
 * Gifbox client for this instance: the generic picker API when an API key is
 * configured, otherwise the Stoat picker API with the user's session
 */
function useGifboxApi() {
  const client = useClient();
  const instance = useInstance();

  return new GifboxApi(
    instance.gifboxUrl,
    instance.gifboxApiKey
      ? { apiKey: instance.gifboxApiKey }
      : { sessionToken: () => client()!.authenticationHeader[1] },
  );
}

export function GifPicker() {
  const { isMobile } = useDevice();
  const { favourites } = useState();
  const { t } = useLingui();
  const [filter, setFilter] = createSignal("");
  const [debouncedFilter, setDebouncedFilter] = createSignal("");
  const [showFavourites, setShowFavourites] = createSignal(false);

  const clearFilter = () => {
    setFilter("");
    setDebouncedFilter("");
    setShowFavourites(false);
  };
  const delayedSetFilter = debounce(setDebouncedFilter, 250);
  createEffect(() => {
    delayedSetFilter(filter());
  });

  const debouncedFilterLowercase = () => debouncedFilter().toLowerCase();

  return (
    <Stack>
      <GifboxExplainer />
      <SearchArea>
        <Show when={filter() || showFavourites()}>
          <span
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
            }}
          >
            <IconButton
              variant="standard"
              aria-label="Back to categories"
              onPress={clearFilter}
            >
              <Symbol>arrow_back</Symbol>
            </IconButton>
          </span>
        </Show>
        <Show
          when={!showFavourites()}
          fallback={
            <Text class="title" size="medium">
              <Trans>Favourites</Trans>
            </Text>
          }
        >
          <TextField
            autoFocus={!isMobile}
            variant="outlined"
            placeholder={t`Search for GIFs...`}
            value={filter()}
            onInput={(e) => setFilter(e.currentTarget.value)}
          />
        </Show>
      </SearchArea>
      <Suspense fallback={<Loader />}>
        <Switch
          fallback={
            <Categories
              setFilter={setFilter}
              setShowFavourites={setShowFavourites}
            />
          }
        >
          <Match when={debouncedFilterLowercase()}>
            <GifSearch query={debouncedFilterLowercase()} />
          </Match>
          <Match when={showFavourites()}>
            <GifLayout
              data={favourites.gifs().map(
                (gif): PickerGif => ({
                  url: gif.url,
                  id: gifboxIdFromUrl(gif.url),
                  preview: {
                    type: gif.image ? "image" : "video",
                    url: gif.preview,
                    width: 0,
                    height: 0,
                  },
                }),
              )}
              showingFavourites={showFavourites()}
            />
          </Match>
        </Switch>
      </Suspense>
    </Stack>
  );
}

const Stack = styled("div", {
  base: {
    minHeight: 0,
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-md)",
  },
});

/**
 * One-time explainer letting people know GIFs are powered by Gifbox now.
 */
function GifboxExplainer() {
  const state = useState();

  // state can briefly be null while the picker is animating out and its reactive scope is being disposed, guard it!
  const dismissed = () =>
    state?.layout.getSectionState(GIFBOX_EXPLAINER_DISMISS_KEY, false) ?? false;

  return (
    <Show when={!dismissed()}>
      <Explainer
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
      >
        <Text class="title" size="small">
          <Trans>GIFs are now powered by Gifbox</Trans>
        </Text>
        <ExplainerBody>
          <Trans>
            Gifbox is our own GIF service, so you can keep sharing GIFs right
            here on Stoat.
          </Trans>
        </ExplainerBody>
        <ExplainerActions>
          <Button
            variant="text"
            onPress={() =>
              window.open(
                GIFBOX_LEARN_MORE_URL,
                "_blank",
                "noopener,noreferrer",
              )
            }
          >
            <Trans>Learn more</Trans>
          </Button>
          <Button
            variant="filled"
            onPress={() =>
              state?.layout.setSectionState(GIFBOX_EXPLAINER_DISMISS_KEY, true)
            }
          >
            <Trans>Got it</Trans>
          </Button>
        </ExplainerActions>
      </Explainer>
    </Show>
  );
}

const Explainer = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-sm)",

    marginInline: "var(--gap-md)",
    padding: "var(--gap-l)",

    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-surface-container-high)",
    color: "var(--md-sys-color-on-surface)",
  },
});

const ExplainerBody = styled("span", {
  base: {
    ...typography.raw({ class: "body", size: "small" }),
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const ExplainerActions = styled("div", {
  base: {
    display: "flex",
    justifyContent: "end",
    gap: "var(--gap-sm)",
    marginTop: "var(--gap-xs)",
  },
});

const SearchArea = styled("div", {
  base: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",
    paddingInline: "var(--gap-md)",
    // Size of text field, put here to make favourites title take same height
    minHeight: "54px",

    "& > *:last-child": {
      flexGrow: 1,
    },
  },
});

/**
 * Scrollable region that fills the remaining height of the picker
 * Really wish we just had a Modifier.weight(1f) like on Android
 */
const Scroller = styled("div", {
  base: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingInline: "var(--gap-md)",

    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
});

function Loader() {
  return (
    <Centered>
      <CircularProgress />
    </Centered>
  );
}

const Centered = styled("div", {
  base: {
    ...typography.raw({ class: "label" }),
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--gap-md)",
    padding: "var(--gap-x)",
    textAlign: "center",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

/**
 * M3-style interactive media surface w/ state layer
 * See https://m3.material.io/foundations/interaction/states/state-layers
 */
const tileInteractive = {
  position: "relative",
  boxSizing: "border-box",

  borderRadius: "var(--borderRadius-md)",
  overflow: "hidden",
  cursor: "pointer",

  backgroundColor: "var(--md-sys-color-surface-container-highest)",

  transition: "transform 200ms cubic-bezier(0.2, 0, 0, 1)",

  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundColor: "transparent",
    transition: "background-color 150ms cubic-bezier(0.2, 0, 0, 1)",
  },

  "&:hover::after": {
    backgroundColor:
      "color-mix(in srgb, 8% var(--md-sys-color-on-surface), transparent)",
  },

  "&:focus-visible": {
    outline: "2px solid var(--md-sys-color-primary)",
    outlineOffset: "2px",
  },

  "&:active": {
    transform: "scale(0.97)",
  },

  "&:active::after": {
    backgroundColor:
      "color-mix(in srgb, 12% var(--md-sys-color-on-surface), transparent)",
  },
} as const;

type CategoryItem =
  | {
      /**
       * Category entry
       */
      t: 0;
      category: GifboxCategory;
    }
  | {
      /**
       * Trending
       */
      t: 1;
    }
  | {
      /**
       * Favourites
       */
      t: 2;
    };

function Categories(props: {
  setFilter: Setter<string>;
  setShowFavourites: Setter<boolean>;
}) {
  const gifbox = useGifboxApi();
  const { favourites } = useState();

  const categoryList = useQuery<GifboxCategoryList>(() => ({
    queryKey: ["gifboxCategories"],
    queryFn: () => gifbox.categories(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const items = createMemo(
    () =>
      [
        ...(favourites.gifs().length > 0 ? [{ t: 2 }] : []),
        { t: 1 },
        ...(categoryList.data?.categories ?? []).map((category) => ({
          t: 0,
          category,
        })),
      ] as CategoryItem[],
  );

  return (
    <Scroller>
      <CategoryGrid role="list">
        <For each={items()}>
          {(item) => {
            // favourites show the most recent favourite, categories their top
            // result and the featured tile the top featured GIF
            const preview = (): TilePreview | undefined => {
              if (item.t === 2) {
                const gif = favourites.mostRecentGif();
                return (
                  gif && {
                    type: gif.image ? "image" : "video",
                    url: gif.preview,
                  }
                );
              }

              const media =
                item.t === 0
                  ? item.category.preview
                  : categoryList.data?.featured?.preview;
              const best = gifboxPreviewMedia(media);
              return (
                best && {
                  type: best.type,
                  url: best.media.url,
                  poster: gifboxPosterUrl(media),
                }
              );
            };

            return (
              <Category
                item={item}
                setFilter={props.setFilter}
                setShowFavourites={props.setShowFavourites}
                preview={preview()}
              />
            );
          }}
        </For>
      </CategoryGrid>
    </Scroller>
  );
}

function Category(props: {
  item: CategoryItem;
  setFilter: Setter<string>;
  setShowFavourites: Setter<boolean>;
  preview?: TilePreview;
}) {
  return (
    <CategoryBox
      trending={props.item.t === 1 && !props.preview}
      role="listitem"
      tabIndex={0}
      onClick={() =>
        props.item.t === 2
          ? props.setShowFavourites(true)
          : props.setFilter(
              props.item.t === 0 ? props.item.category.query : FEATURED_FILTER,
            )
      }
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
    >
      <Show when={props.preview}>
        {(preview) => (
          <>
            <Switch>
              <Match when={preview().type === "video"}>
                <video
                  class={tileMedia}
                  playsinline
                  loop
                  autoplay
                  muted
                  poster={preview().poster}
                  src={preview().url}
                />
              </Match>
              <Match when={preview().type === "image"}>
                <img
                  class={tileMedia}
                  loading="lazy"
                  alt=""
                  src={preview().url}
                />
              </Match>
            </Switch>
            <Scrim />
          </>
        )}
      </Show>
      <Label>
        <Switch fallback={<Trans>Trending GIFs</Trans>}>
          <Match when={props.item.t === 0}>
            {(props.item as CategoryItem & { t: 0 }).category.name}
          </Match>
          <Match when={props.item.t === 2}>
            <Trans>Favourites</Trans>
          </Match>
        </Switch>
      </Label>
    </CategoryBox>
  );
}

const CategoryGrid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "var(--gap-sm)",
    paddingBlock: "var(--gap-sm)",
  },
});

const CategoryBox = styled("div", {
  base: {
    ...tileInteractive,

    width: "100%",
    aspectRatio: "16 / 10",

    display: "flex",
    alignItems: "end",
    justifyContent: "start",
    padding: "var(--gap-md)",
  },
  variants: {
    trending: {
      true: {
        background:
          "linear-gradient(135deg, var(--md-sys-color-primary), var(--md-sys-color-tertiary))",
      },
      false: {},
    },
  },
});

/**
 * Animated preview filling a category tile
 */
const tileMedia = css({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
  pointerEvents: "none",
});

/**
 * Darkens the bottom of a tile, so the label stays properly readable
 */
const Scrim = styled("div", {
  base: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    boxShadow: "inset 0 -56px 48px -16px rgba(0, 0, 0, 0.7)",
  },
});

const Label = styled("span", {
  base: {
    ...typography.raw({ class: "title", size: "small" }),
    position: "relative",
    zIndex: 1,
    color: "white",
  },
});

function GifSearch(props: { query: string }) {
  const gifbox = useGifboxApi();

  const search = useInfiniteQuery(() => ({
    queryKey: ["gifboxGifs", props.query],
    queryFn: ({ pageParam }: { pageParam?: string }): Promise<GifboxPage> =>
      props.query === FEATURED_FILTER
        ? gifbox.featured(pageParam, PAGE_SIZE)
        : gifbox.search(props.query, pageParam, PAGE_SIZE),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: GifboxPage) =>
      lastPage.nextCursor ?? undefined,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const gifs = createMemo(
    () =>
      search.data?.pages
        .flatMap((page) => page.results)
        .flatMap((gif): PickerGif[] => {
          const preview = gifboxPreviewMedia(gif.media);
          return preview
            ? [
                {
                  url: gif.url,
                  id: gif.id,
                  title: gif.title,
                  poster: gifboxPosterUrl(gif.media),
                  preview: {
                    type: preview.type,
                    url: preview.media.url,
                    width: preview.media.width,
                    height: preview.media.height,
                  },
                },
              ]
            : [];
        }) ?? [],
  );

  return (
    <Show
      when={gifs().length}
      fallback={
        <Centered
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
        >
          <Text class="title" size="small">
            <Trans>No GIFs found</Trans>
          </Text>
          <ExplainerBody>
            <Trans>
              Can't find the perfect GIF? Head to Gifbox and upload your own for
              everyone to use.
            </Trans>
          </ExplainerBody>
          <ButtonSpacing>
            <Button
              variant="filled"
              onPress={() =>
                window.open(GIFBOX_UPLOAD_URL, "_blank", "noopener,noreferrer")
              }
            >
              <Trans>Upload to Gifbox</Trans>
            </Button>
          </ButtonSpacing>
        </Centered>
      }
    >
      <GifLayout
        data={gifs()}
        onEndReached={() => {
          if (search.hasNextPage && !search.isFetchingNextPage) {
            search.fetchNextPage();
          }
        }}
        loadingMore={search.isFetchingNextPage}
      />
    </Show>
  );
}

function GifLayout(props: {
  data: PickerGif[];
  showingFavourites?: boolean;
  /**
   * Called when the end of the list scrolls into view
   */
  onEndReached?: () => void;
  loadingMore?: boolean;
}) {
  const { onMessage } = useContext(CompositionMediaPickerContext);
  const client = useClient();
  const gifbox = useGifboxApi();

  /**
   * Send a GIF and report the share to Gifbox for popularity ranking
   */
  function sendGif(gif: PickerGif) {
    onMessage(gif.url);
    if (gif.id) gifbox.share(gif.id).catch(() => {});
  }

  function observeEnd(element: HTMLDivElement) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) props.onEndReached?.();
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    onCleanup(() => observer.disconnect());
  }

  return (
    <Scroller>
      <Masonry role="list">
        <For each={props.data}>
          {(gif) => (
            <GifTile
              role="listitem"
              tabIndex={0}
              title={gif.title}
              style={
                gif.preview.width && gif.preview.height
                  ? {
                      "aspect-ratio": `${gif.preview.width} / ${gif.preview.height}`,
                    }
                  : undefined
              }
              onClick={() => sendGif(gif)}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
            >
              <Gif
                gif={
                  new WebsiteEmbed(client(), {
                    original_url: gif.url,
                    ...(gif.preview.type === "image"
                      ? {
                          image: new ImageEmbed(client(), {
                            url: gif.preview.url,
                            width: gif.preview.width,
                            height: gif.preview.height,
                            size: "Preview",
                          }),
                        }
                      : {
                          video: new VideoEmbed(client(), {
                            url: gif.preview.url,
                            width: gif.preview.width,
                            height: gif.preview.height,
                          }),
                        }),
                  })
                }
                preSized
                noModal
                poster={gif.poster}
              />
            </GifTile>
          )}
        </For>
      </Masonry>
      <Show when={props.onEndReached}>
        <div ref={observeEnd} />
      </Show>
      <Show when={props.loadingMore}>
        <Loader />
      </Show>
      <EndOfResults
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
      >
        <Show
          when={!props.showingFavourites}
          fallback={
            <ExplainerBody>
              <Trans>Click the star on GIFs to stash them here.</Trans>
            </ExplainerBody>
          }
        >
          <ExplainerBody>
            <Trans>Got a better GIF? Share it with everyone on Gifbox.</Trans>
          </ExplainerBody>
          <ButtonSpacing>
            <Button
              variant="text"
              onPress={() =>
                window.open(GIFBOX_UPLOAD_URL, "_blank", "noopener,noreferrer")
              }
            >
              <Trans>Upload to Gifbox</Trans>
            </Button>
          </ButtonSpacing>
        </Show>
      </EndOfResults>
    </Scroller>
  );
}

const ButtonSpacing = styled("div", {
  base: {
    marginTop: "var(--gap-s)",
  },
});

const EndOfResults = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--gap-sm)",
    paddingBlock: "var(--gap-l)",
    textAlign: "center",
  },
});

/**
 * CSS column masonry — keeps each GIF's natural aspect ratio
 */
const Masonry = styled("div", {
  base: {
    columnCount: 2,
    columnGap: "var(--gap-sm)",
    paddingBlock: "var(--gap-sm)",
  },
});

const GifTile = styled("div", {
  base: {
    ...tileInteractive,

    width: "100%",
    marginBottom: "var(--gap-sm)",
    breakInside: "avoid",

    "& video, & img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
  },
});
