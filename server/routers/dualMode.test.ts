import { beforeEach, describe, expect, it, vi } from "vitest";
import { dualModeRouter } from "./dualMode";
import * as dbModule from "../db";

vi.mock("../db");

function createMockDb() {
  const where = vi.fn().mockResolvedValue({});
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  const values = vi.fn().mockResolvedValue({});
  const insert = vi.fn(() => ({ values }));
  const selectWhere = vi.fn().mockResolvedValue([]);
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));
  return { update, set, where, insert, values, select, selectFrom, selectWhere };
}

describe("Dual mode router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("initializes both mode preferences and selects the requested mode", async () => {
    const db = createMockDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);

    const result = await caller.initializeModePreferences({ selectedMode: "creator" });

    expect(result).toMatchObject({ success: true, mode: "creator" });
    expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ accountMode: "creator", modeSelected: true }));
    expect(db.values).toHaveBeenCalledTimes(2);
    expect(db.values).toHaveBeenCalledWith({ userId: 42, mode: "social" });
    expect(db.values).toHaveBeenCalledWith({ userId: 42, mode: "creator" });
  });

  it("switches mode while preserving the initialized preference records", async () => {
    const db = createMockDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);

    const result = await caller.switchMode({ newMode: "social" });

    expect(result).toMatchObject({ success: true, newMode: "social" });
    expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ accountMode: "social", modeSelected: true }));
    expect(db.values).toHaveBeenCalledTimes(2);
  });
});


describe("Dual mode read contracts and validation", () => {
  it("returns the current mode and its statistics", async () => {
    const user = { id: 42, accountMode: "creator", modeSelected: true };
    const statistics = { userId: 42, mode: "creator", subscribers: 8, totalViews: 1200 };
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([user]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([statistics]) }) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).getCurrentMode();
    expect(result).toMatchObject({ userId: 42, currentMode: "creator", modeSelected: true, statistics });
  });

  it("returns both social and creator statistics", async () => {
    const preferences = [{ mode: "social", followers: 3 }, { mode: "creator", subscribers: 9 }];
    const db = { select: vi.fn(() => ({ from: () => ({ where: () => Promise.resolve(preferences) }) })) };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).getModeStatistics();
    expect(result).toEqual({ social: preferences[0], creator: preferences[1] });
  });

  it("reads paginated followers and subscribers", async () => {
    const followerRows = [{ id: 7, name: "Follower" }];
    const subscriberRows = [{ id: 8, name: "Subscriber", tier: "free" }];
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => ({ offset: () => Promise.resolve(followerRows) }) }) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) })
        .mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => ({ offset: () => Promise.resolve(subscriberRows) }) }) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 2 }]) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);
    expect(await caller.getFollowers({ userId: 42, limit: 5, offset: 0 })).toMatchObject({ followers: followerRows, total: 1 });
    expect(await caller.getSubscribers({ creatorId: 42, limit: 5, offset: 0 })).toMatchObject({ subscribers: subscriberRows, total: 1 });
  });

  it("rejects self-follow and self-subscribe actions before touching the database", async () => {
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);
    await expect(caller.followUser({ targetUserId: 42 })).rejects.toThrow("You cannot follow yourself.");
    await expect(caller.subscribeToCreator({ creatorId: 42, tier: "free" })).rejects.toThrow("You cannot subscribe to yourself.");
  });

  it("returns the current subscription relationship and rejects missing follow targets", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);
    expect(await caller.isFollowing({ targetUserId: 7 })).toEqual({ isFollowing: false });
    await expect(caller.followUser({ targetUserId: 7 })).rejects.toThrow("User not found.");
  });
});


describe("Dual mode relationship lifecycle", () => {
  it("creates a follow and updates both users' social counters", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 7 }]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 2 }]) }) }),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).followUser({ targetUserId: 7 });
    expect(result.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("reports an existing subscription and lists subscriptions", async () => {
    const subscriptions = [{ id: 7, name: "Creator", tier: "premium" }];
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ tier: "premium" }]) }) }) })
        .mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => ({ offset: () => Promise.resolve(subscriptions) }) }) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = dualModeRouter.createCaller({ user: { id: 42 } } as any);
    expect(await caller.isSubscribed({ creatorId: 7 })).toEqual({ isSubscribed: true, tier: "premium" });
    expect(await caller.getSubscriptions({ userId: 42, limit: 5, offset: 0 })).toMatchObject({ subscriptions, total: 1 });
  });

  it("unsubscribes and returns false when no subscription remains", async () => {
    const db = {
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) }),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).unsubscribeFromCreator({ creatorId: 7 });
    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
  });
});


describe("Dual mode conflict validation", () => {
  it("rejects duplicate follows with a conflict error", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 7 }]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 1 }]) }) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(dualModeRouter.createCaller({ user: { id: 42 } } as any).followUser({ targetUserId: 7 })).rejects.toThrow("Already following this user.");
  });

  it("rejects duplicate subscriptions with a conflict error", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 7 }]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 1 }]) }) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(dualModeRouter.createCaller({ user: { id: 42 } } as any).subscribeToCreator({ creatorId: 7, tier: "free" })).rejects.toThrow("Already subscribed to this creator.");
  });
});


describe("Dual mode following lifecycle", () => {
  it("reads following users with pagination", async () => {
    const following = [{ id: 9, name: "Following" }];
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ innerJoin: () => ({ where: () => ({ limit: () => ({ offset: () => Promise.resolve(following) }) }) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) }),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    expect(await dualModeRouter.createCaller({ user: { id: 42 } } as any).getFollowing({ userId: 42, limit: 5, offset: 0 })).toMatchObject({ following, total: 1 });
  });

  it("unfollows a user and updates social counters", async () => {
    const db = {
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) }),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).unfollowUser({ targetUserId: 7 });
    expect(result.success).toBe(true);
    expect(db.delete).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledTimes(2);
  });
});


describe("Dual mode subscription creation", () => {
  it("creates a subscription, updates the creator count, and inserts a notification", async () => {
    const values = vi.fn().mockResolvedValue({});
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([{ id: 7 }]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([]) }) })
        .mockReturnValueOnce({ from: () => ({ where: () => Promise.resolve([{ id: 1 }]) }) }),
      insert: vi.fn(() => ({ values })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await dualModeRouter.createCaller({ user: { id: 42 } } as any).subscribeToCreator({ creatorId: 7, tier: "premium" });
    expect(result.success).toBe(true);
    expect(values).toHaveBeenCalledWith({ subscriberId: 42, creatorId: 7, subscriptionTier: "premium" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, fromUserId: 42, type: "subscribe" }));
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("rejects a subscription when the creator target does not exist", async () => {
    const db = { select: vi.fn(() => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) })) };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    await expect(dualModeRouter.createCaller({ user: { id: 42 } } as any).subscribeToCreator({ creatorId: 7, tier: "free" })).rejects.toThrow("Creator not found.");
  });
});
