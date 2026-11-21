import { JSX, splitProps } from "solid-js";

import { useInstance } from "@revolt/instance";

export function Wordmark(
  props: Omit<JSX.HTMLAttributes<HTMLDivElement>, "children">,
) {
  const instance = useInstance();

  const [_, remote] = splitProps(props, ["style"]);

  //TODO use object tag to prevent script parsing vulnerability

  return (
    // eslint-disable-next-line solid/no-innerhtml
    <div {...remote} style={{ margin: "auto" }} innerHTML={instance.wordmark} />
  );
}
