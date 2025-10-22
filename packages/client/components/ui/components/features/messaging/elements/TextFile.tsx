import { Match, Switch, createSignal, onMount } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { File } from "stoat.js";
import { styled } from "styled-system/jsx";

import { Button, CircularProgress } from "@revolt/ui/components/design";
import { Row } from "@revolt/ui/components/layout";
import { humanFileSize } from "@revolt/ui/components/utils";

interface Props {
  /**
   * Relevant file
   */
  file: File;
}

/**
 * Text file container
 */
const Container = styled("pre", {
  base: {
    display: "flex",
    overflow: "auto",
    scrollbarWidth: "thin",
    flexDirection: "column",
  },
});

/**
 * Maximum permissible size in bytes for auto loading text files
 */
const AUTO_LOAD_MAX_SIZE_BYTES = 50_000;

/**
 * Render contents of a text file
 */
export function TextFile(props: Props) {
  const [loading, setLoading] = createSignal(false);
  const [contents, setContents] = createSignal<string | undefined>(undefined);

  /**
   * Load the file data
   */
  async function load() {
    setLoading(true);

    const res = await fetch(props.file.originalUrl);
    const data = await res.text();

    setContents(data);
  }

  onMount(() => {
    if (props.file.size && props.file.size <= AUTO_LOAD_MAX_SIZE_BYTES) {
      load();
    }
  });

  return (
    <Container>
      <Switch fallback={<CircularProgress />}>
        <Match
          when={
            !loading() &&
            !contents() &&
            (!props.file.size || props.file.size > AUTO_LOAD_MAX_SIZE_BYTES)
          }
        >
          <Row align justify grow>
            <Button variant="filled" onPress={load}>
              <Trans>Load file ({humanFileSize(props.file.size ?? 0)})</Trans>
            </Button>
          </Row>
        </Match>
        <Match when={typeof contents() !== "undefined"}>
          <code>{contents()}</code>
        </Match>
      </Switch>
    </Container>
  );
}
