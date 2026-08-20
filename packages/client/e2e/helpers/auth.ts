import type { Page } from "@playwright/test";

import { E2E_API_URL, e2eCredentials } from "./env";

export type Session = {
  _id: string;
  token: string;
  user_id: string;
};

/** Log in through the Stoat web UI. */
export async function loginViaUI(page: Page) {
  const { email, password } = e2eCredentials();

  await page.goto("/login/auth");
  await page.waitForSelector("input", { timeout: 30_000 });

  const inputs = page.locator("input:not([type='hidden'])");
  await inputs.nth(0).fill(email);
  await inputs.nth(1).fill(password);
  await page.getByRole("button", { name: "Login" }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 60_000,
  });
}

/** Create a session via the production API (used by setup scripts). */
export async function loginViaAPI(): Promise<Session> {
  const { email, password } = e2eCredentials();

  const response = await fetch(`${E2E_API_URL}/auth/session/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      friendly_name: "Stoat E2E (Playwright)",
    }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${await response.text()}`);
  }

  const session = (await response.json()) as Session & { result?: string };
  if (session.result !== "Success") {
    throw new Error(`Login did not succeed: ${JSON.stringify(session)}`);
  }

  return session;
}

/** Seed IndexedDB auth state before the app hydrates (faster than UI login). */
export async function seedAuthSession(page: Page, session: Session) {
  await page.addInitScript(
    async ({ authSession }) => {
      const auth = {
        session: {
          _id: authSession._id,
          token: authSession.token,
          userId: authSession.user_id,
          valid: true,
        },
      };

      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("localforage");
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("keyvaluepairs")) {
            db.createObjectStore("keyvaluepairs");
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction("keyvaluepairs", "readwrite");
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.objectStore("keyvaluepairs").put(JSON.stringify(auth), "auth");
        };
      });
    },
    { authSession: session },
  );
}

/** Bootstrap auth with API login + IndexedDB seed, then open the app shell. */
export async function bootstrapSession(page: Page) {
  const session = await loginViaAPI();
  await seedAuthSession(page, session);
  await page.goto("/");
  await page.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 60_000,
  });
}
