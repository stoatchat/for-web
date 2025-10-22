import { createEffect, on, onCleanup } from "solid-js";

import { ProtocolV1 } from "stoat.js/lib/events/v1";

import { useClient } from "@revolt/client";

import { useState } from ".";

/**
 * Manage synchronisation of settings to-from API
 */
export function SyncWorker() {
  const state = useState();
  const client = useClient();

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
      () => client(),
      (client) => {
        if (client) {
          state.sync.initialSync(client);

          client.events.addListener("event", handleEvent);
          onCleanup(() => client.events.removeListener("event", handleEvent));
        }
      },
    ),
  );

  // sync LOCAL->REMOTE settings
  createEffect(
    on(
      () => state.sync.shouldSync,
      (shouldSync) => shouldSync && state.sync.save(client()),
    ),
  );

  return null;
}
