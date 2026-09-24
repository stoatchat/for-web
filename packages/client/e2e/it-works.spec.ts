import { expect, test } from "@playwright/test";

test("shows a working login page", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(/Stoat/);

  const form = page.locator("form");
  await expect(form.locator('mdui-text-field[name="email"]')).toBeVisible();
  await expect(form.locator('mdui-text-field[name="password"]')).toBeVisible();
  await expect(form.locator('button[type="submit"]')).toBeVisible();

  await page.locator('a[href$="/login/create"]').first().click();

  await expect(page).toHaveURL(/\/login\/create$/);
  await expect(
    page.locator('mdui-text-field[name="new-password"]'),
  ).toBeVisible();
});
