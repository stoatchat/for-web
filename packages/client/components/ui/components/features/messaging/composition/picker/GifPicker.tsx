import {
  Match,
  Suspense,
  Switch,
  createContext,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { VirtualContainer } from "@minht11/solid-virtual-container";
import { useQuery } from "@tanstack/solid-query";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import {
  CircularProgress,
  TextField,
  typography,
} from "@revolt/ui/components/design";

import { CompositionMediaPickerContext } from "./CompositionMediaPicker";

type GifCategory = { title: string; image: string };

type GifResult = {
  url: string;
  media_formats: Record<"webm" | "tinywebm", { url: string }>;
};

type GifboxConfig = {
  enabled: boolean;
  url: string;
  attribution: string;
};

const FilterContext = createContext<(value: string) => void>();

/**
 * Shared signal for the gifbox configuration fetched directly from the API
 * root, since the client SDK types do not yet include the gifbox feature.
 */
const [gifboxConfig, setGifboxConfig] = createSignal<GifboxConfig | null>(null);
let gifboxConfigFetched = false;

function ensureGifboxConfig(apiUrl: string | undefined) {
  if (gifboxConfigFetched || !apiUrl) return;
  gifboxConfigFetched = true;
  fetch(`${apiUrl}/`)
    .then((r) => r.json())
    .then((data) => {
      if (data?.features?.gifbox?.enabled) {
        setGifboxConfig(data.features.gifbox);
      }
    })
    .catch(() => {});
}

export function GifPicker() {
  const [filter, setFilter] = createSignal("");
  const client = useClient();

  // Kick off gifbox config fetch from API root
  ensureGifboxConfig(import.meta.env.VITE_API_URL);

  const fliterLowercase = () => filter().toLowerCase();

  const placeholderText = () =>
    gifboxConfig()?.attribution || "Search for GIFs...";

  return (
    <Stack>
      <TextField
        autoFocus
        variant="filled"
        placeholder={placeholderText()}
        value={filter()}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }}
        onChange={(e) => setFilter(e.currentTarget.value)}
      />
      <Suspense fallback={<CircularProgress />}>
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
    display: "flex",
    flexDirection: "column",
  },
});

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
      gif: GifResult | null;
    };

function Categories() {
  let targetElement!: HTMLDivElement;

  const client = useClient();

  const trendingCategories = useQuery<GifCategory[]>(() => ({
    queryKey: ["trendingGifCategories"],
    queryFn: () => {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const gifboxUrl = gifboxConfig()!.url;

      return fetch(`${gifboxUrl}/categories?locale=en_US`, {
        headers: {
          [authHeader]: authHeaderValue,
        },
      }).then((r) => r.json());
    },
    enabled: !!gifboxConfig(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const trendingGif = useQuery<GifResult | null>(() => ({
    queryKey: ["trendingGif1"],
    queryFn: () => {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const gifboxUrl = gifboxConfig()!.url;

      return fetch(`${gifboxUrl}/trending?locale=en_US&limit=1`, {
        headers: {
          [authHeader]: authHeaderValue,
        },
      })
        .then((r) => r.json())
        .then((resp) => resp.results[0]);
    },
    enabled: !!gifboxConfig(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    initialData: null,
  }));

  const items = createMemo(() => {
    return [
      {
        t: 1,
        gif: trendingGif.data,
      },
      ...(trendingCategories.data?.map((category) => ({ t: 0, category })) ??
        []),
    ] as CategoryItem[];
  });

  return (
    <div ref={targetElement} use:invisibleScrollable>
      <VirtualContainer
        items={items()}
        scrollTarget={targetElement}
        itemSize={{ height: 120, width: 200 }}
        crossAxisCount={(measurements) =>
          Math.floor(measurements.container.cross / measurements.itemSize.cross)
        }
      >
        {CategoryItem}
      </VirtualContainer>
    </div>
  );
}

const CategoryItem = (props: {
  style: unknown;
  tabIndex: number;
  item: CategoryItem;
}) => {
  const setFilter = useContext(FilterContext);

  return (
    <Category
      style={{
        ...(props.style as object),
        "background-image": `linear-gradient(to right, #0006, #0006), url("${props.item.t === 0 ? props.item.category.image : props.item.gif?.url}")`,
      }}
      tabIndex={props.tabIndex}
      role="listitem"
      onClick={() =>
        setFilter!(props.item.t === 0 ? props.item.category.title : "trending")
      }
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }}
    >
      <Switch fallback={<Trans>Trending GIFs</Trans>}>
        <Match when={props.item.t === 0}>
          {(props.item as CategoryItem & { t: 0 }).category.title}
        </Match>
      </Switch>
    </Category>
  );
};

const Category = styled("div", {
  base: {
    ...typography.raw({ class: "title", size: "small" }),

    width: "200px",
    height: "120px",
    backgroundSize: "cover",
    backgroundPosition: "center",

    color: "white",
    display: "flex",
    padding: "var(--gap-md)",

    alignItems: "end",
    justifyContent: "end",

    cursor: "pointer",
  },
});

function GifSearch(props: { query: string }) {
  let targetElement!: HTMLDivElement;

  const client = useClient();

  const search = useQuery<GifResult[]>(() => ({
    queryKey: ["gifs", props.query],
    queryFn: () => {
      const [authHeader, authHeaderValue] = client()!.authenticationHeader;
      const gifboxUrl = gifboxConfig()!.url;

      return fetch(
        gifboxUrl +
          "/" +
          (props.query === "trending"
            ? `trending?locale=en_US`
            : `search?locale=en_US&query=${encodeURIComponent(props.query)}`),
        {
          headers: {
            [authHeader]: authHeaderValue,
          },
        },
      )
        .then((r) => r.json())
        .then((resp) => resp.results);
    },
    enabled: !!gifboxConfig(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  return (
    <div ref={targetElement} use:invisibleScrollable>
      <VirtualContainer
        items={search.data as never /* resource */}
        scrollTarget={targetElement}
        itemSize={{ height: 120, width: 200 }}
        crossAxisCount={(measurements) =>
          Math.floor(measurements.container.cross / measurements.itemSize.cross)
        }
      >
        {GifItem}
      </VirtualContainer>
    </div>
  );
}

const GifItem = (props: {
  style: unknown;
  tabIndex: number;
  item: GifResult;
}) => {
  const { onMessage } = useContext(CompositionMediaPickerContext);

  return (
    <Gif
      loop
      autoplay
      muted
      preload="auto"
      role="listitem"
      style={props.style as string}
      tabIndex={props.tabIndex}
      src={props.item.media_formats.tinywebm.url}
      onClick={() => onMessage(props.item.media_formats.gif.url)}
    />
  );
};

const Gif = styled("video", {
  base: {
    width: "200px",
    height: "120px",
    cursor: "pointer",
    objectFit: "cover",
  },
});