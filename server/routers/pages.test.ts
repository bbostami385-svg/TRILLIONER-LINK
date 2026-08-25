import { beforeEach, describe, expect, it, vi } from "vitest";
import { pagesRouter } from "./pages";
import * as dbModule from "../db";

vi.mock("../db", () => ({ getDb: vi.fn() }));
const caller = () => pagesRouter.createCaller({ user: { id: 7 } } as any);

describe("Pages follower relationships", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates the owner relationship when a page is created", async () => {
    const db = {
      insert: vi.fn()
        .mockReturnValueOnce({ values: vi.fn().mockResolvedValue([{ insertId: 42 }]) })
        .mockReturnValueOnce({ values: vi.fn().mockResolvedValue({}) }),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 42, ownerId: 7, followers: 1 }]) })) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().createPage({ name: "Science Hub" })).resolves.toMatchObject({ id: 42, ownerId: 7, followers: 1 });
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("returns an idempotent result when the user already follows the page", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 3, followers: 10 }]) })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 99 }]) })) })) }),
      insert: vi.fn(), update: vi.fn(),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().followPage({ pageId: 3 })).resolves.toEqual({ success: false, alreadyFollowing: true });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("creates a relationship and increments the cached page count for a new follower", async () => {
    const db = {
      select: vi.fn()
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 3, followers: 10 }]) })) })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) }),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().followPage({ pageId: 3 })).resolves.toEqual({ success: true, alreadyFollowing: false });
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it("does not remove another user's relationship when unfollow is requested", async () => {
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) })), delete: vi.fn(), update: vi.fn() };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().unfollowPage({ pageId: 3 })).resolves.toEqual({ success: false, wasFollowing: false });
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("returns a boolean status for the authenticated user", async () => {
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 11 }]) })) })) })) };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().isFollowingPage({ pageId: 3 })).resolves.toEqual({ isFollowing: true });
  });
});
