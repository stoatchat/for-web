import { useLingui } from "@lingui-solid/solid/macro";
import { useBeforeLeave, useNavigate, useParams } from "@solidjs/router";
import {
  createContext,
  createMemo,
  createSignal,
  JSXElement,
  Show,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { CONFIGURATION } from "@revolt/common";
import { AppConfig, STOAT_HOST } from "@revolt/common/lib/env";
import { LoadingScreen, useSnackbar } from "@revolt/ui";

import Instance, { _newClient } from "./Instance";

export const StoatOrigin = new URL(`https://${STOAT_HOST}`).origin;
export const DefaultURL = new URL(`https://${CONFIGURATION.DEFAULT_HOST}`);
export const DefaultHost = DefaultURL.host;
const DefRoute = `/i/${DefaultHost}/`;

const instanceContext = createContext<Instance>();

export function InstanceContext(props: { children?: JSXElement }) {
  const params = useParams();
  const snackbar = useSnackbar();
  const nav = useNavigate();
  const { t } = useLingui();

  const [inst, setInst] = createSignal<Instance>();

  //Check Stoat instance
  const host = [
    // historically...
    "api.revolt.chat",
    "beta.revolt.chat",
    "revolt.chat",
    // ... and now:
    "api.stoat.chat",
    "beta.stoat.chat",
  ].includes(params.host)
    ? STOAT_HOST
    : params.host;

  function onError(e: unknown) {
    console.error(e);
    if ((e as Error).message === "Failed to fetch") {
      const hStr = `'${host}'`;
      e = t`Couldn't fetch Stoat configuration from ${hStr}.`;
    }
    snackbar.show({
      message: t`Oops, something went wrong! ${e}`,
      placement: "bottom",
      closeable: true,
      autoCloseDelay: 30000,
    });
    history.back();
  }

  (async () => {
    //Redirect default instance
    //TODO This redirects ALL instance paths to default until multi-instance is ready
    // Replace with `if (host === DefaultHost)` when ready
    if (host) return nav(Instance.relPath(), { replace: true });

    try {
      const appCfg: AppConfig = host
        ? await (await fetch(`https://${host}/.well-known/stoat`)).json()
        : { api: CONFIGURATION.DEFAULT_API_URL };

      const cli = _newClient(appCfg.api);
      await cli.initConfig();
      setInst(new Instance(appCfg, cli, host, nav));
    } catch (e) {
      onError(e);
    }
  })();

  //Finish init in reactive scope
  const instInit = createMemo(() => {
    const i = inst();
    if (i) i._init();
    return i;
  });

  return (
    <Show
      when={instInit()}
      fallback={
        <LoadingScreen isStoat={(host || DefaultHost) === STOAT_HOST} />
      }
    >
      <Dynamic component={instanceContext.Provider} value={instInit()}>
        <Redirect />
        {props.children}
      </Dynamic>
    </Show>
  );
}

const DEF_MARK = "_defInst";

function Redirect() {
  const inst = useInstance(),
    nav = useNavigate();

  useBeforeLeave((e) => {
    if (typeof e.to !== "string") return;

    if ((e.to + "/").startsWith(DefRoute)) {
      //Redirect default instance
      e.preventDefault();
      nav(Instance.relPath(e.to), { state: DEF_MARK });
    } else if (
      inst.host &&
      !e.to.startsWith("/i/") &&
      e.options?.state !== DEF_MARK
    ) {
      //Redirect relative path to instance path
      e.preventDefault();
      nav(inst.href(e.to, true));
    }
  });

  return <></>;
}

export const useInstance = () => useContext(instanceContext)!;
