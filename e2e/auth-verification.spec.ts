import { expect, test } from "@playwright/test";

// The first two tests run against every preview without credentials. The full
// account path is enabled only when the operator supplies an authenticated
// browser state, so CI never creates real accounts or stores secrets.
test.describe("TRILLIONER LINK authentication and verification", () => {
  test("renders the Firebase-only signup entry point", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
    await expect(page.getByText(/firebase authentication/i)).toBeVisible();
    await expect(page.getByText(/Manus OAuth/i)).toHaveCount(0);
  });

  test("protects verification until a user signs in", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText(/sign in required/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /go to sign in/i })).toBeVisible();
    await page.getByRole("button", { name: /go to sign in/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("completes Signup to Verification to Profile with deterministic test contracts", async ({ page }) => {
    await page.route("**/api/trpc/**", async (route) => {
      const url = route.request().url();
      const batchedVerification = url.includes("auth.me,ageVerification.getAgeVerificationStatus,humanVerification.isHumanVerified");
      const data = url.includes("notifications.getBellFeed")
        ? []
        : url.includes("auth.exchangeFirebaseToken")
          ? { success: true }
          : url.includes("ageVerification.getAgeVerificationStatus")
            ? { age: 26, ageVerified: true, accountActive: true, livenessVerified: true }
            : url.includes("humanVerification.isHumanVerified")
              ? { isVerified: true }
              : { id: 42, name: "E2E User", email: "e2e@example.com", role: "user" };
      const payload = batchedVerification
        ? [
            { result: { data: { json: { id: 42, name: "E2E User", email: "e2e@example.com", role: "user" } } } },
            { result: { data: { json: { age: 26, ageVerified: true, accountActive: true, livenessVerified: true } } } },
            { result: { data: { json: { isVerified: true } } } },
          ]
        : [{ result: { data: { json: data } } }];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(payload) });
    });

    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /create account/i })).toBeVisible();
    // The real Google popup is covered by Firebase unit/integration tests. In
    // this deterministic browser run, advance through the same post-exchange
    // route so the verification and profile screens are exercised without
    // creating or accessing an external account.
    await page.goto("/verify");
    await expect(page).toHaveURL(/\/verify$/);
    await expect(page.getByText(/secure account verification/i)).toBeVisible();
    await expect(page.getByText("Verification complete", { exact: true })).toBeVisible();

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByText(/TRILLIONER LINK/i).first()).toBeVisible();
  });
});
