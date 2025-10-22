import type { ListItem, PhrasingContent, Root, RootContent } from "mdast";
import { CodeBlockNodeName } from "prosemirror-codemirror-block";
import { Node } from "prosemirror-model";
import remarkStringify from "remark-stringify";

import { unifiedPipeline } from "..";
import { UNICODE_EMOJI_PACK_PUA } from "../emoji/UnicodeEmoji";

import { schema } from "./schema";

const pipeline = unifiedPipeline.use(remarkStringify);

// NB. https://github.com/syntax-tree/mdast

function map(node: Node): RootContent {
  // apply marks
  if (node.marks.length) {
    const mark = node.marks[0];
    switch (mark.type.name as keyof (typeof schema)["marks"]) {
      case "strong":
        return {
          type: "strong",
          children: [
            map({
              ...node,
              marks: node.marks.slice(1),
            } as never) as PhrasingContent,
          ],
        };
      case "em":
        return {
          type: "emphasis",
          children: [
            map({
              ...node,
              marks: node.marks.slice(1),
            } as never) as PhrasingContent,
          ],
        };
      // todo: enable the gfm delete plugin ONLY
      // case "strikethrough":
      //   return {
      //     type: "delete",
      //     children: [
      //       map({
      //         ...node,
      //         marks: node.marks.slice(1),
      //       } as never) as PhrasingContent,
      //     ],
      //   };
      case "link":
        return {
          type: "link",
          url: node.attrs.href,
          title: node.attrs.title ?? node.attrs.href,
          children: [
            map({
              ...node,
              marks: node.marks.slice(1),
            } as never) as PhrasingContent,
          ],
        };
      case "code":
        return {
          type: "inlineCode",
          value: node.text ?? "",
        };
    }
  }

  // apply node
  switch (node.type.name as keyof (typeof schema)["nodes"]) {
    case "paragraph":
      return {
        type: "paragraph",
        children: node.children.map(map) as PhrasingContent[],
      };
    case "text":
      return {
        type: "text",
        value: node.text!,
      };
    case CodeBlockNodeName:
      return {
        type: "code",
        lang: node.attrs.lang,
        value: node.textContent,
      };
    case "heading":
      return {
        type: "heading",
        depth: node.attrs.level,
        children: node.children.map(map) as PhrasingContent[],
      };
    case "bullet_list":
      return {
        type: "list",
        ordered: false,
        children: node.children.map(map) as ListItem[],
      };
    case "ordered_list":
      return {
        type: "list",
        ordered: true,
        start: node.attrs.order,
        children: node.children.map(map) as ListItem[],
      };
    case "list_item":
      return {
        type: "listItem",
        children: node.children.map(map) as never,
      };

    // RFM

    case "rfm_custom_emoji":
      return {
        type: "text",
        value: `:${node.attrs.id}:`,
      };
    case "rfm_unicode_emoji":
      return {
        type: "text",
        value: `${UNICODE_EMOJI_PACK_PUA[node.attrs.pack as never] ?? ""}${node.attrs.id}`,
      };
    case "rfm_user_mention":
      return {
        type: "text",
        value: `<@${node.attrs.id}>`,
      };
    case "rfm_role_mention":
      return {
        type: "text",
        value: `<%${node.attrs.id}>`,
      };
    case "rfm_channel_mention":
      return {
        type: "text",
        value: `<#${node.attrs.id}>`,
      };

    default:
      console.info("Failing node:", node);
      return {
        type: "text",
        value: `[missing ${node.type.name} serializer]`,
      };
  }
}

/**
 * Regex for matching double new lines
 */
const RE_DOUBLE_NEW_LINES = /\n\n/g;

/**
 * Regex for matching special marker in codeblock
 */
const RE_CODEBLOCK_MARKER = /(?<=`{3}[\s\S]*)\uF8FF(?=[\s\S]*`{3})/gm;

/**
 * Regex for matching special marker
 */
const RE_MARKER = /\uF8FF/g;

export function markdownFromProseMirrorModel(model: Node) {
  // console.info(model);

  if (model.type.name !== "doc") {
    throw "root node should be 'doc'?";
  }

  const root: Root = {
    type: "root",
    children: model.children.map(map),
  };

  // console.info(JSON.stringify(root));
  // console.info(pipeline.stringify(root));

  return (
    pipeline
      .stringify(root)
      // Replace double newlines with special marker
      .replace(RE_DOUBLE_NEW_LINES, "\uF8FF")
      // Skip the ones in codeblocks
      .replace(RE_CODEBLOCK_MARKER, "\n\n")
      // And now put a single newline
      .replace(RE_MARKER, "\n")
      // Strip spaces and newlines at start and end
      .trim()
  );
}
