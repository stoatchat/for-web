/* eslint-disable no-undef */

import { readdirSync } from "node:fs";

console.log(
  "var locale_keys = " +
    JSON.stringify([
      ...readdirSync("./node_modules/dayjs/locale")
        .filter((x) => x.endsWith(".js"))
        .map((x) => {
          let v = x.split(".");
          v.pop();
          return v.join(".");
        }),
    ]) +
    ";",
);
