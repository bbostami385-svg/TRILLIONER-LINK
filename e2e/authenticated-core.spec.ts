import { test, expect } from "@playwright/test";

const user = {
  id: 17,
  openId: "firebase:e2e-user",
  name: "E2E Creator",
  email: "e2e@example.com",
  role: "user",
};

function trpcResult(data: unknown) {
  return { status: 200, contentType: "application/json", body: JSON.stringify([{ result: { data: { json: data } } }]) };
}

test("authenticated user can enter Feed and submit a post", async ({ page }) => {
  await page.route("**/api/trpc/auth.me*", (route) => route.fulfill(trpcResult(user)));
  await page.route("**/api/trpc/feed.getFeed*", (route) => route.fulfill(trpcResult({ posts: [], total: 0 })));
  await page.route("**/api/trpc/collections.getUserCollections*", (route) => route.fulfill(trpcResult([])));
  await page.route("**/api/trpc/feed.createPost*", (route) => route.fulfill(trpcResult({ success: true, postId: 901 })));

  await page.goto("/feed");
  await expect(page.getByText("What's on your mind?")).toBeVisible();

  const composer = page.getByPlaceholder("Share your thoughts, ideas, or updates...");
  await composer.fill("A verified E2E post from TRILLIONER LINK");
  await page.getByRole("button", { name: "Post" }).click();
  await expect(composer).toHaveValue("");
});
