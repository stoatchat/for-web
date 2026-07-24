import { useLingui } from "@lingui/solid/macro";
import { useBeforeLeave, useNavigate, useParams } from "@solidjs/router";
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  JSXElement,
  on,
  Show,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";

import { CONFIGURATION } from "@revolt/common";
import { normalizeHost, STOAT_HOST } from "@revolt/common/lib/env";
import { fetchHost } from "@revolt/state/stores/Hosts";
import { LoadingScreen, useSnackbar } from "@revolt/ui";
import { Client } from "stoat.js";

import Instance, { _initMock, _newClient } from "./Instance";

export const RE_HOST = /^[\w:.]{1,32}$/;
export const StoatOrigin = `https://${STOAT_HOST}`;
export const DefaultURL = new URL(`https://${CONFIGURATION.DEFAULT_HOST}`);
export const DefaultHost = DefaultURL.host;
const DefRoute = `/i/${DefaultHost}/`;

const WordmarkPath = "/assets/web/wordmark.svg";

const instanceContext = createContext<Instance>();

/** Throw this as a lifecycle error to trigger the emergency user swap page.
 * This baby lets us in no matter how early in load we are */
export const ForceSwapUser: { type: "InitSwapUser" } = { type: "InitSwapUser" };

export function InstanceContext(props: { children?: JSXElement }) {
  const params = useParams();
  const snackbar = useSnackbar();
  const nav = useNavigate();
  const { t } = useLingui();

  const getHost = createMemo(() => normalizeHost(params.host));
  const [getInst, setInst] = createSignal<Instance>();

  createEffect(
    on(getHost, (h) => {
      setInst();
      loadInst(h);
    }),
  );

  async function loadInst(host: string) {
    //Redirect default instance
    if (host === DefaultHost) return nav(Instance.relPath(), { replace: true });

    let inst: Instance | undefined;
    try {
      const appCfg = await fetchHost(host || DefaultHost);
      const cli = _newClient(appCfg.api);
      try {
        await cli.initConfig();
      } finally {
        inst = new Instance(appCfg, cli, host, nav);
      }

      const wordmark =
        //TODO better way to get instance client path than checking isStoat
        (host ? inst.origin + (inst.isStoat ? "/app" : "") : "") + WordmarkPath;

      try {
        inst.wordmark = await (await fetch(wordmark)).text();
      } catch (e) {
        console.error(e);
        //Fallback to builtin
        inst.wordmark = await (await fetch(WordmarkPath)).text();
      }

      setInst((i) => i ?? inst);
    } catch (e) {
      if (getInst()) return;
      if ((e as Error).message === "Failed to fetch") {
        const hStr = `'${host || DefaultHost}'`;
        // eslint-disable-next-line no-ex-assign
        e = t`Couldn't fetch Stoat configuration from ${hStr}.`;
      }

      if (host) {
        //Redirect to DefaultHost
        snackbar.showError(e);
        return nav("/login");
      } else if (inst) {
        //DefaultHost fail - Instance w/ mock client to show error
        inst.globalError = e;
        setInst(inst);
      } else {
        //Stuck in loop - This shouldn't be possible :(
        snackbar.showError(e);
      }
    }
  }

  //Mock client for pre-init user swap
  async function swapUser() {
    if (!getInst()) {
      const cli = new Client({ baseURL: DefaultHost });
      _initMock(cli);
      const inst = new Instance(await fetchHost(DefaultHost), cli, "", nav);
      inst.globalError = ForceSwapUser;
      setInst(inst);
    }
  }

  //Finish init in reactive scope
  const instInit = createMemo(() => {
    const i = getInst();
    if (i) i._init();
    return i;
  });

  return (
    <Show
      when={instInit()}
      fallback={
        <LoadingScreen
          isStoat={(getHost() || DefaultHost) === STOAT_HOST}
          swapUser={swapUser}
        />
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
