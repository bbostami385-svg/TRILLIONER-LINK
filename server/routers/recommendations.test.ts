import { beforeEach, describe, expect, it, vi } from "vitest";
import { recommendationsRouter } from "./recommendations";
import * as db from "../db";

vi.mock("../db", async () => {
  const actual = await vi.importActual<typeof import("../db")>("../db");
  return {
    ...actual,
    getDb: vi.fn(),
    getFeedPosts: vi.fn(),
    getTrendingVideos: vi.fn(),
  };
});

describe("recommendation procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("ranks persisted posts by engagement and freshness without fabricated records", async () => {
    vi.mocked(db.getDb).mockResolvedValue({} as never);
    vi.mocked(db.getFeedPosts).mockResolvedValue([
      { id: 1, createdAt: new Date(), likes: 1, comments: 0, shares: 0 },
      { id: 2, createdAt: new Date(), likes: 100, comments: 20, shares: 10 },
    ] as never);
    const result = await recommendationsRouter.createCaller({ user: { id: 7 } } as any).getRecommendedPosts({ limit: 2, offset: 0 });
    expect(result.posts.map((post) => post.id)).toEqual([2, 1]);
    expect(db.getFeedPosts).toHaveBeenCalledWith(6, 0);
  });

  it("filters trending videos by category before applying the limit", async () => {
    vi.mocked(db.getDb).mockResolvedValue({} as never);
    vi.mocked(db.getTrendingVideos).mockResolvedValue([
      { id: 1, category: "science", createdAt: new Date(), views: 500, likes: 20, comments: 2 },
      { id: 2, category: "music", createdAt: new Date(), views: 900, likes: 30, comments: 4 },
    ] as never);
    const result = await recommendationsRouter.createCaller({ user: { id: 7 } } as any).getTrendingContent({ category: "science", timeframe: "24h", limit: 10 });
    expect(result.trending).toHaveLength(1);
    expect(result.trending[0]?.id).toBe(1);
  });

  it("aggregates hashtags from published trending videos", async () => {
    vi.mocked(db.getDb).mockResolvedValue({} as never);
    vi.mocked(db.getTrendingVideos).mockResolvedValue([
      { id: 1, hashtags: ["science", "#learn"] },
      { id: 2, hashtags: ["science"] },
    ] as never);
    const result = await recommendationsRouter.createCaller({ user: { id: 7 } } as any).getTrendingHashtags({ limit: 10, timeframe: "7d" });
    expect(result.hashtags[0]).toMatchObject({ tag: "#science", count: 2, trendingRank: 1 });
    expect(result.hashtags[1]).toMatchObject({ tag: "#learn", count: 1, trendingRank: 2 });
  });
});

  it("returns persisted videos from followed accounts", async () => {
    const followedVideos = [{ id: 9, userId: 3, title: "Science update", isPublic: true }];
    vi.mocked(db.getDb).mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(followedVideos) })) })),
          })),
        })),
      })),
    } as never);
    const result = await recommendationsRouter.createCaller({ user: { id: 7 } } as any).getFollowingRecommendations({ limit: 10 });
    expect(result).toEqual({ content: followedVideos, total: 1 });
  });

  it("falls back to trending videos when collaborative history is unavailable", async () => {
    const trending = [{ id: 11, title: "Popular video" }];
    vi.mocked(db.getTrendingVideos).mockResolvedValue(trending as never);
    vi.mocked(db.getDb).mockResolvedValue({
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })),
    } as never);
    const result = await recommendationsRouter.createCaller({ user: { id: 7 } } as any).getCollaborativeRecommendations({ limit: 5 });
    expect(result).toEqual({ content: trending, total: 5 });
    expect(db.getTrendingVideos).toHaveBeenCalledWith(5);
  });
