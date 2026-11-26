import { createSignal } from "solid-js";

import { registerSW } from "virtual:pwa-register";

const [pendingUpdate, setPendingUpdate] = createSignal<() => void>();

export { pendingUpdate };

const updateSW = registerSW({
  onNeedRefresh() {
    setPendingUpdate(() => void updateSW(true));
  },
  onOfflineReady() {
    console.info("Ready to work offline =)");
    // toast to users
  },
  onRegistered(r) {
    // Check for updates every hour
    setInterval(() => r!.update(), 36e5);
  },
});
