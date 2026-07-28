import { createSignal } from "solid-js";

import { Handler } from "mdast-util-to-hast";
import { styled } from "styled-system/jsx";
import { Plugin } from "unified";
import { visit } from "unist-util-visit";

const Spoiler = styled("span", {
  base: {
    display: "inline-block",
    padding: "0 6px",
    borderRadius: "var(--borderRadius-md)",
  },
  variants: {
    shown: {
      true: {
        background: "var(--md-sys-color-inverse-on-surface)",
      },
      false: {
        cursor: "pointer",
        userSelect: "none",
        color: "transparent",
        background: "var(--md-sys-color-on-secondary-fixed-variant)",

        "& *": {
          opacity: 0,
          pointerEvents: "none",
        },
      },
    },
  },
});

export function RenderSpoiler(props: {
  children: Element;
  disabled?: boolean;
}) {
  const [shown, setShown] = createSignal(false);

  return (
    <Spoiler
      shown={shown()}
      onClick={props.disabled ? undefined : () => setShown(true)}
    >
      {props.children}
    </Spoiler>
  );
}

type ParentNode = {
  type: "string";
  children: (
    | { type: "text"; value: string }
    | { type: "paragraph" | "spoiler"; children: Node[] }
  )[];
};

export const remarkSpoiler: Plugin = () => (tree) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tNodes = (tree as any).children;
  let spillover: Node[] | null;
  let spoilerStart = -1;
  let spoilerText: string;

  visit(tree, "paragraph", (node: ParentNode, tIdx) => {
    // Visit all children of paragraphs
    for (let i = 0, s, sl; i < node.children.length; ++i) {
      const child = node.children[i];

      // Find the next text element to start a spoiler from
      if (child.type === "text") {
        const spoilers = child.value.split("||");
        if (spoilers.length === 1) continue; //No spoilers
        node.children.splice(i, 1); //Delete this node

        //Parse spoiler start & end
        for (s = 1, sl = spoilers.length; s < sl; ++s) {
          if (spoilerStart !== -1) {
            //End spoiler
            const sText = spoilers[s - 1],
              elements = node.children.splice(spoilerStart, i - spoilerStart),
              inject = [
                {
                  type: "spoiler",
                  children: [
                    ...(spoilerText!
                      ? [{ type: "text", value: spoilerText }]
                      : []),
                    ...(spillover || []),
                    ...elements,
                    ...(sText && (spillover || i !== spoilerStart)
                      ? [{ type: "text", value: spoilers[s - 1] }]
                      : []),
                  ],
                },
                ...(spoilers[s] ? [{ type: "text", value: spoilers[s] }] : []),
              ];

            //Inject spoiler
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node.children.splice(spoilerStart, 0, ...(inject as any));
            i = spoilerStart + inject.length - 1;

            spoilerStart = -1;
            spillover = null;
          } else {
            //Inject non-spoiler text
            if (spoilers[s - 1])
              node.children.splice(i++, 0, {
                type: "text",
                value: spoilers[s - 1],
              });

            //Start spoiler
            spoilerStart = i;
            spoilerText = spoilers[s];
          }
        }
      }
    }

    //Spillover to next parent node
    if (spoilerStart !== -1) {
      if (!spillover) spillover = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      spillover.push(...(node.children.splice(spoilerStart) as any));
      spoilerStart = 0;
    }

    //Append excess spillover
    if (spillover && tIdx === tNodes.length - 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (node.children as any[]).push(
        ...(spoilerText! ? [{ type: "text", value: spoilerText! }] : []),
        ...spillover,
      );
    }
  });
};

export const spoilerHandler: Handler = (h, node) => {
  return {
    type: "element" as const,
    tagName: "spoiler",
    children: h.all({
      type: "paragraph",
      children: node.children,
    }),
    properties: {},
  };
};
