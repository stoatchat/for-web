import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_FILE = resolve(__dirname, "../../.env.test");

function loadEnvFile() {
  if (!existsSync(ENV_FILE)) return;

  for (const line of readFileSync(ENV_FILE, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy packages/client/.env.test.example to packages/client/.env.test (or run node scripts/setup-e2e-account.mjs).`,
    );
  }
  return value;
}

export const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? "https://stoat.viniciusrangel.dev/app";

export const E2E_API_URL =
  process.env.E2E_API_URL ?? "https://stoat.viniciusrangel.dev/api";

export const e2eCredentials = () => ({
  email: required("E2E_EMAIL"),
  password: required("E2E_PASSWORD"),
});

export const e2eServer = () => ({
  serverId: required("E2E_SERVER_ID"),
  channelId: required("E2E_CHANNEL_ID"),
});

export const isProductionE2E = () =>
  !E2E_BASE_URL.includes("localhost") && !E2E_BASE_URL.includes("127.0.0.1");
