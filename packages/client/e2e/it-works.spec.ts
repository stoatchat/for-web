import { expect, test } from "@playwright/test";

test("shows a working login page", async ({ page }) => {
  await page.goto("");
  await expect(page).toHaveTitle(/Stoat/);

  const login = page.getByRole("button", { name: "Log In" });
  await expect(login).toBeVisible();
  await login.click();

  await expect(page.getByText(/Sign into Stoat/)).toBeVisible();
});
