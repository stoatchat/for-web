import { Dayjs } from "dayjs";
import { Root, RootContent } from "mdast";
import { Mark, Node } from "prosemirror-model";
import { Client } from "stoat.js";

import { UNIFIED_PLUGINS, unifiedPipeline } from "..";
import { UnicodeEmojiPacks, unicodeEmojiUrl } from "../emoji/UnicodeEmoji";

import { schema } from "./schema";

export function blankModel() {
  return schema.nodes.doc.createChecked(
    null,
    schema.nodes.paragraph.createChecked(null),
  );
}

interface Context {
  parent?: RootContent["type"];
  marks?: Mark[];
}

type RfmComponents =
  | {
      type: "mention";
      mentions: string;
    }
  | {
      type: "customEmoji";
      id: string;
    }
  | {
      type: "unicodeEmoji";
      str: string;
      pack?: UnicodeEmojiPacks;
    }
  | {
      type: "timestamp";
      format: string;
      date: Dayjs;
    };

function map(
  node: RootContent | RfmComponents,
  client: Client,
  context: Context = {},
): Node[] | Node {
  switch (node.type) {
    case "paragraph":
      return schema.nodes.paragraph.createChecked(
        null,
        node.children.flatMap((child) =>
          map(child, client, { parent: "paragraph" }),
        ),
      );
    case "text": {
      if (!node.value) return [];
      return schema.text(node.value, context.marks);
    }
    case "strong":
      return node.children.flatMap((child) =>
        map(child, client, {
          marks: [...(context.marks ?? []), schema.marks.strong.create()],
        }),
      );
    case "emphasis":
      return node.children.flatMap((child) =>
        map(child, client, {
          marks: [...(context.marks ?? []), schema.marks.em.create()],
        }),
      );
    case "link":
      return node.children.flatMap((child) =>
        map(child, client, {
          marks: [
            ...(context.marks ?? []),
            schema.marks.link.create({
              href: node.url,
            }),
          ],
        }),
      );
    case "delete":
      return node.children.flatMap((child) =>
        map(child, client, {
          marks: [
            ...(context.marks ?? []),
            schema.marks.strikethrough.create(),
          ],
        }),
      );
    case "heading":
      return schema.nodes.heading.createChecked(
        { level: node.depth },
        node.children.flatMap((child) =>
          map(child, client, { parent: "heading" }),
        ),
      );
    case "list":
      if (node.ordered) {
        return schema.nodes.ordered_list.createChecked(
          {
            start: node.start,
          },
          node.children.flatMap((child) =>
            map(child, client, { parent: "list" }),
          ),
        );
      } else {
        return schema.nodes.bullet_list.createChecked(
          null,
          node.children.flatMap((child) =>
            map(child, client, { parent: "list" }),
          ),
        );
      }
    case "listItem":
      return schema.nodes.list_item.createChecked(
        null,
        node.children.flatMap((child) =>
          map(child, client, { parent: "listItem" }),
        ),
      );
    case "inlineCode":
      return schema.text(node.value, [
        ...(context.marks ?? []),
        schema.marks.code.create(),
      ]);

    // RFM
    case "mention":
      if (node.mentions.startsWith("user:")) {
        const id = node.mentions.substring(5);
        const user = client.users.get(id);
        if (user) {
          return schema.nodes.rfm_user_mention.createAndFill({
            id,
            username: user.username,
            avatar: user.animatedAvatarURL,
          })!;
        } else {
          return schema.text(`<@${id}>`);
        }
      } else {
        return schema.text("no");
      }
    case "customEmoji":
      return schema.nodes.rfm_custom_emoji.createAndFill({
        id: node.id,
        src: `https://cdn.revoltusercontent.com/emojis/${node.id}`,
      })!;
    case "unicodeEmoji":
      return schema.nodes.rfm_unicode_emoji.createAndFill({
        id: node.str,
        pack: node.pack,
        src: unicodeEmojiUrl(node.pack, node.str),
      })!;
    case "timestamp":
      return schema.text(`<t:${node.date.unix()}:${node.format}>`);

    default: {
      console.info("Failing node:", node);

      const text = schema.text(`[missing ${node.type} serializer]`);
      if (context.parent === "paragraph") return [text];
      return [schema.nodes.paragraph.createChecked(null, text)];
    }
  }
}

export function markdownToProseMirrorModel(content: string, client: Client) {
  if (!content) return blankModel();

  const tree = unifiedPipeline.parse(content);

  for (const plugin of UNIFIED_PLUGINS) {
    (plugin as never as () => (tree: Root) => void)()(tree);
  }

  // console.info(tree);

  return schema.nodes.doc.createChecked(
    null,
    tree.children.flatMap((child) => map(child, client)),
  );
}
