import { describe, expect, it, vi } from "vitest";
import { adsRouter } from "./ads";
import * as db from "../db";

vi.mock("../db", () => ({ getDb: vi.fn() }));

const selectChain = (value: unknown) => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(value) });

function database(options: { ad?: unknown } = {}) {
  return {
    select: vi.fn(() => selectChain(options.ad === undefined ? [] : [options.ad])),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: 7 }]) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
  };
}

const caller = () => adsRouter.createCaller({ user: { id: 4, role: "user" } } as any);

describe("ads router hardening", () => {
  it("rejects malformed budgets before touching the database", async () => {
    const databaseStub = database();
    vi.mocked(db.getDb).mockResolvedValue(databaseStub as never);
    await expect(caller().createSponsoredPost({ postId: 3, budget: "free", startDate: new Date() })).rejects.toThrow();
    expect(databaseStub.select).not.toHaveBeenCalled();
  });

  it("increments impressions only for active campaigns", async () => {
    const databaseStub = database({ ad: { id: 8, status: "active" } });
    vi.mocked(db.getDb).mockResolvedValue(databaseStub as never);
    await expect(caller().trackImpression({ adId: 8 })).resolves.toEqual({ success: true });
    expect(databaseStub.update).toHaveBeenCalledTimes(1);
    const update = databaseStub.update.mock.results[0]?.value;
    expect(update.set).toHaveBeenCalledTimes(1);
    expect(update.set.mock.calls[0][0]).toHaveProperty("impressions");
  });

  it("does not count clicks on paused campaigns", async () => {
    const databaseStub = database({ ad: { id: 8, status: "paused" } });
    vi.mocked(db.getDb).mockResolvedValue(databaseStub as never);
    await expect(caller().trackClick({ adId: 8 })).resolves.toEqual({ success: true });
    expect(databaseStub.update).not.toHaveBeenCalled();
  });
});
