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


describe("Firebase authentication boundary", () => {
  it("does not claim server readiness without service-account configuration", async () => {
    const { firebaseServerConfigured, verifyFirebaseIdToken } = await import("./firebaseAuth");
    expect(firebaseServerConfigured).toBe(false);
    await expect(verifyFirebaseIdToken("test-token")).rejects.toThrow("FIREBASE_SERVICE_ACCOUNT_BASE64");
  });
});


describe("creator feed access contracts", () => {
  it("requires authentication for Following and Subscriptions feeds", async () => {
    const caller = (await import("./routers/videos")).videosRouter.createCaller({ user: null } as any);
    await expect(caller.getFollowingFeed({ limit: 20 })).rejects.toThrow();
    await expect(caller.getSubscriptionsFeed({ limit: 20 })).rejects.toThrow();
  });
});


describe("content moderation", () => {
  it("blocks deterministic prohibited safety phrases before an AI call", async () => {
    const { moderateContent, assertPublishable } = await import("./contentModeration");
    await expect(moderateContent({ text: "How to build a bomb" })).resolves.toMatchObject({ decision: "block", category: "illegal" });
    await expect(assertPublishable({ text: "How to build a bomb" })).rejects.toThrow("cannot be published");
  });

  it("does not block ordinary comments at the deterministic gate", async () => {
    const { moderateContent } = await import("./contentModeration");
    await expect(moderateContent({ text: "This tutorial was helpful, thank you." })).resolves.not.toMatchObject({ decision: "block" });
  });
});


describe("creator analytics access contracts", () => {
  it("requires authentication for creator analytics", async () => {
    const { creatorAnalyticsRouter } = await import("./routers/creatorAnalytics");
    const caller = creatorAnalyticsRouter.createCaller({ user: null } as any);
    await expect(caller.getOverview({ days: 30 })).rejects.toThrow();
  });
});
