import { beforeEach, describe, expect, it, vi } from "vitest";
import { humanVerificationRouter } from "./humanVerification";
import * as dbModule from "../db";

vi.mock("../db", () => ({ getRequiredDb: vi.fn() }));
vi.mock("../verificationMedia", () => ({ persistVerificationMedia: vi.fn(async (value: string) => `https://storage.test/${encodeURIComponent(value)}`) }));

const caller = () => humanVerificationRouter.createCaller({ user: { id: 17, role: "user" } } as any);
const chain = (value: unknown) => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(value) })) })) });
const step = (challengeType: "nod" | "turn_left" | "turn_right" | "blink") => ({ challengeType, videoUrl: "https://camera.test/step.webm" });

function validDb(challenges: string[] = ["nod", "blink"]) {
  const tx = {
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
  };
  return {
    select: vi.fn()
      .mockReturnValueOnce(chain([{ livenessVerified: false, livenessAttempts: 0 }]))
      .mockReturnValueOnce(chain([{ id: 8, userId: 17, challenges, status: "active", expiresAt: new Date(Date.now() + 60_000) }])),
    transaction: vi.fn(async (callback: (value: typeof tx) => Promise<void>) => callback(tx)),
    tx,
  };
}

describe("verifyLiveness", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects incomplete or incorrectly ordered movement steps before persisting media", async () => {
    const db = validDb(["nod", "blink"]);
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(caller().verifyLiveness({ challengeId: 8, steps: [step("blink"), step("nod")] })).rejects.toThrow("requested order");
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("expires an expired challenge and asks the user to start again", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce(chain([{ livenessVerified: false, livenessAttempts: 0 }]))
        .mockReturnValueOnce(chain([{ id: 8, userId: 17, challenges: ["nod"], status: "active", expiresAt: new Date(Date.now() - 1_000) }])),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(caller().verifyLiveness({ challengeId: 8, steps: [step("nod")] })).rejects.toThrow("expired");
    expect(db.update).toHaveBeenCalled();
  });

  it("persists every ordered step and leaves the result pending review", async () => {
    const db = validDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(caller().verifyLiveness({ challengeId: 8, steps: [step("nod"), step("blink")] })).resolves.toMatchObject({ success: false, status: "pending", challengeId: 8 });
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(db.tx.insert).toHaveBeenCalled();
    expect(db.tx.update).toHaveBeenCalledTimes(2);
  });
});
