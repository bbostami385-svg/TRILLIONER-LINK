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


describe("analytics and moderation feedback helpers", () => {
  it("defaults analytics theme to dark and honors a persisted light preference", async () => {
    const { getAnalyticsTheme } = await import("../client/src/pages/CreatorDashboard");
    expect(getAnalyticsTheme({ getItem: () => null })).toBe("dark");
    expect(getAnalyticsTheme({ getItem: () => "light" })).toBe("light");
  });

  it("serializes engagement data as escaped CSV", async () => {
    const { buildAnalyticsCsv } = await import("../client/src/pages/CreatorDashboard");
    const csv = buildAnalyticsCsv({ subscribers: 3, views: 10, likes: 2, comments: 1, shares: 0, engagementRate: 30, recentVideos: [{ title: "A, \"great\" video", views: 10, likes: 2, comments: 1, createdAt: "2026-08-23T00:00:00.000Z" }] }, 30);
    expect(csv).toContain('"A, ""great"" video"');
    expect(csv.split("\n")[0]).toBe('"Metric","Value","Window"');
  });

  it("classifies moderation rejection errors for user-facing toasts", async () => {
    const { getModerationToastMessage } = await import("../client/src/lib/moderationFeedback");
    expect(getModerationToastMessage(new Error("This content cannot be published"))).toContain("blocked");
    expect(getModerationToastMessage(new Error("A network error"))).toBeNull();
  });
});


describe("managed branding configuration", () => {
  it("uses the TRILLIONER LINK application title", () => {
    expect(process.env.VITE_APP_TITLE ?? "TRILLIONER LINK").toBe("TRILLIONER LINK");
  });
});


describe("appeals and custom analytics ranges", () => {
  it("requires a meaningful appeal reason and bounded content", async () => {
    const { moderationAppealInput } = await import("./routers/moderationAppeals");
    expect(() => moderationAppealInput.parse({ contentType: "post", content: "blocked text", appealReason: "too short" })).toThrow();
    expect(moderationAppealInput.parse({ contentType: "post", content: "blocked text", appealReason: "This content is safe and should be reviewed." }).contentType).toBe("post");
  });

  it("rejects incomplete or reversed custom analytics ranges", async () => {
    const { analyticsRangeSchema } = await import("./routers/creatorAnalytics");
    expect(() => analyticsRangeSchema.parse({ startDate: "2026-08-20", days: 30 })).toThrow();
    expect(() => analyticsRangeSchema.parse({ startDate: "2026-08-21", endDate: "2026-08-20", days: 30 })).toThrow();
    expect(analyticsRangeSchema.parse({ startDate: "2026-08-01", endDate: "2026-08-20", days: 30 }).endDate).toBe("2026-08-20");
  });
});


describe("realtime notifications, appeal filters, and comparison", () => {
  it("calculates comparison deltas safely when the previous period is empty", async () => {
    const { compareMetric } = await import("./routers/creatorAnalytics");
    expect(compareMetric(12, 8)).toEqual({ current: 12, previous: 8, delta: 4, percent: 50 });
    expect(compareMetric(4, 0).percent).toBe(100);
    expect(compareMetric(0, 0).percent).toBe(0);
  });

  it("validates appeal status and sorting filters", async () => {
    const { moderationAppealAdminFilterSchema } = await import("./routers/moderationAppeals");
    expect(moderationAppealAdminFilterSchema.parse({ status: "pending", sort: "oldest" }).sort).toBe("oldest");
    expect(() => moderationAppealAdminFilterSchema.parse({ status: "unknown" })).toThrow();
  });

  it("requires authentication for the notification bell feed and read actions", async () => {
    const { notificationsRouter } = await import("./routers/notifications");
    const caller = notificationsRouter.createCaller({ user: null } as any);
    await expect(caller.getBellFeed({ limit: 8 })).rejects.toThrow();
    await expect(caller.markAllAsRead()).rejects.toThrow();
  });
});


describe("unique handle contracts", () => {
  it("normalizes handles and rejects reserved or malformed values", async () => {
    const { normalizeHandle, validateHandle } = await import("./handleUtils");
    expect(normalizeHandle("@@Creator_Name")).toBe("creator_name");
    expect(validateHandle("ab").valid).toBe(false);
    expect(validateHandle("admin").message).toContain("reserved");
    expect(validateHandle("Nova.Creator-1").valid).toBe(true);
  });

  it("requires authentication for handle claiming and availability checks", async () => {
    const { profileEditRouter } = await import("./routers/profileEdit");
    const caller = profileEditRouter.createCaller({ user: null } as any);
    await expect(caller.checkHandleAvailability({ handle: "creator-name" })).rejects.toThrow();
    await expect(caller.claimHandle({ handle: "creator-name" })).rejects.toThrow();
  });

  it("supports safe public lookup validation for @handles", async () => {
    const { profileEditRouter } = await import("./routers/profileEdit");
    const caller = profileEditRouter.createCaller({ user: null } as any);
    await expect(caller.getByHandle({ handle: "admin" })).resolves.toBeNull();
  });
});
