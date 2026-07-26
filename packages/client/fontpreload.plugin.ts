import type { HtmlTagDescriptor, Plugin } from "vite";

// This plugin was based on the following Stack Overflow answer
// https://stackoverflow.com/a/79671988/5709936

export function addFontPreload(): Plugin {
  const extractTags = (src: string): HtmlTagDescriptor[] => {
    const tags: HtmlTagDescriptor[] = [];
    const reg =
      /src:url\(['"]?(.+?\/material-symbols-.+?\.woff2)['"]?\)\s+format\(\s*['"]woff2['"]\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = reg.exec(src))) {
      const href = match[1];
      tags.push({
        injectTo: "head-prepend",
        tag: "link",
        attrs: {
          rel: "preload",
          as: "font",
          type: "font/woff2",
          href: href,
          crossorigin: true,
        },
      });
    }
    return tags;
  };

  return {
    name: "vite-add-font-preload",
    transformIndexHtml: {
      order: "post",
      handler: (_, ctx) => {
        if (ctx.bundle == null) {
          return [];
        }
        const tags: HtmlTagDescriptor[] = [];
        for (const [k, v] of Object.entries(ctx.bundle)) {
          if (
            v.type === "asset" &&
            typeof v.source === "string" &&
            k.endsWith(".css")
          ) {
            tags.push(...extractTags(v.source));
          }
        }
        return tags;
      },
    },
  };
}
