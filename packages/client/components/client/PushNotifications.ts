import { Client } from "stoat.js";

export function setUpServiceWorkerSubscription(client: Client) {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return;
    registration.pushManager
      .getSubscription()
      .then(async (subscription) => {
        if (subscription) return subscription;

        const config = await client.api.get("/");

        return registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: config.vapid,
        });
      })
      .then((subscription) => {
        client.api.post("/push/subscribe", {
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64URL(
            subscription.getKey("p256dh") || new ArrayBuffer(),
          ),
          auth: arrayBufferToBase64URL(
            subscription.getKey("auth") || new ArrayBuffer(),
          ),
        });
      });
  });
}

function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const intArray = new Uint8Array(buffer);
  // Todo: Upon upgrading the target of this repo, use Uint8Array.prototype.toBase64() instead of this.
  const binaryString = [...intArray.values()]
    .map((byte) => String.fromCodePoint(byte))
    .join("");
  const base64String = btoa(binaryString);
  return base64String
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function killServiceWorkerSubscription(client: Client) {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (!registration) return;
    registration.pushManager.getSubscription().then((subscription) =>
      subscription?.unsubscribe().then((successful) => {
        if (successful) {
          client.api.post("/push/unsubscribe");
        }
      }),
    );
  });
}
