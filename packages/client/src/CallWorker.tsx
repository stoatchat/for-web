import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { createEffect, onCleanup } from "solid-js";
import { Channel, User } from "stoat.js";

/**
 * Handle incoming call events and manage ringing state
 */
export function CallWorker() {
  const client = useClient();
  const { openModal, remove, modals } = useModals();

  createEffect(() => {
    const c = client();

    const onCallStart = (channel: Channel, user: User) => {
      // Don't ring if we're the ones who started it
      if (user.id === c.user?.id) return;

      openModal({
        type: "ringing",
        channel,
        user,
      });
    };

    const onCallEnd = (channel: Channel) => {
      // Close any ringing modals for this channel
      const activeModal = modals.find(
        (m) => m.props.type === "ringing" && m.props.channel.id === channel.id,
      );
      if (activeModal) {
        remove(activeModal.id);
      }
    };

    c.on("callStart", onCallStart);
    c.on("callEnd", onCallEnd);

    onCleanup(() => {
      c.off("callStart", onCallStart);
      c.off("callEnd", onCallEnd);
    });
  });

  return null;
}
