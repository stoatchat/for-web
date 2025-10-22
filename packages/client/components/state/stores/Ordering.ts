import { Client } from "stoat.js";

import { State } from "..";

import { AbstractStore } from ".";

export interface TypeOrdering {
  /**
   * Ordered list of server IDs
   */
  servers: string[];
}

/**
 * Handles ordering of items in the app interface.
 */
export class Ordering extends AbstractStore<"ordering", TypeOrdering> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "ordering");
    this.setServerOrder = this.setServerOrder.bind(this);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeOrdering {
    return {
      servers: [],
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeOrdering>): TypeOrdering {
    const ordering: TypeOrdering = this.default();

    if (Array.isArray(input.servers)) {
      for (const serverId of input.servers) {
        if (typeof serverId === "string") {
          ordering.servers.push(serverId);
        }
      }
    }

    return ordering;
  }

  /**
   * All known servers with ordering applied
   * @returns List of Server objects
   */
  orderedServers(client: Client) {
    const known = new Set(client?.servers.keys() ?? []);
    const ordered = [...this.get().servers];

    const out = [];
    for (const id of ordered) {
      if (known.delete(id)) {
        out.push(client!.servers.get(id)!);
      }
    }

    for (const id of known) {
      out.push(client!.servers.get(id)!);
    }

    return out;
  }

  /**
   * Set server ordering
   * @param ids List of IDs
   */
  setServerOrder(ids: string[]) {
    this.set("servers", ids);
  }

  /**
   * All known active DM conversations ordered by last updated
   * @returns List of Channel objects
   */
  orderedConversations(client: Client) {
    return (
      client.channels
        .toList()
        .filter(
          (channel) =>
            (channel.type === "DirectMessage" && channel.active) ||
            channel.type === "Group",
        )
        .sort((a, b) => +b.updatedAt - +a.updatedAt) ?? []
    );
  }
}
