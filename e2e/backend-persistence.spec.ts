import { test, expect } from "@playwright/test";

const e2eSecret = process.env.E2E_TEST_SECRET ?? "trillioner-e2e";
const email = `e2e-${Date.now()}@example.com`;

test("real authenticated user can pass verification gate and persist a Feed post", async ({ page }) => {
  const bootstrap = await page.request.post("/api/e2e/session", {
    headers: { "x-e2e-secret": e2eSecret },
    data: { email, name: "E2E Persistence Member" },
  });
  expect(bootstrap.ok()).toBeTruthy();
  expect((await bootstrap.json()).success).toBe(true);

  await page.goto("/feed");
  await expect(page.getByText("What's on your mind?")).toBeVisible();

  const content = `Real persistence E2E post ${Date.now()}`;
  const composer = page.getByPlaceholder("Share your thoughts, ideas, or updates...");
  await composer.fill(content);
  const createPostResponse = page.waitForResponse((response) => response.url().includes("feed.createPost") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Post" }).click({ force: true });
  expect((await createPostResponse).ok()).toBeTruthy();
  await expect(page.getByText(content)).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText(content)).toBeVisible();
});
