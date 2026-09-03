import { Client, Server } from "stoat.js";

import { State } from "..";

import { AbstractStore } from ".";

/**
 * A group of servers shown as a single entry in the server list
 */
export interface ServerFolder {
  /**
   * Unique id, prefixed to never collide with a server id
   */
  id: string;

  /**
   * Folder name
   */
  name: string;

  /**
   * Colour used for the folder, any valid CSS colour
   */
  colour?: string;

  /**
   * Whether the folder is currently collapsed
   */
  collapsed?: boolean;

  /**
   * Ordered list of server IDs within this folder
   */
  servers: string[];
}

/**
 * An entry in the server list: either a server id or a folder
 */
export type OrderingEntry = string | ServerFolder;

/**
 * A resolved entry, ready to render
 */
export type ResolvedEntry =
  | { type: "server"; id: string; server: Server }
  | { type: "folder"; id: string; folder: ServerFolder; servers: Server[] };

export interface TypeOrdering {
  /**
   * Ordered list of server IDs and folders
   */
  servers: OrderingEntry[];
}

/**
 * Prefix applied to folder ids so they can never collide with a server id
 */
const FOLDER_PREFIX = "folder-";

/**
 * Determine whether an entry is a folder
 * @param entry Entry
 */
export function isFolder(entry: OrderingEntry): entry is ServerFolder {
  return typeof entry !== "string";
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
    this.createFolder = this.createFolder.bind(this);
    this.editFolder = this.editFolder.bind(this);
    this.deleteFolder = this.deleteFolder.bind(this);
    this.toggleFolder = this.toggleFolder.bind(this);
    this.addToFolder = this.addToFolder.bind(this);
    this.removeFromFolder = this.removeFromFolder.bind(this);
  }

  /**
   * Get this store's value
   *
   * Reexported to allow equals checking for syncing
   */
  get() {
    return super.get();
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
   *
   * Accepts the flat `string[]` written by clients without folder support, and
   * drops any server appearing more than once so it cannot render twice.
   */
  clean(input: Partial<TypeOrdering>): TypeOrdering {
    const ordering: TypeOrdering = this.default();
    const seenServers = new Set<string>();
    const seenFolders = new Set<string>();

    if (Array.isArray(input.servers)) {
      for (const entry of input.servers) {
        if (typeof entry === "string") {
          if (!seenServers.has(entry)) {
            seenServers.add(entry);
            ordering.servers.push(entry);
          }

          continue;
        }

        if (
          typeof entry !== "object" ||
          entry === null ||
          typeof entry.id !== "string" ||
          !entry.id ||
          seenFolders.has(entry.id)
        ) {
          continue;
        }

        seenFolders.add(entry.id);

        const servers: string[] = [];
        if (Array.isArray(entry.servers)) {
          for (const serverId of entry.servers) {
            if (typeof serverId === "string" && !seenServers.has(serverId)) {
              seenServers.add(serverId);
              servers.push(serverId);
            }
          }
        }

        const folder: ServerFolder = {
          id: entry.id,
          name: typeof entry.name === "string" ? entry.name : "",
          servers,
        };

        if (typeof entry.colour === "string") {
          folder.colour = entry.colour;
        }

        if (entry.collapsed === true) {
          folder.collapsed = true;
        }

        ordering.servers.push(folder);
      }
    }

    return ordering;
  }

  /**
   * All known servers with ordering applied, folder contents inlined
   *
   * Used where a flat list is wanted, such as the emoji picker.
   * @returns List of Server objects
   */
  orderedServers(client: Client) {
    const known = new Set(client?.servers.keys() ?? []);
    const out: Server[] = [];

    const take = (id: string) => {
      if (known.delete(id)) {
        out.push(client!.servers.get(id)!);
      }
    };

    for (const entry of this.get().servers) {
      if (isFolder(entry)) {
        entry.servers.forEach(take);
      } else {
        take(entry);
      }
    }

    for (const id of known) {
      out.push(client!.servers.get(id)!);
    }

    return out;
  }

  /**
   * All known servers grouped into their folders, ready to render
   *
   * Servers which are not yet ordered are appended at the end, matching
   * the behaviour of {@link orderedServers}.
   * @returns List of resolved entries
   */
  orderedEntries(client: Client): ResolvedEntry[] {
    const known = new Set(client?.servers.keys() ?? []);
    const out: ResolvedEntry[] = [];

    const take = (id: string) =>
      known.delete(id) ? client!.servers.get(id)! : undefined;

    for (const entry of this.get().servers) {
      if (isFolder(entry)) {
        const servers = entry.servers
          .map(take)
          .filter((server): server is Server => !!server);

        // a folder whose servers have all gone is not worth rendering
        if (servers.length) {
          out.push({ type: "folder", id: entry.id, folder: entry, servers });
        }

        continue;
      }

      const server = take(entry);
      if (server) {
        out.push({ type: "server", id: server.id, server });
      }
    }

    for (const id of known) {
      out.push({ type: "server", id, server: client!.servers.get(id)! });
    }

    return out;
  }

  /**
   * Set the order of top-level entries
   *
   * Ids may refer to either servers or folders; folder contents are preserved.
   * @param ids List of IDs
   */
  setServerOrder(ids: string[]) {
    const folders = new Map(
      this.get()
        .servers.filter(isFolder)
        .map((folder) => [folder.id, folder] as const),
    );

    this.set(
      "servers",
      ids.map((id) => folders.get(id) ?? id),
    );
  }

  /**
   * Create a new folder containing the given servers
   * @param name Folder name
   * @param serverIds Servers to place in the folder
   * @returns The new folder's id
   */
  createFolder(name: string, serverIds: string[] = []) {
    const id = `${FOLDER_PREFIX}${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const folder: ServerFolder = { id, name, servers: [...serverIds] };
    const members = new Set(serverIds);

    const entries: OrderingEntry[] = [];
    let placed = false;

    for (const entry of this.get().servers) {
      if (isFolder(entry)) {
        const remaining = entry.servers.filter((sid) => !members.has(sid));

        if (remaining.length !== entry.servers.length) {
          entries.push({ ...entry, servers: remaining });
        } else {
          entries.push(entry);
        }

        continue;
      }

      if (members.has(entry)) {
        // put the new folder where its first member used to sit
        if (!placed) {
          entries.push(folder);
          placed = true;
        }

        continue;
      }

      entries.push(entry);
    }

    if (!placed) {
      entries.push(folder);
    }

    this.set("servers", entries);
    return id;
  }

  /**
   * Change a folder's name or colour
   * @param id Folder id
   * @param changes Fields to change
   */
  editFolder(
    id: string,
    changes: Partial<Pick<ServerFolder, "name" | "colour">>,
  ) {
    this.#updateFolder(id, (folder) => ({ ...folder, ...changes }));
  }

  /**
   * Remove a folder, keeping its servers in place
   * @param id Folder id
   */
  deleteFolder(id: string) {
    const entries: OrderingEntry[] = [];

    for (const entry of this.get().servers) {
      if (isFolder(entry) && entry.id === id) {
        entries.push(...entry.servers);
        continue;
      }

      entries.push(entry);
    }

    this.set("servers", entries);
  }

  /**
   * Collapse or expand a folder
   * @param id Folder id
   */
  toggleFolder(id: string) {
    this.#updateFolder(id, (folder) => ({
      ...folder,
      collapsed: !folder.collapsed,
    }));
  }

  /**
   * Move a server into a folder, removing it from wherever it was
   * @param folderId Folder id
   * @param serverId Server to move
   */
  addToFolder(folderId: string, serverId: string) {
    const entries: OrderingEntry[] = [];

    for (const entry of this.get().servers) {
      if (isFolder(entry)) {
        if (entry.id === folderId) {
          entries.push({
            ...entry,
            servers: entry.servers.includes(serverId)
              ? entry.servers
              : [...entry.servers, serverId],
          });
        } else {
          entries.push({
            ...entry,
            servers: entry.servers.filter((sid) => sid !== serverId),
          });
        }

        continue;
      }

      if (entry !== serverId) {
        entries.push(entry);
      }
    }

    this.set("servers", entries);
  }

  /**
   * Move a server out of its folder, back to the top level
   * @param serverId Server to move
   */
  removeFromFolder(serverId: string) {
    const entries: OrderingEntry[] = [];
    let removed = false;

    for (const entry of this.get().servers) {
      if (isFolder(entry) && entry.servers.includes(serverId)) {
        entries.push({
          ...entry,
          servers: entry.servers.filter((sid) => sid !== serverId),
        });

        // sit the server directly after the folder it came out of, rather
        // than sending it to the end of the list
        entries.push(serverId);

        removed = true;
        continue;
      }

      entries.push(entry);
    }

    if (!removed) {
      return;
    }

    this.set("servers", entries);
  }

  /**
   * Find the folder a server currently belongs to
   * @param serverId Server id
   */
  folderOf(serverId: string): ServerFolder | undefined {
    return this.get()
      .servers.filter(isFolder)
      .find((folder) => folder.servers.includes(serverId));
  }

  /**
   * All folders which currently exist
   */
  folders(): ServerFolder[] {
    return this.get().servers.filter(isFolder);
  }

  /**
   * Apply a change to a single folder
   * @param id Folder id
   * @param apply Transformation
   */
  #updateFolder(id: string, apply: (folder: ServerFolder) => ServerFolder) {
    this.set(
      "servers",
      this.get().servers.map((entry) =>
        isFolder(entry) && entry.id === id ? apply(entry) : entry,
      ),
    );
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
