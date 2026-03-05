import {
  For,
  Match,
  Show,
  Suspense,
  Switch,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
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

type GifCategory = { title: string; image: string };

type GifResult = {
  url: string;
  media_formats: Record<"webm" | "tinywebm", { url: string }>;
};

const FilterContext = createContext<(value: string) => void>();

export function GifPicker() {
  const [filter, setFilter] = createSignal("");

  const fliterLowercase = () => filter().toLowerCase();

  return (
    <Stack>
      <GifboxExplainer />
      <SearchArea>
        <Show when={filter()}>
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
              onPress={() => setFilter("")}
            >
              <Symbol>arrow_back</Symbol>
            </IconButton>
          </span>
        </Show>
        <TextField
          autoFocus
          variant="outlined"
          placeholder="Search for GIFs..."
          value={filter()}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
          onChange={(e) => setFilter(e.currentTarget.value)}
        />
      </SearchArea>
      <Suspense fallback={<Loader />}>
        <Switch
          fallback={
            <FilterContext.Provider value={setFilter}>
              <Categories />
            </FilterContext.Provider>
          }
        >
          <Match when={fliterLowercase()}>
            <GifSearch query={fliterLowercase()} />
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
      category: GifCategory;
    }
  | {
      /**
       * Trending entry
       */
      t: 1;
    };

function Categories() {
  const client = useClient();
  const instance = useInstance();

  const setFilter = useContext(FilterContext);

  const trendingCategories = useQuery<GifCategory[]>(() => ({
    queryKey: ["trendingGifCategories"],
    queryFn: () => {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;

      return fetch(`${instance.gifboxUrl}/categories?locale=en_US`, {
        headers: {
          [authHeader]: authHeaderValue,
        },
      }).then((r) => {
        if (!r.ok) throw new Error(`Gifbox categories failed: ${r.status}`);
        return r.json();
      });
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const items = createMemo(
    () =>
      [
        { t: 1 },
        ...(Array.isArray(trendingCategories.data)
          ? trendingCategories.data.map((category) => ({ t: 0, category }))
          : []),
      ] as CategoryItem[],
  );

  return (
    <Scroller>
      <CategoryGrid role="list">
        <For each={items()}>
          {(item) => (
            <Category
              trending={item.t === 1}
              role="listitem"
              tabIndex={0}
              style={
                item.t === 0
                  ? { "background-image": `url("${item.category.image}")` }
                  : undefined
              }
              onClick={() =>
                setFilter!(item.t === 0 ? item.category.title : "trending")
              }
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
              }}
            >
              <Label>
                <Switch fallback={<Trans>Trending GIFs</Trans>}>
                  <Match when={item.t === 0}>
                    {(item as CategoryItem & { t: 0 }).category.title}
                  </Match>
                </Switch>
              </Label>
            </Category>
          )}
        </For>
      </CategoryGrid>
    </Scroller>
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

const Category = styled("div", {
  base: {
    ...tileInteractive,

    width: "100%",
    aspectRatio: "16 / 10",

    backgroundSize: "cover",
    backgroundPosition: "center",

    display: "flex",
    alignItems: "end",
    justifyContent: "start",
    padding: "var(--gap-md)",

    // scrim so the label stays legible
    boxShadow: "inset 0 -56px 48px -16px rgba(0, 0, 0, 0.7)",
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

const Label = styled("span", {
  base: {
    ...typography.raw({ class: "title", size: "small" }),
    position: "relative",
    zIndex: 1,
    color: "white",
  },
});

function GifSearch(props: { query: string }) {
  const client = useClient();
  const instance = useInstance();

  const { onMessage } = useContext(CompositionMediaPickerContext);

  const search = useQuery<GifResult[]>(() => ({
    queryKey: ["gifs", props.query],
    queryFn: () => {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;

      return fetch(
        `${instance.gifboxUrl}/` +
          (props.query === "trending"
            ? `trending?locale=en_US`
            : `search?locale=en_US&query=${encodeURIComponent(props.query)}`),
        {
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      )
        .then((r) => {
          if (!r.ok) throw new Error(`Gifbox search failed: ${r.status}`);
          return r.json();
        })
        .then((resp) => resp.results);
    },
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  return (
    <Show
      when={search.data?.length}
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
      <Scroller>
        <Masonry role="list">
          <For each={search.data}>
            {(gif) => (
              <GifTile
                role="listitem"
                tabIndex={0}
                onClick={() => onMessage(gif.url)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                }}
              >
                <video
                  playsinline
                  loop
                  autoplay
                  muted
                  src={gif.media_formats.tinywebm.url}
                />
              </GifTile>
            )}
          </For>
        </Masonry>
        <EndOfResults
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
          }}
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
        </EndOfResults>
      </Scroller>
    </Show>
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

    "& video": {
      width: "100%",
      height: "auto",
      display: "block",
    },
  },
});
