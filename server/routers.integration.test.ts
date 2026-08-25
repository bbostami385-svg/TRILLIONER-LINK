import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getRequiredDb: vi.fn() };
});

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
