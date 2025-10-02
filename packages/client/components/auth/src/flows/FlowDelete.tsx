import { Match, Switch, createSignal, onMount } from "solid-js";

import { useApi } from "@revolt/client";
import { useParams } from "@revolt/routing";

import { FlowTitle } from "./Flow";

/**
 * Temporary flow for account deletion
 */
export default function FlowDeleteAccount() {
  const api = useApi();
  const params = useParams();
  const [deleted, setDeleted] = createSignal<boolean | "error">(false);

  onMount(() => {
    api
      .put("/auth/account/delete", {
        token: params.token,
      })
      .then(() => setDeleted(true))
      .catch(() => setDeleted("error"));
  });

  return (
    <>
      <FlowTitle>Delete Account</FlowTitle>
      <span>
        <Switch fallback={"Please wait..."}>
          <Match when={deleted() === "error"}>
            Error occurred, please email support.
          </Match>
          <Match when={deleted() === true}>
            Account has been queued for deletion!
          </Match>
        </Switch>
      </span>
    </>
  );
}
