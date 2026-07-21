export const STOAT_HOST = "stoat.chat";
export const STOAT_API = "https://api.stoat.chat";

/** App `stoat.json` endpoint format */
export interface AppConfig {
  api: string;
}

export default {
  /**
   * Whether to emit additional debug information
   */
  DEBUG: import.meta.env.DEV || true,
  /** Default instance (without the protocol) */
  DEFAULT_HOST:
    (import.meta.env.DEV ? import.meta.env.VITE_DEV_HOST : undefined) ??
    (import.meta.env.VITE_HOST as string) ??
    STOAT_HOST,
  /** API URL of default instance */
  DEFAULT_API_URL:
    (import.meta.env.DEV ? import.meta.env.VITE_DEV_API_URL : undefined) ??
    (import.meta.env.VITE_API_URL as string) ??
    STOAT_API,
  /** WS server override for development */
  DEV_WS_URL: import.meta.env.VITE_DEV_WS_URL as string | undefined,
  /** Media server override for development */
  DEV_MEDIA_URL: import.meta.env.VITE_DEV_MEDIA_URL as string | undefined,
  /** Proxy server override for development */
  DEV_PROXY_URL: import.meta.env.VITE_DEV_PROXY_URL as string | undefined,
  /** Gifbox server override for development */
  DEV_GIFBOX_URL: import.meta.env.VITE_DEV_GIFBOX_URL as string | undefined,
  /**
   * RNNoise worklet CDN host location. Defaults to blank, which uses the url provided by the livekit-rnnoise-processor package.
   */
  RNNOISE_WORKLET_CDN_URL:
    (import.meta.env.VITE_RNNOISE_WORKLET_CDN_URL as string) ?? "",
  /**
   * Session ID to set during development.
   */
  DEVELOPMENT_SESSION_ID: import.meta.env.DEV
    ? (import.meta.env.VITE_SESSION_ID as string)
    : undefined,
  /**
   * Token to set during development.
   */
  DEVELOPMENT_TOKEN: import.meta.env.DEV
    ? (import.meta.env.VITE_TOKEN as string)
    : undefined,
  /**
   * User ID to set during development.
   */
  DEVELOPMENT_USER_ID: import.meta.env.DEV
    ? (import.meta.env.VITE_USER_ID as string)
    : undefined,
};
