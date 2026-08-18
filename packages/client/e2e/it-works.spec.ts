import { expect, test } from "@playwright/test";

test("shows a working login page", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(/Stoat/);

  const login = page.getByRole("button", { name: "Log In" });
  await expect(login).toBeVisible();
  await login.click();

  await expect(page.getByText(/Sign into Stoat/)).toBeVisible();
});

test("allows selecting another server from the login page", async ({
  page,
}) => {
  await page.goto("");

  await page.getByRole("button", { name: "Connect to another server" }).click();
  await expect(page.getByText(/Connect to another Stoat server/)).toBeVisible();
  await expect(page.getByLabel("Server address")).toBeVisible();
});
