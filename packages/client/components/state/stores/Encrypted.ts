import { Channel, genKey } from "stoat.js";

import { AbstractStore } from ".";
import { State } from "..";

export type TypeEncrypted = {
  pwd: { [channelId: string]: string };
};

export const PwdMinLength = 6;

export class Encrypted extends AbstractStore<"e2e", TypeEncrypted> {
  constructor(state: State) {
    super(state, "e2e");
  }

  default(): TypeEncrypted {
    return { pwd: {} };
  }

  hydrate() {
    //TODO Delete for channels that you don't have access to
  }

  clean(input: Partial<TypeEncrypted>): TypeEncrypted {
    const e2e: TypeEncrypted = { pwd: {} };
    if (input.pwd)
      for (const [id, pwd] of Object.entries(input.pwd))
        if (id?.length === 26 && typeof pwd === "string") e2e.pwd[id] = pwd;
    return e2e;
  }

  /** Set password for channel */
  async setPass(chan: Channel, pwd: string) {
    if (pwd.length < PwdMinLength) throw "Password too short!";
    chan.key = await genKey(chan.id, pwd);
    this.set("pwd", chan.id, pwd);
  }

  /** Save password to store */
  savePass(chanId: string, pwd: string) {
    this.set("pwd", chanId, pwd);
  }

  getPass(chanId: string): string | undefined {
    return this.get().pwd[chanId];
  }

  deletePass(chanId: string) {
    const pwd = { ...this.get().pwd };
    delete pwd[chanId];
    this.set("pwd", pwd);
  }
}
