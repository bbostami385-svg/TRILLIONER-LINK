import { describe, expect, it, vi } from "vitest";
import { creatorAnalyticsRouter } from "./routers/creatorAnalytics";
import * as db from "./db";

vi.mock("./db");

describe("creator analytics snapshots", () => {
  it("returns only the authenticated creator's date-bounded snapshots", async () => {
    const snapshots = [{ creatorId: 7, snapshotDate: "2026-08-20", views: 42 }];
    const query = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(snapshots),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue({ select: vi.fn(() => query) } as any);

    const caller = creatorAnalyticsRouter.createCaller({ user: { id: 7 } } as any);
    const result = await caller.getSnapshots({ days: 30, category: "all", hashtag: "all" });

    expect(result).toEqual(snapshots);
    expect(query.where).toHaveBeenCalledTimes(1);
    expect(query.orderBy).toHaveBeenCalledTimes(1);
  });
});
