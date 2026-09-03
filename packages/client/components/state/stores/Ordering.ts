import { Client, Server } from "stoat.js";

import { State } from "..";

import { AbstractStore } from ".";
import { ServerFolder } from "./ServerFolders";

/**
 * A resolved entry, ready to render
 */
export type ResolvedEntry =
  | { type: "server"; id: string; server: Server }
  | { type: "folder"; id: string; folder: ServerFolder; servers: Server[] };

export interface TypeOrdering {
  /**
   * Ordered list of server IDs
   *
   * Servers inside folders stay in this list, and a folder is drawn where the
   * first of its servers sits. Kept as plain ids so that clients without
   * folder support can read and write this key without losing anything.
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
    const servers: string[] = [];
    const seen = new Set<string>();

    if (Array.isArray(input.servers)) {
      for (const entry of input.servers) {
        // folders used to be written inline here, so keep hold of their
        // members rather than dropping the servers along with the folder
        const ids =
          typeof entry === "string"
            ? [entry]
            : Array.isArray((entry as ServerFolder)?.servers)
              ? (entry as ServerFolder).servers
              : [];

        for (const id of ids) {
          if (typeof id === "string" && id && !seen.has(id)) {
            seen.add(id);
            servers.push(id);
          }
        }
      }
    }

    return { servers };
  }

  /**
   * All known servers with ordering applied, folder contents inlined
   *
   * Used where a flat list is wanted, such as the emoji picker and keyboard
   * navigation, so it follows what is actually on screen.
   * @returns List of Server objects
   */
  orderedServers(client: Client) {
    return this.orderedEntries(client).flatMap((entry) =>
      entry.type === "folder" ? entry.servers : [entry.server],
    );
  }

  /**
   * All known servers grouped into their folders, ready to render
   *
   * A folder is drawn where the first of its servers sits in the ordering.
   * Servers which are not yet ordered are appended at the end, matching the
   * behaviour of {@link orderedServers}.
   * @returns List of resolved entries
   */
  orderedEntries(client: Client): ResolvedEntry[] {
    const known = new Set(client?.servers.keys() ?? []);
    const folderOf = new Map<string, ServerFolder>();

    for (const folder of this.folders()) {
      for (const serverId of folder.servers) {
        if (!folderOf.has(serverId)) {
          folderOf.set(serverId, folder);
        }
      }
    }

    const out: ResolvedEntry[] = [];
    const drawn = new Set<string>();

    const take = (id: string) => {
      const folder = folderOf.get(id);

      if (folder) {
        if (drawn.has(folder.id)) return;
        drawn.add(folder.id);

        const servers = folder.servers
          .filter((serverId) => known.delete(serverId))
          .map((serverId) => client!.servers.get(serverId)!);

        // a folder whose servers have all gone is not worth rendering
        if (servers.length) {
          out.push({ type: "folder", id: folder.id, folder, servers });
        }

        return;
      }

      if (known.delete(id)) {
        out.push({ type: "server", id, server: client!.servers.get(id)! });
      }
    };

    this.get().servers.forEach(take);
    [...known].forEach(take);

    return out;
  }

  /**
   * Set the order of top-level entries
   *
   * Ids may refer to either servers or folders; a folder is written out as the
   * servers it holds, so what gets stored stays a plain list of server ids.
   * @param ids List of IDs
   */
  setServerOrder(ids: string[]) {
    const folders = new Map(
      this.folders().map((folder) => [folder.id, folder] as const),
    );

    this.set(
      "servers",
      ids.flatMap((id) => folders.get(id)?.servers ?? [id]),
    );
  }

  /**
   * Create a new folder containing the given servers
   * @param name Folder name
   * @param serverIds Servers to place in the folder
   * @returns The new folder's id
   */
  createFolder(name: string, serverIds: string[] = []) {
    return this.state["server-folders"].create(name, serverIds);
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
    this.state["server-folders"].edit(id, changes);
  }

  /**
   * Remove a folder, keeping its servers in place
   * @param id Folder id
   */
  deleteFolder(id: string) {
    this.state["server-folders"].remove(id);
  }

  /**
   * Collapse or expand a folder
   * @param id Folder id
   */
  toggleFolder(id: string) {
    this.state["server-folders"].toggle(id);
  }

  /**
   * Move a server into a folder, removing it from wherever it was
   * @param folderId Folder id
   * @param serverId Server to move
   */
  addToFolder(folderId: string, serverId: string) {
    this.state["server-folders"].addServer(folderId, serverId);
  }

  /**
   * Put a server at a given position within a folder
   * @param folderId Folder to place it in
   * @param serverId Server to move
   * @param before Server it should sit in front of
   */
  placeInFolder(folderId: string, serverId: string, before?: string) {
    this.state["server-folders"].place(folderId, serverId, before);
  }

  /**
   * Move a server out of its folder, back to the top level
   * @param serverId Server to move
   */
  removeFromFolder(serverId: string) {
    this.state["server-folders"].removeServer(serverId);
  }

  /**
   * Find the folder a server currently belongs to
   * @param serverId Server id
   */
  folderOf(serverId: string): ServerFolder | undefined {
    return this.state["server-folders"].of(serverId);
  }

  /**
   * All folders which currently exist
   */
  folders(): ServerFolder[] {
    return this.state["server-folders"].list();
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
