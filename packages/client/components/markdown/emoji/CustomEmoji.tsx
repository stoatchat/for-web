import { ComponentProps, splitProps } from "solid-js";

import { useInstance } from "@revolt/instance";
import { EmojiBase } from ".";

/**
 * Display custom emoji
 */
export function CustomEmoji(
  props: { id: string } & Omit<
    ComponentProps<typeof EmojiBase>,
    "loading" | "class" | "draggable" | "src"
  >,
) {
  const [local, remote] = splitProps(props, ["id"]);
  const { mediaUrl } = useInstance();

  return (
    <EmojiBase
      {...remote}
      loading="lazy"
      class="emoji"
      draggable={false}
      src={`${mediaUrl}/emojis/${local.id}`}
      alt={`:${local.id}:`}
    />
  );
}
