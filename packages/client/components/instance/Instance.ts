import { Navigator } from "@solidjs/router";
import { Accessor, createMemo } from "solid-js";

import { CONFIGURATION } from "@revolt/common";
import { AppConfig, STOAT_HOST } from "@revolt/common/lib/env";
import { Client, UserLimits } from "stoat.js";

import { DefaultHost, StoatOrigin } from ".";

const R_RelPath = /^\/i\/[^/]+/;

export default class Instance {
  readonly host?: string;
  readonly origin: string;
  readonly isStoat: boolean;
  readonly #base;
  readonly #nav;

  readonly apiUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;
  readonly gifboxUrl: string;

  #firstInit = true;
  /** Note: This is slightly risky- If you import with const braces, eg. `const { client } = useInstance()`,
   * it won't be reactive. `useClient()` is preferred to avoid ambiguity. */
  readonly client!: Client;
  readonly config;

  //Instead of these, use the reactive limits accessor below when possible
  readonly globalLimits;
  readonly baseLimits;

  /** Current enforced limits based on user type */
  readonly limits: Accessor<UserLimits>;

  constructor(appCfg: AppConfig, cli: Client, host: string, nav: Navigator) {
    const apiCfg = (this.client = cli).configuration!,
      isDef = !host || host === DefaultHost;

    //Endpoints
    this.apiUrl = appCfg.api;
    this.mediaUrl = apiCfg.features.autumn.url;
    this.proxyUrl = apiCfg.features.january.url;
    //TODO Gifbox URL from backend
    this.gifboxUrl =
      (isDef && CONFIGURATION.DEV_GIFBOX_URL) || "https://api.gifbox.me";

    //Features
    this.config = apiCfg;
    this.globalLimits = apiCfg.features.limits.global;
    this.baseLimits = apiCfg.features.limits.new_user;
    this.limits = createMemo(() => this.client.limits ?? this.baseLimits);

    this.host = host || undefined;
    if (!host) host = DefaultHost;

    const hostUrl = new URL(`https://${host}`);
    this.origin = hostUrl.origin;
    this.isStoat = host === STOAT_HOST;
    this.#base = this.isStoat ? "" : `/i/${host}`;
    this.#nav = nav;
  }

  /** Prepend a relative path with instance base URL
   * @param pathOnly Get only the path component and not URL
   * @param base Defaults to the base path of this instance
   */
  href = (path: string, pathOnly?: boolean, base?: string) =>
    (pathOnly ? "" : StoatOrigin) + (base ? `/i/${base}` : this.#base) + path;

  /** Convert path to relative form, stripping instance prefix (if any)
   * @param path Defaults to `location.pathname` (non-reactive,
   * try `useLocation().pathname` if you need reactivity)
   */
  static relPath = (path = location.pathname) => path.replace(R_RelPath, "");

  /** Switch to a new instance and redirect the client */
  switchTo = (host: string) =>
    this.#nav(this.href(Instance.relPath(), true, host));

  /** Create a new Stoat.js client, disposing the old one */
  newClient() {
    //Reuse initial client for first login only
    if (this.#firstInit) {
      this.#firstInit = false;
      return this.client;
    }

    this.client.events.removeAllListeners();
    this.client.removeAllListeners();
    this.client.events.disconnect();

    //@ts-expect-error replace client
    return (this.client = _newClient(this.apiUrl));
  }
}

export function _newClient(apiUrl: string) {
  const cli = new Client({
    baseURL: apiUrl,
    autoReconnect: false,
    syncUnreads: true,
    debug: import.meta.env.DEV,
  });

  //Init client with env overrides
  cli.initConfig(() => {
    if (cli.options.baseURL === CONFIGURATION.DEFAULT_API_URL) {
      if (CONFIGURATION.DEV_WS_URL)
        cli.configuration!.ws = CONFIGURATION.DEV_WS_URL;
      if (CONFIGURATION.DEV_MEDIA_URL)
        cli.configuration!.features.autumn.url = CONFIGURATION.DEV_MEDIA_URL;
      if (CONFIGURATION.DEV_PROXY_URL)
        cli.configuration!.features.january.url = CONFIGURATION.DEV_PROXY_URL;
    }
  });

  return cli;
}
