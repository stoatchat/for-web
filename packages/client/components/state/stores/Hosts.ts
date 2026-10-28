import { CONFIGURATION } from "@revolt/common";
import { AppConfig } from "@revolt/common/lib/env";
import { DefaultHost, useInstance } from "@revolt/instance";

import { AbstractStore } from ".";
import { State } from "..";

export type TypeHosts = { [host: string]: AppConfig };

/** Fetch latest config from host */
export async function fetchHost(host: string): Promise<AppConfig> {
  if (host === DefaultHost) return { api: CONFIGURATION.DEFAULT_API_URL };
  const cfg = await (await fetch(`https://${host}/.well-known/stoat`)).json();
  if (typeof cfg.api !== "string" || !cfg.api.startsWith("https://"))
    throw `Bad API for ${host} '${cfg.api}'`;
  return { api: cfg.api };
}

export class Hosts extends AbstractStore<"host", TypeHosts> {
  #inst = useInstance();

  constructor(state: State) {
    super(state, "host", true);
  }

  default(): TypeHosts {
    return {};
  }

  hydrate() {
    if (this.#inst.host)
      this.setHost(this.#inst.host, { api: this.#inst.apiUrl });
  }

  /** Validate store data */
  clean(input: Partial<TypeHosts>): TypeHosts {
    const hosts: TypeHosts = {};
    for (const [host, cfg] of Object.entries(input))
      if (typeof cfg?.api === "string" && cfg.api.startsWith("https://"))
        hosts[host] = { api: cfg.api };
    return hosts;
  }

  /** Fetch latest config from host and save */
  async fetchHost(host: string): Promise<AppConfig> {
    const cfg = await fetchHost(host);
    this.setHost(host, cfg);
    return cfg;
  }

  /** Get config for known host, if any */
  getHost(host: string): AppConfig | undefined {
    return this.get()[host];
  }

  /** Set config for host */
  setHost(host: string, cfg: AppConfig) {
    this.set(host, cfg);
  }
}
