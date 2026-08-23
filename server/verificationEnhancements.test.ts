import { describe, expect, it } from "vitest";
import { humanVerificationRouter } from "./routers/humanVerification";
import { kycRouter } from "./routers/kyc";
import { stateFor } from "../client/src/components/VerificationStatusTracker";

const adminContext = { user: { id: 99, role: "admin" } } as any;

describe("verification enhancement contracts", () => {
  it("requires a reason for bulk liveness rejection", async () => {
    const caller = humanVerificationRouter.createCaller(adminContext);
    await expect(caller.bulkReviewLiveness({ recordIds: [1], action: "reject" })).rejects.toThrow();
  });

  it("requires a reason for bulk KYC rejection", async () => {
    const caller = kycRouter.createCaller(adminContext);
    await expect(caller.bulkReviewKYC({ documentIds: [1], action: "reject" })).rejects.toThrow();
  });

  it("rejects empty bulk selections before touching the database", async () => {
    const humanCaller = humanVerificationRouter.createCaller(adminContext);
    const kycCaller = kycRouter.createCaller(adminContext);
    await expect(humanCaller.bulkReviewLiveness({ recordIds: [], action: "approve" })).rejects.toThrow();
    await expect(kycCaller.bulkReviewKYC({ documentIds: [], action: "approve" })).rejects.toThrow();
  });

  it("maps verification states consistently for the dashboard tracker", () => {
    expect(stateFor("approved")).toBe("complete");
    expect(stateFor("pending")).toBe("pending");
    expect(stateFor("rejected")).toBe("needs_action");
    expect(stateFor(null)).toBe("not_started");
    expect(stateFor("pending", true)).toBe("complete");
  });
});
