import { State } from "..";

import { AbstractStore } from ".";

export type TypeLinkSafety = {
  /**
   * Origins that the user has allowed to be opened
   */
  savedOrigins: string[];
};

/**
 * Keep track of safe origins
 */
export class LinkSafety extends AbstractStore<"linkSafety", TypeLinkSafety> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "linkSafety");
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {}

  /**
   * Generate default values
   */
  default(): TypeLinkSafety {
    return {
      savedOrigins: [],
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeLinkSafety>): TypeLinkSafety {
    return {
      savedOrigins:
        input.savedOrigins?.filter((origin) => typeof origin === "string") ??
        [],
    };
  }

  /**
   * Check whether an origin of a URL is trusted
   * @param url URL
   * @returns Whether it's trusted
   */
  isTrusted(url: URL) {
    return (
      url.origin !== "null" && this.get().savedOrigins.includes(url.origin)
    );
  }

  /**
   * Trust a URL
   * @param url URL
   */
  trust(url: URL) {
    if (url.origin !== "null") {
      this.set("savedOrigins", [...this.get().savedOrigins, url.origin]);
    }
  }
}
