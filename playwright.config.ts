import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 20_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173",
    headless: true,
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "NODE_ENV=development PORT=4173 ENABLE_E2E_AUTH_BOOTSTRAP=1 E2E_TEST_SECRET=trillioner-e2e pnpm dev",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
