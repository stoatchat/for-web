import { useInstance } from "@revolt/instance";
import { RE_CHANNELS } from "stoat.js";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

export const remarkChannels: Plugin = () => (tree) => {
  const instance = useInstance();

  visit(
    tree,
    "text",
    (
      node: { type: "text"; value: string },
      idx,
      parent: { children: unknown[] },
    ) => {
      const elements = node.value.split(RE_CHANNELS);
      if (elements.length === 1) return; // no matches

      const newNodes = elements.map((value, index) => {
        if (index % 2) {
          return {
            type: "link",
            url: instance.href(`/channel/${value}`),
          };
        }

        return {
          type: "text",
          value,
        };
      });

      parent.children.splice(idx, 1, ...newNodes);
      return idx + newNodes.length;
    },
  );
};
