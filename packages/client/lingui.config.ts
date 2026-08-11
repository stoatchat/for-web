import { LinguiConfig } from "@lingui/conf";
import { formatter } from "@lingui/format-po";
import { defineConfig } from "@lingui/solid/config";

import { Languages } from "./components/i18n/Languages";

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
    Trans: ["@lingui/solid", "Trans"],
    useLingui: ["@lingui/solid", "useLingui"],
  },
  format: formatter({
    origins: true,
    lineNumbers: false,
  }),
} as LinguiConfig);
