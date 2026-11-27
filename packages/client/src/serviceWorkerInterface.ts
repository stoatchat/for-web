import { createSignal } from "solid-js";

import { registerSW } from "virtual:pwa-register";

const [pendingUpdate, setPendingUpdate] = createSignal<() => void>();

export { pendingUpdate };

const updateSW = registerSW({
  onNeedRefresh() {
    setPendingUpdate(() => () => void updateSW(true));
  },
  onOfflineReady() {
    console.info("Stoat is ready to work offline :3");
    // toast to users
  },
  onRegistered(r) {
    // Check for updates every hour
    setInterval(() => r && r.update(), 36e5);
  },
});
