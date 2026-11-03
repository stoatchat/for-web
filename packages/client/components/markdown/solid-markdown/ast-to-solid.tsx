/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * This file is provided under the MIT License
 * Copyright (c) 2015 Espen Hovlandsdal
 * https://github.com/andi23rosca/solid-markdown/blob/master/license
 */
import { Component, JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { stringify as commas } from "comma-separated-tokens";
import type {
  Comment,
  Doctype,
  Element,
  ElementContent,
  Root,
  Text,
} from "hast";
import type { Schema } from "property-information";
import { find, hastToReact, svg } from "property-information";
import { stringify as spaces } from "space-separated-tokens";
import style from "style-to-object";

import { Embed } from "@revolt/ui";
import { Message, MessageEmbed } from "stoat.js";
import type { NormalComponents, SolidMarkdownProps } from "./complex-types";

export type Position = {
  start: { line: number | null; column: number | null; offset: number | null };
  end: { line: number | null; column: number | null; offset: number | null };
};

type Raw = {
  type: "raw";
  value: string;
};
type Context = {
  options: Options;
  schema: Schema;
  _listDepth?: number;
  _embeds?: MessageEmbed[];
};
type TransformLink = (
  href: string,
  children: ElementContent[],
  title?: string,
) => string;
type TransformImage = (src: string, alt: string, title?: string) => string;
type TransformLinkTargetType =
  | "_self"
  | "_blank"
  | "_parent"
  | "_top"
  | (string & {});

type TransformLinkTarget = (
  href: string,
  children: ElementContent[],
  title?: string,
) => TransformLinkTargetType | undefined;

type SolidMarkdownNames = keyof JSX.IntrinsicElements;

type CodeComponent = Component<
  JSX.IntrinsicElements["code"] & SolidMarkdownProps & { inline?: boolean }
>;
type HeadingComponent = Component<
  JSX.IntrinsicElements["h1"] & SolidMarkdownProps & { level: number }
>;
type LiComponent = Component<
  JSX.IntrinsicElements["li"] &
    SolidMarkdownProps & {
      checked: boolean | null;
      index: number;
      ordered: boolean;
    }
>;
type OrderedListComponent = Component<
  JSX.IntrinsicElements["ol"] &
    SolidMarkdownProps & { depth: number; ordered: true }
>;
type TableCellComponent = Component<
  JSX.IntrinsicElements["table"] &
    SolidMarkdownProps & { style?: Record<string, unknown>; isHeader: boolean }
>;
type TableRowComponent = Component<
  JSX.IntrinsicElements["tr"] & SolidMarkdownProps & { isHeader: boolean }
>;
type UnorderedListComponent = Component<
  JSX.IntrinsicElements["ul"] &
    SolidMarkdownProps & { depth: number; ordered: false }
>;

type SpecialComponents = {
  code: CodeComponent | SolidMarkdownNames;
  h1: HeadingComponent | SolidMarkdownNames;
  h2: HeadingComponent | SolidMarkdownNames;
  h3: HeadingComponent | SolidMarkdownNames;
  h4: HeadingComponent | SolidMarkdownNames;
  h5: HeadingComponent | SolidMarkdownNames;
  h6: HeadingComponent | SolidMarkdownNames;
  li: LiComponent | SolidMarkdownNames;
  ol: OrderedListComponent | SolidMarkdownNames;
  td: TableCellComponent | SolidMarkdownNames;
  th: TableCellComponent | SolidMarkdownNames;
  tr: TableRowComponent | SolidMarkdownNames;
  ul: UnorderedListComponent | SolidMarkdownNames;
};

type Components = Partial<Omit<NormalComponents, keyof SpecialComponents>> &
  Partial<SpecialComponents>;

export type Container = (md: JSX.Element[]) => JSX.Element;

export type Options = {
  sourcePos: boolean;
  rawSourcePos: boolean;
  skipHtml: boolean;
  includeElementIndex: boolean;
  transformLinkUri: null | false | TransformLink;
  transformImageUri?: TransformImage;
  linkTarget: TransformLinkTargetType | TransformLinkTarget;
  components: Components;
  container?: Container;
  message?: Message;
  embeds?: MessageEmbed[];
};

const own = {}.hasOwnProperty;

// The table-related elements that must not contain whitespace text according
// to React.
const tableElements = new Set(["table", "thead", "tbody", "tfoot", "tr"]);

export function childrenToSolid(
  context: Context,
  node: Element | Root,
): JSX.Element[] {
  const isRoot = node.type === "root";
  let children: JSX.Element[] = [],
    childIndex = -1;

  if (isRoot) context._listDepth = 0;

  //Copy embeds to track use
  const msgRoot = isRoot ? context.options.message : undefined;
  if (msgRoot?.embeds) context._embeds = msgRoot.embeds.slice();

  while (++childIndex < node.children.length) {
    const child = node.children[childIndex] as
      | Comment
      | Doctype
      | Element
      | Raw
      | Text;

    if (child.type === "element") {
      children.push(toSolid(context, child, childIndex, node));
    } else if (child.type === "text") {
      // React does not permit whitespace text elements as children of table:
      // cf. https://github.com/remarkjs/react-markdown/issues/576
      if (
        node.type !== "element" ||
        !tableElements.has(node.tagName) ||
        child.value !== "\n"
      ) {
        children.push(child.value);
      }
    } else if (child.type === "raw" && !context.options.skipHtml) {
      // Default behavior is to show (encoded) HTML.
      children.push(child.value);
    }
  }

  //Apply container
  if (isRoot && context.options.container)
    children = [context.options.container(children)];

  //Append unused embeds
  if (isRoot && context._embeds)
    for (const em of context._embeds) children.push(<Embed embed={em} />);

  return children;
}

function toSolid(
  context: Context,
  node: Element,
  index: number,
  parent: Element | Root,
): JSX.Element {
  const options = context.options;
  const parentSchema = context.schema;
  const name = node.tagName as SolidMarkdownNames;

  const properties: Record<string, unknown> = {};
  let schema = parentSchema;
  let property: string;

  if (parentSchema.space === "html" && name === "svg") {
    schema = svg;
    context.schema = schema;
  }

  if (node.properties) {
    for (property in node.properties) {
      if (own.call(node.properties, property)) {
        addProperty(properties, property, node.properties[property], context);
      }
    }
  }

  if (name === "ol" || name === "ul") ++context._listDepth!;

  const children = childrenToSolid(context, node);

  if (name === "ol" || name === "ul") --context._listDepth!;

  // Restore parent schema.
  context.schema = parentSchema;

  // Nodes created by plugins do not have positional info, in which case we use
  // an object that matches the position interface.
  const position = (node.position as Position) || {
    start: { line: null, column: null, offset: null },
    end: { line: null, column: null, offset: null },
  };
  const component =
    options.components && own.call(options.components, name)
      ? options.components[name]
      : name;
  const basic = typeof component === "string"; //|| component === React.Fragment;

  // TODO Reimplement is Valid
  // if (!ReactIs.isValidElementType(component)) {
  //   throw new TypeError(
  //     `Component for name \`${name}\` not defined or is not renderable`
  //   );
  // }

  properties.key = [
    name,
    position.start.line,
    position.start.column,
    index,
  ].join("-");

  if (name === "a" && options.linkTarget) {
    properties.target =
      typeof options.linkTarget === "function"
        ? options.linkTarget(
            String(properties.href || ""),
            node.children,
            typeof properties.title === "string" ? properties.title : undefined,
          )
        : options.linkTarget;
  }

  if (name === "a" && options.transformLinkUri) {
    properties.href = options.transformLinkUri(
      String(properties.href || ""),
      node.children,
      typeof properties.title === "string" ? properties.title : undefined,
    );
  }

  if (
    !basic &&
    name === "code" &&
    parent.type === "element" &&
    parent.tagName !== "pre"
  ) {
    properties.inline = true;
  }

  if (
    !basic &&
    (name === "h1" ||
      name === "h2" ||
      name === "h3" ||
      name === "h4" ||
      name === "h5" ||
      name === "h6")
  ) {
    properties.level = Number.parseInt(name.charAt(1), 10);
  }

  if (name === "img" && options.transformImageUri) {
    properties.src = options.transformImageUri(
      String(properties.src || ""),
      String(properties.alt || ""),
      typeof properties.title === "string" ? properties.title : undefined,
    );
  }

  if (!basic && name === "li" && parent.type === "element") {
    const input = getInputElement(node);
    properties.checked =
      input && input.properties ? Boolean(input.properties.checked) : null;
    properties.index = getElementsBeforeCount(parent, node);
    properties.ordered = parent.tagName === "ol";
  }

  if (!basic && (name === "ol" || name === "ul")) {
    properties.ordered = name === "ol";
    properties.depth = context._listDepth;
  }

  if (name === "td" || name === "th") {
    if (properties.align) {
      if (!properties.style) properties.style = {};
      // @ts-expect-error assume `style` is an object
      properties.style.textAlign = properties.align;
      delete properties.align;
    }

    if (!basic) {
      properties.isHeader = name === "th";
    }
  }

  if (!basic && name === "tr" && parent.type === "element") {
    properties.isHeader = Boolean(parent.tagName === "thead");
  }

  // If `sourcePos` is given, pass source information (line/column info from markdown source).
  if (options.sourcePos) {
    properties["data-sourcepos"] = flattenPosition(position);
  }

  if (!basic && options.rawSourcePos) {
    properties.sourcePosition = node.position;
  }

  // If `includeElementIndex` is given, pass node index info to components.
  if (!basic && options.includeElementIndex) {
    properties.index = getElementsBeforeCount(parent, node);
    properties.siblingCount = getElementsBeforeCount(parent);
  }

  if (!basic) {
    properties.node = node;
    properties.embeds = context._embeds;
  }

  return (
    <Dynamic component={component as any} {...properties}>
      {children}
    </Dynamic>
  );
}

function getInputElement(node: Element | Root): Element | null {
  let index = -1;

  while (++index < node.children.length) {
    const child = node.children[index];

    if (child.type === "element" && child.tagName === "input") {
      return child;
    }
  }

  return null;
}

function getElementsBeforeCount(
  parent: Element | Root,
  node?: Element,
): number {
  let index = -1;
  let count = 0;

  while (++index < parent.children.length) {
    if (parent.children[index] === node) break;
    if (parent.children[index].type === "element") count++;
  }

  return count;
}

function addProperty(
  props: Record<string, unknown>,
  prop: string,
  value: unknown,
  ctx: Context,
) {
  const info = find(ctx.schema, prop);
  let result = value;

  // Ignore nullish and `NaN` values.

  if (result === null || result === undefined || result !== result) {
    return;
  }

  // Accept `array`.
  // Most props are space-separated.
  if (Array.isArray(result)) {
    result = info.commaSeparated ? commas(result) : spaces(result);
  }

  if (info.property === "style" && typeof result === "string") {
    result = parseStyle(result);
  }

  if (info.space && info.property) {
    props[
      own.call(hastToReact, info.property)
        ? (hastToReact as any)[info.property]
        : info.property
    ] = result;
  } else if (info.attribute) {
    props[info.attribute] = result;
  }
}

function parseStyle(value: string): Record<string, string> {
  const result: Record<string, string> = {};

  try {
    style(value, iterator);
  } catch {
    // Silent.
  }

  return result;

  function iterator(name: string, v: string) {
    const k = name.slice(0, 4) === "-ms-" ? `ms-${name.slice(4)}` : name;
    result[k.replace(/-([a-z])/g, styleReplacer)] = v;
  }
}

function styleReplacer(_: unknown, $1: string) {
  return $1.toUpperCase();
}

function flattenPosition(
  pos:
    | Position
    | {
        start: { line: null; column: null; offset: null };
        end: { line: null; column: null; offset: null };
      },
): string {
  return [
    pos.start.line,
    ":",
    pos.start.column,
    "-",
    pos.end.line,
    ":",
    pos.end.column,
  ]
    .map((d) => String(d))
    .join("");
}
