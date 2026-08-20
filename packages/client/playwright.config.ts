import { defineConfig, devices } from "@playwright/test";

import { E2E_BASE_URL, isProductionE2E } from "./e2e/helpers/env";

const production = isProductionE2E();

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Local (default): starts dev server via mise, hits http://localhost:4173
 * Production: set E2E_BASE_URL in .env.test — no local webServer
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: !production,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: production ? 1 : process.env.CI ? 1 : undefined,
  reporter: "html",
  timeout: 60_000,
  use: {
    baseURL: production ? E2E_BASE_URL : "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: production
    ? [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }]
    : [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "firefox", use: { ...devices["Desktop Firefox"] } },
      ],
  ...(production
    ? {}
    : {
        webServer: {
          command: "mise start",
          url: "http://localhost:4173",
          timeout: 300_000,
          reuseExistingServer: !process.env.CI,
        },
      }),
});
