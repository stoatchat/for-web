import { Match, Show, Switch, createSignal, onCleanup } from "solid-js";
import { QRCodeSVG } from "solid-qr-code";

import { Trans } from "@lingui/solid/macro";
import { styled } from "styled-system/jsx";

import { PLAY_STORE_URL } from "@revolt/common/lib/links";
import { useInstance } from "@revolt/instance";

import AndroidPhone from "../../../public/assets/inapp-promotion/web/android-phone.png";
import DesktopApp from "../../../public/assets/inapp-promotion/web/desktop-app.webp";

/**
 * Download page for the desktop app
 */
const DESKTOP_DOWNLOAD_URL = "https://stoat.chat/download";

/**
 * Widths at which the auth page shows its side panel (it hides below 900px)
 */
const PANEL_SHOWN = "(min-width: 901px)";

/**
 * Phones and tablets already get their own full screen app upsell
 */
const isMobileDevice = () =>
  /android|iphone|ipad|ipod/i.test(navigator.userAgent);

/**
 * Which app to promote: people in the desktop app hear about the Android
 * app, people in a browser hear about the desktop app, and third party
 * instances promote nothing, as the apps are Stoat's
 */
type Upsell = "android" | "desktop" | "none";

/**
 * Order the dev switch cycles through
 */
const DEV_CYCLE: Upsell[] = ["desktop", "android", "none"];

const Copy = styled("div", {
  base: {
    position: "relative",
    zIndex: 1,
    maxWidth: "min(100%, 400px)",
    marginTop: "clamp(28px, 5vh, 64px)",

    "& h2": {
      margin: 0,
      color: "#f8f6ff",
      fontSize: "clamp(1.9rem, 2.6vw, 2.7rem)",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.02,
    },

    "& h2 span": {
      color: "#08d3ef",
    },

    "& p": {
      maxWidth: "32ch",
      margin: "16px 0 0",
      color: "rgba(248, 246, 255, 0.72)",
      fontSize: "1rem",
      lineHeight: 1.5,
    },
  },
});

const Download = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginTop: "22px",

    "& a": {
      color: "#f8f6ff",
      fontSize: "0.9rem",
      fontWeight: 650,
      textDecoration: "none",
    },

    "& a:hover": {
      textDecoration: "underline",
    },

    "& span": {
      display: "block",
      marginBottom: "4px",
      color: "rgba(248, 246, 255, 0.6)",
      fontSize: "0.8rem",
    },
  },
});

const QrTile = styled("div", {
  base: {
    flexShrink: 0,
    display: "grid",
    padding: "8px",
    background: "#fff",
    borderRadius: "14px",
  },
});

const DownloadButton = styled("a", {
  base: {
    display: "inline-flex",
    alignItems: "center",
    marginTop: "24px",
    padding: "12px 20px",
    color: "#211b31",
    background: "#f8f6ff",
    borderRadius: "999px",
    fontSize: "0.9rem",
    fontWeight: 700,
    textDecoration: "none",
    transition: "background 150ms ease",

    "&:hover": {
      background: "#fff",
    },
  },
});

/**
 * Fills the panel below the copy, so the product shot never covers it
 */
const ShotWell = styled("div", {
  base: {
    position: "relative",
    flex: 1,
    minHeight: 0,
    marginTop: "24px",
  },
});

const Phone = styled("img", {
  base: {
    position: "absolute",
    top: 0,
    right: "-16%",
    width: "auto",
    // taller than the well so it bleeds off the bottom of the panel
    height: "175%",
    maxWidth: "none",
    pointerEvents: "none",
    userSelect: "none",
  },
});

const DesktopWindow = styled("img", {
  base: {
    position: "absolute",
    top: "8px",
    left: 0,
    width: "auto",
    // taller than the well so it bleeds off the bottom and right of the panel
    height: "118%",
    maxWidth: "none",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
    pointerEvents: "none",
    userSelect: "none",
  },
});

const DevSwitch = styled("button", {
  base: {
    position: "absolute",
    top: "12px",
    right: "12px",
    zIndex: 2,
    padding: "4px 8px",
    fontSize: "11px",
    cursor: "pointer",
  },
});

/**
 * Promotes whichever Stoat app the person logging in isn't already using
 */
export function AppUpsell() {
  const { isStoat } = useInstance();

  // don't render (and download images) while the panel is hidden
  const panelQuery = window.matchMedia(PANEL_SHOWN);
  const [panelShown, setPanelShown] = createSignal(panelQuery.matches);
  const onChange = (event: MediaQueryListEvent) => setPanelShown(event.matches);
  panelQuery.addEventListener("change", onChange);
  onCleanup(() => panelQuery.removeEventListener("change", onChange));

  // builds without the Stoat brand assets get a 1x1 transparent placeholder,
  // which would otherwise show up as an empty framed window
  const [desktopShotIsPlaceholder, setDesktopShotIsPlaceholder] =
    createSignal(false);

  const [upsell, setUpsell] = createSignal<Upsell>(
    !isStoat ? "none" : window.native ? "android" : "desktop",
  );

  // decided outside JSX, as Solid wraps JSX conditions in a way that stops
  // production builds from dropping dev-only code
  const devSwitch = import.meta.env.DEV && (
    <DevSwitch
      type="button"
      onClick={() =>
        setUpsell(
          (current) =>
            DEV_CYCLE[(DEV_CYCLE.indexOf(current) + 1) % DEV_CYCLE.length],
        )
      }
    >
      dev: showing {upsell() === "none" ? "third-party (none)" : upsell()}{" "}
      upsell ⇄
    </DevSwitch>
  );

  return (
    <Show when={panelShown() && !isMobileDevice()}>
      {devSwitch}

      <Switch>
        <Match when={upsell() === "android"}>
          <Copy>
            <h2>
              <Trans>
                Take your communities <span>with you.</span>
              </Trans>
            </h2>
            <p>
              <Trans>
                Get Stoat for Android and keep up with your friends wherever you
                are.
              </Trans>
            </p>

            <Download>
              <QrTile aria-hidden="true">
                <QRCodeSVG
                  value={PLAY_STORE_URL}
                  backgroundColor="white"
                  foregroundColor="#211b31"
                  level="medium"
                  width={72}
                  height={72}
                  backgroundAlpha={1}
                  foregroundAlpha={1}
                />
              </QrTile>
              <div>
                <span>
                  <Trans>Scan with your phone, or</Trans>
                </span>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trans>Get it on Google Play</Trans>
                </a>
              </div>
            </Download>
          </Copy>

          <ShotWell>
            <Phone src={AndroidPhone} alt="" loading="lazy" decoding="async" />
          </ShotWell>
        </Match>

        <Match when={upsell() === "desktop"}>
          <Copy>
            <h2>
              <Trans>
                Stoat, right on <span>your desktop.</span>
              </Trans>
            </h2>
            <p>
              <Trans>
                Get the desktop app for Windows, macOS and Linux and keep your
                conversations one click away.
              </Trans>
            </p>

            <DownloadButton
              href={DESKTOP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Trans>Download for desktop</Trans>
            </DownloadButton>
          </Copy>

          <ShotWell>
            <Show when={!desktopShotIsPlaceholder()}>
              <DesktopWindow
                src={DesktopApp}
                alt=""
                loading="lazy"
                decoding="async"
                onLoad={(event) =>
                  setDesktopShotIsPlaceholder(
                    event.currentTarget.naturalWidth <= 1,
                  )
                }
              />
            </Show>
          </ShotWell>
        </Match>
      </Switch>
    </Show>
  );
}
