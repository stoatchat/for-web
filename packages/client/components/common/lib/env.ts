export const STOAT_HOST = "stoat.chat";
export const STOAT_API = "https://api.stoat.chat";

/** App `stoat.json` endpoint format */
export interface AppConfig {
  api: string;
}

/**
 * Fetch env var by name, optionally only when in dev mode.
 * Also prevents compiler from optimizing out injected strings in Docker
 */
const getEnv = (name: string, devOnly?: boolean) =>
  !devOnly || import.meta.env.DEV
    ? (import.meta.env[name] as string)
    : undefined;

/** If host is Stoat, normalize to STOAT_HOST, else return host */
export const normalizeHost = (host: string) =>
  [
    // historically...
    "api.revolt.chat",
    "beta.revolt.chat",
    "revolt.chat",
    // ... and now:
    "api.stoat.chat",
    "beta.stoat.chat",
  ].includes(host)
    ? STOAT_HOST
    : host;

const DEFAULT_HOST = normalizeHost(
  getEnv("VITE_DEV_HOST", true) || getEnv("VITE_HOST") || STOAT_HOST,
);

const DEFAULT_API_URL =
  getEnv("VITE_DEV_API_URL", true) || getEnv("VITE_API_URL") || STOAT_API;

if (DEFAULT_API_URL !== STOAT_API && DEFAULT_HOST === STOAT_HOST)
  throw "VITE_HOST required when VITE_API_URL is set!";

export default {
  /** Default instance (without the protocol) */
  DEFAULT_HOST,
  /** API URL of default instance */
  DEFAULT_API_URL,
  /** WS server override for development */
  DEV_WS_URL: getEnv("VITE_DEV_WS_URL"),
  /** Media server override for development */
  DEV_MEDIA_URL: getEnv("VITE_DEV_MEDIA_URL"),
  /** Proxy server override for development */
  DEV_PROXY_URL: getEnv("VITE_DEV_PROXY_URL"),
  /** Gifbox server override for development */
  DEV_GIFBOX_URL: getEnv("VITE_DEV_GIFBOX_URL"),
  /**
   * RNNoise worklet CDN host location. Defaults to blank, which uses the url provided by the livekit-rnnoise-processor package.
   */
  RNNOISE_WORKLET_CDN_URL: getEnv("VITE_RNNOISE_WORKLET_CDN_URL"),
  /**
   * Session ID to set during development.
   */
  DEVELOPMENT_SESSION_ID: getEnv("VITE_SESSION_ID", true),
  /**
   * Token to set during development.
   */
  DEVELOPMENT_TOKEN: getEnv("VITE_TOKEN", true),
  /**
   * User ID to set during development.
   */
  DEVELOPMENT_USER_ID: getEnv("VITE_USER_ID", true),
};
