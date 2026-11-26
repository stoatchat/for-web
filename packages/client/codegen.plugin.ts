import MagicString from "magic-string";
import { readdirSync } from "node:fs";

const fileRegex = /\.tsx$/;
const codegenRegex = /\/\/ @codegen (.*)/g;

const DIRECTIVES = readdirSync("./components/ui/directives")
  .filter((x) => x !== "index.ts")
  .map((x) => x.substring(0, x.length - 3));

const directiveRegex = new RegExp("use:(" + DIRECTIVES.join("|") + ")");

export default function codegenPlugin() {
  return {
    name: "codegen",
    enforce: "pre" as const,
    transform(src: string, id: string) {
      if (!fileRegex.test(id)) return null;

      const s = new MagicString(src);
      let changed = false;

      for (const match of src.matchAll(codegenRegex)) {
        const rawArgs: string[] = match[1].split(" ");
        const type = rawArgs.shift();

        const args = rawArgs.reduce(
          (d, arg) => {
            const [key, value] = arg.split("=");
            return {
              ...d,
              [key]: value,
            };
          },
          { type },
        ) as {
          type: "directives";
          props?: string;
          include?: string;
        };

        if (args.type !== "directives") continue;

        // Generate directives forwarding
        const source = args.props ?? "props";
        const permitted: string[] = args.include?.split(",") ?? DIRECTIVES;
        const replacement = DIRECTIVES.filter((d) => permitted.includes(d))
          .map((d) => `use:${d}={${source}["use:${d}"]}`)
          .join("\n");

        s.overwrite(match.index, match.index + match[0].length, replacement);
        changed = true;
      }

      if (directiveRegex.test(s.toString())) {
        if (!id.endsWith("client/components/ui/index.tsx")) {
          s.prepend(
            `import { ${DIRECTIVES.join(", ")} } from "@revolt/ui/directives";\n`,
          );
          changed = true;
        }
      }

      if (!changed) return null;

      return {
        code: s.toString(),
        map: s.generateMap({
          hires: true,
          source: id.split("?")[0],
          includeContent: false,
        }),
      };
    },
  };
}
