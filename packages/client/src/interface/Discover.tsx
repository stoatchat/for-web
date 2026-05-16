import { createSignal, onCleanup } from "solid-js";

import { PublicBot, PublicChannelInvite } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import { paramsFromPathname, useLocation, useNavigate } from "@revolt/routing";
import { useState } from "@revolt/state";

/**
 * stt.gg wrapper
 */
export function Discover() {
  const state = useState();
  const client = useClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal } = useModals();
  const [ref, setRef] = createSignal<HTMLIFrameElement>();

  async function onMessage(message: MessageEvent) {
    const frame = ref();
    if (!frame) return;

    const url = new URL(message.origin);
    if (url.origin !== "https://stt.gg") return;

    const data = JSON.parse(message.data);
    console.info(data);
    if (data.source === "discover") {
      switch (data.type) {
        case "init": {
          frame.contentWindow?.postMessage(
            JSON.stringify({
              source: "revolt",
              type: "theme",
              theme: {},
            }),
            "*",
          );
          break;
        }
        case "path": {
          if (data.path.endsWith("?")) {
            data.path = data.path.substring(0, data.path.length - 1);
          }

          navigate(data.path);
          state.layout.setLastActivePath(data.path);
          break;
        }
        case "navigate": {
          const url = new URL(data.url);
          const params = paramsFromPathname(url.pathname);

          if (params.inviteId) {
            const invite = await client()
              .api.get(`/invites/${params.inviteId as ""}`)
              .then((invite) => PublicChannelInvite.from(client(), invite));

            openModal({
              type: "invite",
              invite,
            });
          } else if (params.botId) {
            client()
              .api.get(`/bots/${params.botId as ""}/invite`)
              .then((bot) => new PublicBot(client(), bot))
              .then((bot) => openModal({ type: "add_bot", invite: bot }));
          } else {
            alert("Missing handler for " + data.url);
          }

          break;
        }
        case "applyTheme": {
          alert("revite themes are not supported!");
          break;
        }
      }
    }
  }

  window.addEventListener("message", onMessage);
  onCleanup(() => window.removeEventListener("message", onMessage));

  // Render the URL once, update path in browser through messaging
  const query = new URLSearchParams(location.query as Record<string, string>);
  query.set("embedded", "true");
  const src = `https://stt.gg/${location.pathname}?${query}`;

  return <Base ref={setRef} src={src} />;
}

const Base = styled("iframe", {
  base: {
    minWidth: 0,
    flexGrow: 1,
    display: "flex",
    position: "relative",
    flexDirection: "column",
  },
});
