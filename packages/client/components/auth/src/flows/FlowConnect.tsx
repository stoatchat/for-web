import { createSignal, Show } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";
import { useNavigate } from "@solidjs/router";

import { Button, Column, iconSize, Row, Text, TextField } from "@revolt/ui";

import MdArrowBack from "@material-design-icons/svg/filled/arrow_back.svg?component-solid";

import { FlowTitle } from "./Flow";

/**
 * Select a self-hosted Stoat instance before signing in.
 */
export default function FlowConnect() {
  const navigate = useNavigate();
  const { t } = useLingui();
  const [error, setError] = createSignal<string>();

  function connect(event: SubmitEvent) {
    event.preventDefault();

    const form = new FormData(event.currentTarget as HTMLFormElement);
    const input = form.get("server")?.toString().trim();
    if (!input) return;

    try {
      const url = new URL(input.includes("://") ? input : `https://${input}`);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/" ||
        url.search ||
        url.hash
      ) {
        throw new Error();
      }

      navigate(`/i/${url.host}/login`);
    } catch {
      setError(t`Enter a valid HTTPS server address.`);
    }
  }

  return (
    <>
      <FlowTitle subtitle={<Trans>Connect to another Stoat server</Trans>}>
        <Trans>Add a server</Trans>
      </FlowTitle>

      <form onSubmit={connect}>
        <Column gap="lg">
          <Text>
            <Trans>
              Enter the address of the server you want to sign in to.
            </Trans>
          </Text>
          <TextField
            required
            type="text"
            name="server"
            label={t`Server address`}
            placeholder="chat.example.com"
            autocomplete="url"
            onInput={() => setError()}
          />
          <Show when={error()}>
            <span style={{ color: "var(--md-sys-color-error)" }}>
              {error()}
            </span>
          </Show>
          <Row align justify>
            <a href="..">
              <Button variant="text">
                <MdArrowBack {...iconSize("1.2em")} /> <Trans>Back</Trans>
              </Button>
            </a>
            <Button type="submit">
              <Trans>Connect</Trans>
            </Button>
          </Row>
        </Column>
      </form>
    </>
  );
}
