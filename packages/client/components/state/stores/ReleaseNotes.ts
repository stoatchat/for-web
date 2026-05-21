import { State } from "..";

import { AbstractStore } from ".";

export type TypeReleaseNotes = {
  /**
   * ID of the last seen changelog
   */
  lastSeenId: string;

  /**
   * Timestamp of the last seen changelog (unused for now)
   */
  lastSeenAt: string;
};

export class ReleaseNotes extends AbstractStore<
  "release-notes",
  TypeReleaseNotes
> {
  constructor(state: State) {
    super(state, "release-notes");
  }

  get() {
    return super.get();
  }

  hydrate(): void {}

  default(): TypeReleaseNotes {
    return {
      lastSeenId: "",
      lastSeenAt: "",
    };
  }

  clean(input: Partial<TypeReleaseNotes>): TypeReleaseNotes {
    return {
      lastSeenId: typeof input.lastSeenId === "string" ? input.lastSeenId : "",
      lastSeenAt: typeof input.lastSeenAt === "string" ? input.lastSeenAt : "",
    };
  }

  get lastSeenId(): string {
    return this.get().lastSeenId;
  }

  markSeen(id: string, publishedAt: string): void {
    this.set("lastSeenId", id);
    this.set("lastSeenAt", publishedAt);
  }
}
