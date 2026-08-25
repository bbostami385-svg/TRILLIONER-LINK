import { describe, expect, it, vi } from "vitest";
import { levelsRouter } from "./levels";
import * as db from "../db";

vi.mock("../db", () => ({ getRequiredDb: vi.fn() }));

const caller = () => levelsRouter.createCaller({ user: { id: 12, role: "user" } } as any);

function database(mode: "stats" | "leaderboard", record: unknown, users: unknown[] = []) {
  let selectCount = 0;
  return {
    select: vi.fn(() => {
      selectCount += 1;
      if (mode === "stats") {
        return {
          from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(record ? [record] : []) })) })),
        };
      }
      if (selectCount === 1) {
        return {
          from: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn(() => ({ offset: vi.fn().mockResolvedValue(users) })) })) })),
        };
      }
      return { from: vi.fn().mockResolvedValue(users) };
    }),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
  };
}

describe("levels router procedures", () => {
  it("returns authenticated level stats with the next threshold", async () => {
    const databaseStub = database("stats", { currentLevel: 4, totalFollowers: 700, levelUpCount: 3, lastLevelUpAt: null });
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().getLevelStats()).resolves.toMatchObject({
      currentLevel: 4,
      totalFollowers: 700,
      nextLevelThreshold: 1000,
    });
  });

  it("returns a bounded leaderboard page and total count", async () => {
    const users = [{ userId: 1, currentLevel: 8, totalFollowers: 100000 }];
    const databaseStub = database("leaderboard", null, users);
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().getLeaderboard({ limit: 10, offset: 20 })).resolves.toMatchObject({ users, total: 1, limit: 10, offset: 20 });
  });
});

function singleRecordDatabase(record: unknown) {
  return {
    select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(record ? [record] : []) })) })) })),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
  };
}

describe("levels router lifecycle procedures", () => {
  it("initializes a missing user level record on first read", async () => {
    const record = { userId: 12, currentLevel: 1, totalFollowers: 0, levelUpCount: 0 };
    let reads = 0;
    const databaseStub = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(reads++ === 0 ? [] : [record]) })) })) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().getUserLevel()).resolves.toEqual(record);
    expect(databaseStub.insert).toHaveBeenCalledTimes(1);
  });

  it("updates a user without a false level-up when the threshold is unchanged", async () => {
    const databaseStub = singleRecordDatabase({ currentLevel: 3, totalFollowers: 120, levelUpCount: 2, lastLevelUpAt: null });
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().updateUserLevel({ newFollowerCount: 130 })).resolves.toMatchObject({ leveledUp: false, newLevel: 3, previousLevel: 3, levelUpCount: 2 });
    expect(databaseStub.update).toHaveBeenCalledTimes(1);
  });

  it("increments level-up state when a follower threshold is crossed", async () => {
    const databaseStub = singleRecordDatabase({ currentLevel: 3, totalFollowers: 120, levelUpCount: 2, lastLevelUpAt: null });
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().updateUserLevel({ newFollowerCount: 500 })).resolves.toMatchObject({ leveledUp: true, newLevel: 4, previousLevel: 3, levelUpCount: 3 });
  });

  it("returns top users using the requested limit", async () => {
    const users = [{ userId: 2, currentLevel: 10, totalFollowers: 1_000_000 }];
    const databaseStub = { select: vi.fn(() => ({ from: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(users) })) })) })) };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().getTopUsersByLevel({ limit: 5 })).resolves.toEqual(users);
    expect(databaseStub.select).toHaveBeenCalledTimes(1);
  });
});

  it("writes a level-up notification when an existing user crosses a threshold", async () => {
    const values = vi.fn().mockResolvedValue({});
    const databaseStub = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ currentLevel: 3, totalFollowers: 120, levelUpCount: 2, lastLevelUpAt: null }]) })) })) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
      insert: vi.fn(() => ({ values })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().updateUserLevel({ newFollowerCount: 500 })).resolves.toMatchObject({ leveledUp: true, newLevel: 4, levelUpCount: 3 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 12, type: "level_up", isRead: false }));
  });

  it("notifies a user whose first persisted level is above Level 1", async () => {
    const values = vi.fn().mockResolvedValue({});
    const databaseStub = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) })),
      insert: vi.fn(() => ({ values })),
    };
    vi.mocked(db.getRequiredDb).mockResolvedValue(databaseStub as never);
    await expect(caller().updateUserLevel({ newFollowerCount: 50 })).resolves.toMatchObject({ leveledUp: true, newLevel: 2, previousLevel: 1 });
    expect(values).toHaveBeenCalledTimes(2);
    expect(values).toHaveBeenLastCalledWith(expect.objectContaining({ type: "level_up", message: "Congratulations! You reached Level 2." }));
  });
