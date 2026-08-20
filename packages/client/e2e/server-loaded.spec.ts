import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loginViaUI } from "./helpers/auth";
import { e2eServer, isProductionE2E } from "./helpers/env";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = resolve(__dirname, "../test-results/screenshots");

test.describe("production server view", () => {
  test.skip(
    !isProductionE2E(),
    "Set E2E_BASE_URL to a live instance (see .env.test.example)",
  );

  test("logs in and captures server channel view", async ({ page }) => {
    test.setTimeout(120_000);

    const { serverId, channelId } = e2eServer();

    await loginViaUI(page);

    await page.goto(`/server/${serverId}/channel/${channelId}`);

    const releaseNotes = page.getByRole("button", { name: "Close" });
    if (await releaseNotes.isVisible().catch(() => false)) {
      await releaseNotes.click();
    }

    await expect(page.getByText("This is the start of your conversation")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("E2E Test Server").first()).toBeVisible();

    mkdirSync(SCREENSHOT_DIR, { recursive: true });
    const screenshotPath = resolve(
      SCREENSHOT_DIR,
      "server-channel-loaded.png",
    );

    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });

    test.info().attach("server-channel-loaded", {
      path: screenshotPath,
      contentType: "image/png",
    });
  });
});
