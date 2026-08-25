import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getRequiredDb: vi.fn(), upsertUser: vi.fn() };
});

vi.mock("./firebaseAuth", () => ({
  firebaseServerConfigured: true,
  verifyFirebaseIdToken: vi.fn().mockResolvedValue({
    uid: "google-user-123",
    name: "Google Creator",
    email: "creator@example.com",
    firebase: { sign_in_provider: "google.com" },
  }),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { signSession: vi.fn().mockResolvedValue("firebase-session-token") },
}));

describe("root router composition", () => {
  it("exposes the core social, creator, marketplace, and verification namespaces", () => {
    const record = (appRouter as any)._def.record;
    expect(record).toEqual(expect.objectContaining({
      marketplace: expect.any(Object),
      creatorAnalytics: expect.any(Object),
      humanVerification: expect.any(Object),
      dualMode: expect.any(Object),
      levels: expect.any(Object),
      pages: expect.any(Object),
      videos: expect.any(Object),
      comments: expect.any(Object),
    }));
  });

  it("keeps monetization gated until both human verification and KYC are approved", async () => {
    const databaseStub = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ livenessVerified: false, kycVerified: false }]) })),
        })),
      })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    const caller = appRouter.createCaller({ user: { id: 42 } } as any);

    await expect(caller.humanVerification.isHumanVerified()).resolves.toMatchObject({ isVerified: false });
    await expect(caller.kyc.canAccessMonetization()).resolves.toMatchObject({ canAccess: false, kycVerified: false, livenessVerified: false });
  });
});


  it("exposes every production feature namespace through the canonical app router", () => {
    const record = (appRouter as any)._def.record as Record<string, unknown>;
    const expectedNamespaces = [
      "system", "auth", "feed", "messages", "users", "videos", "stories", "comments", "search", "notifications", "payment", "marketplace", "liveStream", "moderation", "recommendations", "profileEdit", "groups", "events", "reels", "polls", "reactions", "collections", "verification", "mentions", "duets", "challenges", "ads", "arFilters", "sounds", "history", "pages", "dualMode", "levels", "ageVerification", "humanVerification", "kyc", "socialLinking", "creatorAnalytics", "moderationAppeals", "invitations", "profileRewards", "creatorPlaylists", "subscriptionCollections", "adminMedia",
    ];
    expect(Object.keys(record)).toEqual(expect.arrayContaining(expectedNamespaces));
    expect(Object.keys(record)).toHaveLength(expectedNamespaces.length);
  });


describe("Firebase authentication integration contract", () => {
  it("verifies a Google token, upserts the shared user, and sets a signed session cookie", async () => {
    const { upsertUser } = await import("./db");
    const { sdk } = await import("./_core/sdk");
    const { verifyFirebaseIdToken } = await import("./firebaseAuth");
    const cookie = vi.fn();
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: {}, protocol: "https" },
      res: { cookie },
    } as any);

    await expect(caller.auth.exchangeFirebaseToken({ idToken: "google-id-token" })).resolves.toEqual({ success: true });
    expect(verifyFirebaseIdToken).toHaveBeenCalledWith("google-id-token");
    expect(upsertUser).toHaveBeenCalledWith(expect.objectContaining({
      openId: "firebase:google-user-123",
      name: "Google Creator",
      email: "creator@example.com",
      loginMethod: "google.com",
    }));
    expect(sdk.signSession).toHaveBeenCalledWith({ openId: "firebase:google-user-123", appId: "firebase", name: "Google Creator" });
    expect(cookie).toHaveBeenCalledWith(expect.any(String), "firebase-session-token", expect.objectContaining({ maxAge: expect.any(Number) }));
  });

  it("rejects an empty Firebase ID token before invoking the provider", async () => {
    const caller = appRouter.createCaller({ user: null, req: { headers: {} }, res: { cookie: vi.fn() } } as any);
    await expect(caller.auth.exchangeFirebaseToken({ idToken: "" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("human verification integration contract", () => {
  it("returns the authenticated liveness status and latest review state", async () => {
    const databaseStub = {
      select: vi.fn()
        .mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ livenessVerified: false, livenessVerificationAt: null, livenessAttempts: 2 }]) })),
          })),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ status: "rejected", confidence: null }]) })),
            })),
          })),
        })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    const caller = appRouter.createCaller({ user: { id: 42 } } as any);

    await expect(caller.humanVerification.getLivenessStatus()).resolves.toMatchObject({
      isVerified: false,
      attempts: 2,
      lastAttemptStatus: "rejected",
    });
  });
});


describe("verification metrics integration contract", () => {
  it("summarizes persisted liveness and KYC review states for admins", async () => {
    const databaseStub = {
      select: vi.fn()
        .mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            groupBy: vi.fn().mockResolvedValue([{ status: "pending", total: 3 }, { status: "approved", total: 5 }, { status: "rejected", total: 2 }]),
          })),
        }))
        .mockImplementationOnce(() => ({
          from: vi.fn(() => ({
            groupBy: vi.fn().mockResolvedValue([{ status: "pending", total: 4 }, { status: "approved", total: 6 }]),
          })),
        })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    const caller = appRouter.createCaller({ user: { id: 7, role: "admin" } } as any);

    await expect(caller.humanVerification.getVerificationMetrics()).resolves.toMatchObject({
      liveness: { total: 10, pending: 3, approved: 5, rejected: 2 },
      kyc: { total: 10, pending: 4, approved: 6, rejected: 0 },
    });
  });
});


describe("age and KYC verification integration contract", () => {
  it("returns the authenticated age status and account activation state", async () => {
    const databaseStub = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{
            id: 42, age: 26, dateOfBirth: new Date("2000-01-01"), ageVerified: true,
            ageVerificationAt: new Date(), faceVerificationRequired: false, faceVerified: false,
            faceVerificationStatus: "not_required", livenessVerified: true,
          }]) })),
        })),
      })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    const caller = appRouter.createCaller({ user: { id: 42 } } as any);
    await expect(caller.ageVerification.getAgeVerificationStatus()).resolves.toMatchObject({ age: 26, ageVerified: true, accountActive: true, livenessVerified: true });
  });

  it("returns KYC status with the latest user-scoped document", async () => {
    const databaseStub = {
      select: vi.fn()
        .mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ kycVerified: true, kycStatus: "approved", kycDocumentType: "passport", kycVerificationAt: new Date() }]) })) })) }))
        .mockImplementationOnce(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 9, status: "approved", userId: 42 }]) })) })) })) })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    const caller = appRouter.createCaller({ user: { id: 42 } } as any);
    await expect(caller.kyc.getKYCStatus()).resolves.toMatchObject({ isVerified: true, status: "approved", documentType: "passport", lastDocument: { id: 9, userId: 42 } });
  });
});
