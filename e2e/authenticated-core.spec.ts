import { test, expect } from "@playwright/test";

test("development E2E session enters the real authenticated Feed", async ({ page }) => {
  const response = await page.request.post("/api/e2e/session", {
    headers: { "x-e2e-secret": process.env.E2E_TEST_SECRET ?? "trillioner-e2e" },
    data: { email: `e2e-feed-${Date.now()}@example.com`, name: "E2E Feed Member" },
  });
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).success).toBe(true);

  await page.goto("/feed");
  await expect(page.getByText("What's on your mind?")).toBeVisible();
  await expect(page.getByPlaceholder("Share your thoughts, ideas, or updates...")).toBeVisible();
});
