import { expect, test } from "@playwright/test";

test("shows a working login page", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(/Stoat/);

  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log in", exact: true }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Join Stoat" })).toBeVisible();
});
