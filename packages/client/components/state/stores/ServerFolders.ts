import { ulid } from "ulid";

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

export interface TypeServerFolders {
  /**
   * Every folder which exists
   *
   * These are not in any particular order; where a folder appears in the
   * server list is decided by the ordering store, which knows nothing about
   * folders beyond the ids of the servers inside them.
   */
  folders: ServerFolder[];
}

/**
 * Prefix applied to folder ids so they can never collide with a server id
 */
const FOLDER_PREFIX = "folder-";

/**
 * Folders are kept in their own synced key rather than inside `ordering`.
 *
 * Clients without folder support read `ordering.servers` as a plain list of
 * server ids and write it back the same way, so anything else stored in there
 * is dropped the first time one of them reorders a server. Keeping folders
 * under a key those clients never ask for leaves them untouched.
 */
export class ServerFolders extends AbstractStore<
  "server-folders",
  TypeServerFolders
> {
  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "server-folders");
    this.create = this.create.bind(this);
    this.edit = this.edit.bind(this);
    this.remove = this.remove.bind(this);
    this.toggle = this.toggle.bind(this);
    this.addServer = this.addServer.bind(this);
    this.removeServer = this.removeServer.bind(this);
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
  default(): TypeServerFolders {
    return {
      folders: [],
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   *
   * A server may only belong to one folder, so any later claim on it is
   * dropped rather than rendering the server twice.
   */
  clean(input: Partial<TypeServerFolders>): TypeServerFolders {
    const folders: ServerFolder[] = [];
    const seenFolders = new Set<string>();
    const seenServers = new Set<string>();

    if (Array.isArray(input.folders)) {
      for (const entry of input.folders) {
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

        folders.push(folder);
      }
    }

    return { folders };
  }

  /**
   * Every folder which currently exists
   */
  list(): ServerFolder[] {
    return this.get().folders;
  }

  /**
   * Find the folder a server currently belongs to
   * @param serverId Server id
   */
  of(serverId: string): ServerFolder | undefined {
    return this.list().find((folder) => folder.servers.includes(serverId));
  }

  /**
   * Create a new folder containing the given servers
   * @param name Folder name
   * @param serverIds Servers to place in the folder
   * @returns The new folder's id
   */
  create(name: string, serverIds: string[] = []) {
    const id = `${FOLDER_PREFIX}${ulid()}`;
    const claimed = new Set(serverIds);

    this.#write([
      ...this.list().map((folder) => ({
        ...folder,
        servers: folder.servers.filter((sid) => !claimed.has(sid)),
      })),
      { id, name, servers: [...serverIds] },
    ]);

    return id;
  }

  /**
   * Change a folder's name or colour
   * @param id Folder id
   * @param changes Fields to change
   */
  edit(id: string, changes: Partial<Pick<ServerFolder, "name" | "colour">>) {
    this.#write(
      this.list().map((folder) =>
        folder.id === id ? { ...folder, ...changes } : folder,
      ),
    );
  }

  /**
   * Remove a folder, leaving its servers where they are in the list
   * @param id Folder id
   */
  remove(id: string) {
    this.#write(this.list().filter((folder) => folder.id !== id));
  }

  /**
   * Collapse or expand a folder
   * @param id Folder id
   */
  toggle(id: string) {
    this.#write(
      this.list().map((folder) =>
        folder.id === id ? { ...folder, collapsed: !folder.collapsed } : folder,
      ),
    );
  }

  /**
   * Move a server into a folder, taking it out of whichever folder held it
   * @param folderId Folder id
   * @param serverId Server to move
   */
  addServer(folderId: string, serverId: string) {
    this.#write(
      this.list().map((folder) => {
        if (folder.id === folderId) {
          return folder.servers.includes(serverId)
            ? folder
            : { ...folder, servers: [...folder.servers, serverId] };
        }

        return {
          ...folder,
          servers: folder.servers.filter((sid) => sid !== serverId),
        };
      }),
    );
  }

  /**
   * Put a server at a given position in a folder, taking it out of wherever
   * it was; used for dropping into a folder and for reordering within one
   * @param folderId Folder to place it in
   * @param serverId Server to move
   * @param before Server it should sit in front of, or the end of the folder
   */
  place(folderId: string, serverId: string, before?: string) {
    this.#write(
      this.list().map((folder) => {
        const servers = folder.servers.filter((sid) => sid !== serverId);

        if (folder.id !== folderId) return { ...folder, servers };

        const at = before ? servers.indexOf(before) : -1;
        const index = at === -1 ? servers.length : at;

        return {
          ...folder,
          servers: [
            ...servers.slice(0, index),
            serverId,
            ...servers.slice(index),
          ],
        };
      }),
    );
  }

  /**
   * Move a server out of its folder
   * @param serverId Server to move
   */
  removeServer(serverId: string) {
    this.#write(
      this.list().map((folder) => ({
        ...folder,
        servers: folder.servers.filter((sid) => sid !== serverId),
      })),
    );
  }

  /**
   * Store the given folders, forgetting any which have been left empty
   * @param folders Folders
   */
  #write(folders: ServerFolder[]) {
    this.set(
      "folders",
      folders.filter((folder) => folder.servers.length),
    );
  }
}
