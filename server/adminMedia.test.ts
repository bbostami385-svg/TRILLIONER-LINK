import { describe, expect, it } from "vitest";
import { adminMediaRouter } from "./routers/adminMedia";

describe("admin media dashboard", () => {
  it("rejects non-admin users before reading upload data", async () => {
    const caller = adminMediaRouter.createCaller({ user: { id: 1, role: "user" } } as any);
    await expect(caller.uploadSummary()).rejects.toThrow();
  });

  it("rejects anonymous callers", async () => {
    const caller = adminMediaRouter.createCaller({ user: null } as any);
    await expect(caller.uploadSummary()).rejects.toThrow();
  });
});
