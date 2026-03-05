import { CONFIGURATION } from "@revolt/common";
import { useParams } from "@solidjs/router";
import { createContext, JSXElement, useContext } from "solid-js";
import { API } from "stoat.js";
import Instance from "./Instance";

const instanceContext = createContext<Instance>();

export function InstanceContext(props: { children?: JSXElement }) {
  const params = useParams();

  let apiUrl = CONFIGURATION.DEFAULT_API_URL as string;
  let wsUrl = CONFIGURATION.DEFAULT_WS_URL as string;
  let mediaUrl = CONFIGURATION.DEFAULT_MEDIA_URL as string;
  let proxyUrl = CONFIGURATION.DEFAULT_PROXY_URL as string;

  if (params.hostname) {
    // TODO: Find a way to get this other than guessing
    apiUrl = `https://${params.hostname}/api`;

    const api = new API.API({
      baseURL: apiUrl,
    });

    api.get("/").then((config) => {
      wsUrl = config.ws;
      mediaUrl = config.features.autumn.url;
      proxyUrl = config.features.january.url;
    });
  }

  return (
    <instanceContext.Provider
      value={
        new Instance(
          apiUrl,
          wsUrl,
          mediaUrl,
          proxyUrl,
          CONFIGURATION.DEFAULT_GIFBOX_URL,
          CONFIGURATION.HCAPTCHA_SITEKEY,
          CONFIGURATION.MAX_EMOJI,
          CONFIGURATION.ENABLE_VIDEO,
          params.hostname,
        )
      }
    >
      {props.children}
    </instanceContext.Provider>
  );
}

export function useInstance() {
  const instance = useContext(instanceContext);

  if (!instance) {
    throw new Error("useInstance must be called inside InstanceProvider");
  }

  return instance;
}
