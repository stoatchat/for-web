import extractor from "@lingui-solid/babel-plugin-extract-messages/extractor";
import { defineConfig } from "@lingui/cli";
import { LinguiConfig } from "@lingui/conf";

import { Languages } from "./components/i18n/Languages";

/* eslint-disable */
const supressWarningIfWereNotInLinguiExtract = !(
  process as any
)?.argv[1]?.includes("lingui-extract.js");
/* eslint-enable */

export default defineConfig({
  sourceLocale: "en",
  locales: Object.values(Languages).map(({ i18n }) => i18n),
  catalogs: [
    {
      path: "<rootDir>/components/i18n/catalogs/{locale}/messages",
      include: ["src", "components"],
      exclude: ["**/node_modules/**", "**/i18n/locales/**"],
    },
  ],
  runtimeConfigModule: {
    Trans: ["@lingui-solid/solid", "Trans"],
    useLingui: ["@lingui-solid/solid", "useLingui"],
    extractors: [extractor],
  },
  formatOptions: {
    origins: true,
    lineNumbers: false,
  },
  ...(supressWarningIfWereNotInLinguiExtract
    ? {}
    : {
        macro: {
          corePackage: ["@lingui-solid/solid"],
          jsxPackage: ["@lingui-solid/solid/macro"],
        },
      }),
} as LinguiConfig);
