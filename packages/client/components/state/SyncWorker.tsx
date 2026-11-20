import { throttle } from "@solid-primitives/scheduled";
import { createEffect, on, onCleanup } from "solid-js";

import { ProtocolV1 } from "stoat.js";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";

import { useState } from ".";

/**
 * Manage synchronisation of settings to-from API
 */
export function SyncWorker() {
  const state = useState();
  const client = useClient();
  const { lifecycle } = useClientLifecycle();

  const throttledSave = throttle(() => state.sync.save(client()), 250);

  /**
   * Handle incoming events
   * @param event Event
   */
  function handleEvent(event: ProtocolV1["server"]) {
    if (event.type === "UserSettingsUpdate") {
      state.sync.consumeEvent(event.update);
    }
  }

  // sync REMOTE->LOCAL settings
  createEffect(
    on(
      () => lifecycle.state(),
      (newState) => {
        if (newState === State.Connected) {
          const c = client();
          state.sync.initialSync(c);

          c.events.addListener("event", handleEvent);
          onCleanup(() => c.events.removeListener("event", handleEvent));
        }
      },
    ),
  );

  // sync LOCAL->REMOTE settings
  createEffect(
    on(
      [() => state.sync.shouldSync, lifecycle.state],
      ([shouldSync, newState]) => {
        if (shouldSync && newState === State.Connected) throttledSave();
        if (newState !== State.Connected) throttledSave.clear();
      },
    ),
  );

  return null;
}
