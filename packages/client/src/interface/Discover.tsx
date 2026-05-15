import { For, Show, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { useLocation, useNavigate } from "@revolt/routing";
import {
  Avatar,
  Button,
  Column,
  Header,
  Text,
  TextField,
  iconSize,
  main,
} from "@revolt/ui";

import MdExplore from "@material-design-icons/svg/filled/explore.svg?component-solid";
import MdGroups from "@material-design-icons/svg/filled/groups.svg?component-solid";
import MdPalette from "@material-design-icons/svg/filled/palette.svg?component-solid";
import MdSmartToy from "@material-design-icons/svg/filled/smart_toy.svg?component-solid";

/**
 * Mock data for servers
 */
const MOCK_SERVERS = [
  {
    id: "01F7ZSBSFHQ8TA81725KQCSDDP",
    name: "Stoat Lounge",
    description: "The official Stoat community server. Come talk with us!",
    icon: "https://stoat.chat/header.png",
    members: 1250,
  },
  {
    id: "1",
    name: "Gaming Universe",
    description: "A place for gamers of all kinds to gather and play together.",
    icon: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=128&h=128&fit=crop",
    members: 8402,
  },
  {
    id: "2",
    name: "Developer Hub",
    description: "Code, share, and learn with other developers.",
    icon: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=128&h=128&fit=crop",
    members: 3120,
  },
  {
    id: "3",
    name: "Music Station",
    description: "Share your favorite tunes and discover new artists.",
    icon: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=128&h=128&fit=crop",
    members: 1540,
  },
];

/**
 * Mock data for categories
 */
const CATEGORIES = [
  { id: "all", name: "All", icon: <MdExplore /> },
  { id: "gaming", name: "Gaming", icon: <MdGroups /> },
  { id: "social", name: "Social", icon: <MdGroups /> },
  { id: "tech", name: "Technology", icon: <MdGroups /> },
  { id: "music", name: "Music", icon: <MdGroups /> },
];

/**
 * Discover Page implementation
 */
export function Discover() {
  const { t } = useLingui();
  const navigate = useNavigate();
  const client = useClient();
  const { openModal } = useModals();

  const location = useLocation();
  const [search, setSearch] = createSignal("");
  const [activeCategory, setActiveCategory] = createSignal("all");

  /**
   * Determine active tab from URL
   */
  const activeTab = () => {
    if (location.pathname.includes("/bots")) return "bots";
    if (location.pathname.includes("/themes")) return "themes";
    return "servers";
  };

  /**
   * Change tab and update URL
   */
  const setTab = (tab: "servers" | "bots" | "themes") => {
    if (tab === "servers") navigate("/discover/servers");
    else if (tab === "bots") navigate("/discover/bots");
    else if (tab === "themes") navigate("/discover/themes");
  };

  /**
   * Filter servers based on search and category
   */
  const filteredServers = () =>
    MOCK_SERVERS.filter(
      (s) =>
        s.name.toLowerCase().includes(search().toLowerCase()) ||
        s.description.toLowerCase().includes(search().toLowerCase()),
    );

  return (
    <Base>
      <Header placement="primary">
        <MdExplore {...iconSize(22)} />
        <Trans>Discover</Trans>
      </Header>

      <ScrollableContent use:scrollable>
        <Hero>
          <HeroTitle>
            <Trans>Find your community on Stoat</Trans>
          </HeroTitle>
          <HeroSubtitle>
            <Trans>From gaming to education, there is a place for you.</Trans>
          </HeroSubtitle>
          <SearchWrapper>
            <TextField
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              placeholder={t`Explore servers, bots, and more...`}
              icon="search"
              variant="outlined"
              class={css({ width: "100%", maxWidth: "600px" })}
            />
          </SearchWrapper>
        </Hero>

        <Container>
          <Tabs>
            <Tab
              active={activeTab() === "servers"}
              onClick={() => setTab("servers")}
            >
              <MdGroups {...iconSize(20)} />
              <Trans>Servers</Trans>
            </Tab>
            <Tab
              active={activeTab() === "bots"}
              onClick={() => setTab("bots")}
            >
              <MdSmartToy {...iconSize(20)} />
              <Trans>Bots</Trans>
            </Tab>
            <Tab
              active={activeTab() === "themes"}
              onClick={() => setTab("themes")}
            >
              <MdPalette {...iconSize(20)} />
              <Trans>Themes</Trans>
            </Tab>
          </Tabs>

          <MainContent>
            <Sidebar>
              <SidebarTitle>
                <Trans>Categories</Trans>
              </SidebarTitle>
              <CategoryList>
                <For each={CATEGORIES}>
                  {(cat) => (
                    <CategoryItem
                      active={activeCategory() === cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.icon}
                      <Text>{cat.name}</Text>
                    </CategoryItem>
                  )}
                </For>
              </CategoryList>
            </Sidebar>

            <ContentArea>
              <SectionTitle>
                <Show when={activeTab() === "servers"}>
                  <Trans>Featured Servers</Trans>
                </Show>
                <Show when={activeTab() === "bots"}>
                  <Trans>Featured Bots</Trans>
                </Show>
                <Show when={activeTab() === "themes"}>
                  <Trans>Featured Themes</Trans>
                </Show>
              </SectionTitle>

              <Grid>
                <For each={filteredServers()}>
                  {(server) => (
                    <Card
                      onClick={() => {
                        // In a real app, we'd fetch the actual invite
                        if (server.id === "01F7ZSBSFHQ8TA81725KQCSDDP") {
                            navigate(`/server/${server.id}`);
                        } else {
                            alert(`Opening ${server.name}`);
                        }
                      }}
                    >
                      <CardImage src={server.icon} />
                      <CardContent>
                        <CardHeader>
                          <Avatar
                            src={server.icon}
                            size={40}
                            fallback={server.name}
                          />
                          <Column gap="none">
                            <CardTitle>{server.name}</CardTitle>
                            <CardMeta>
                              {server.members.toLocaleString()} <Trans>members</Trans>
                            </CardMeta>
                          </Column>
                        </CardHeader>
                        <CardDescription>{server.description}</CardDescription>
                        <CardFooter>
                          <Button variant="tonal" class={css({ flexGrow: 1 })}>
                            <Trans>View Server</Trans>
                          </Button>
                        </CardFooter>
                      </CardContent>
                    </Card>
                  )}
                </For>
              </Grid>
            </ContentArea>
          </MainContent>
        </Container>
      </ScrollableContent>
    </Base>
  );
}

/**
 * Styled Components
 */
const Base = styled("div", {
  base: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface)",
  },
});

const ScrollableContent = styled("div", {
  base: {
    ...main.raw(),
    flexGrow: 1,
    overflowY: "auto",
  },
});

const Hero = styled("div", {
  base: {
    padding: "64px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    background: "linear-gradient(180deg, var(--md-sys-color-surface-container-low) 0%, var(--md-sys-color-surface) 100%)",
  },
});

const HeroTitle = styled("h1", {
  base: {
    fontSize: "32px",
    fontWeight: 700,
    marginBottom: "12px",
  },
});

const HeroSubtitle = styled("p", {
  base: {
    fontSize: "18px",
    color: "var(--md-sys-color-on-surface-variant)",
    marginBottom: "32px",
  },
});

const SearchWrapper = styled("div", {
  base: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
});

const Container = styled("div", {
  base: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 24px 64px 24px",
    width: "100%",
  },
});

const Tabs = styled("div", {
  base: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
    borderBottom: "1px solid var(--md-sys-color-outline-variant)",
    paddingBottom: "8px",
  },
});

const Tab = styled("button", {
  base: {
    padding: "8px 16px",
    borderRadius: "var(--borderRadius-full)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s ease",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
  variants: {
    active: {
      true: {
        background: "var(--md-sys-color-primary-container)",
        color: "var(--md-sys-color-on-primary-container)",
        "&:hover": {
          background: "var(--md-sys-color-primary-container)",
        },
      },
    },
  },
});

const MainContent = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: "32px",
    "@media (max-width: 800px)": {
      gridTemplateColumns: "1fr",
    },
  },
});

const Sidebar = styled("aside", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
});

const SidebarTitle = styled("h3", {
  base: {
    fontSize: "14px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--md-sys-color-on-surface-variant)",
    paddingLeft: "12px",
  },
});

const CategoryList = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
});

const CategoryItem = styled("button", {
  base: {
    padding: "10px 12px",
    borderRadius: "var(--borderRadius-md)",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.2s ease",
    background: "transparent",
    color: "var(--md-sys-color-on-surface-variant)",
    "& svg": {
        opacity: 0.7,
    },
    "&:hover": {
      background: "var(--md-sys-color-surface-container-high)",
    },
  },
  variants: {
    active: {
      true: {
        background: "var(--md-sys-color-secondary-container)",
        color: "var(--md-sys-color-on-secondary-container)",
        fontWeight: 600,
        "& svg": {
            opacity: 1,
        },
        "&:hover": {
          background: "var(--md-sys-color-secondary-container)",
        },
      },
    },
  },
});

const ContentArea = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
});

const SectionTitle = styled("h2", {
  base: {
    fontSize: "20px",
    fontWeight: 600,
  },
});

const Grid = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px",
  },
});

const Card = styled("div", {
  base: {
    background: "var(--md-sys-color-surface-container-low)",
    borderRadius: "var(--borderRadius-xl)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--md-sys-color-outline-variant)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      borderColor: "var(--md-sys-color-outline)",
    },
  },
});

const CardImage = styled("img", {
  base: {
    height: "120px",
    width: "100%",
    objectFit: "cover",
    backgroundColor: "var(--md-sys-color-surface-container-highest)",
  },
});

const CardContent = styled("div", {
  base: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flexGrow: 1,
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginTop: "-36px", // Overlap with image
  },
});

const CardTitle = styled("h4", {
  base: {
    fontSize: "16px",
    fontWeight: 600,
    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
    color: "var(--md-sys-color-on-surface)",
    background: "var(--md-sys-color-surface-container-low)",
    padding: "2px 4px",
    borderRadius: "4px",
  },
});

const CardMeta = styled("span", {
  base: {
    fontSize: "12px",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

const CardDescription = styled("p", {
  base: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "var(--md-sys-color-on-surface-variant)",
    display: "-webkit-box",
    "-webkit-line-clamp": "3",
    "-webkit-box-orient": "vertical",
    overflow: "hidden",
    height: "63px",
  },
});

const CardFooter = styled("div", {
  base: {
    marginTop: "auto",
    display: "flex",
    gap: "8px",
  },
});
