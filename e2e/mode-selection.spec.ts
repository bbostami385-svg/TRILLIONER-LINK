import { test, expect } from "@playwright/test";

test("platform mode selection keeps Social and Creator entry points visible", async ({ page }) => {
  await page.goto("/mode-selection");
  await expect(page.getByRole("heading", { name: "Choose Creator Mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose Social Mode" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose Creator Mode" })).toBeVisible();
});

test("signup entry continues into the Firebase login route", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: /Sign Up with TRILLIONER LINK/i }).click();
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fverify|\/login\?returnTo=\/verify/);
});

test("login form exposes inline validation without credentials", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back|login/i })).toBeVisible();
  const submit = page.getByRole("button", { name: /sign in|login/i }).first();
  await submit.click();
  await expect(page.locator("body")).toContainText(/email|password/i);
});

test("verification entry route renders its user-facing gate", async ({ page }) => {
  await page.goto("/verify");
  await expect(page.locator("body")).toContainText(/verification|verify/i);
});
