import { JSX } from "solid-js";

import { useInstance } from "@revolt/instance";

export function Wordmark(
  props: Omit<JSX.HTMLAttributes<HTMLDivElement>, "children">,
) {
  const instance = useInstance();

  //TODO use object tag to prevent script parsing vulnerability

  // eslint-disable-next-line solid/no-innerhtml
  return <div {...props} innerHTML={instance.wordmark} />;
}
