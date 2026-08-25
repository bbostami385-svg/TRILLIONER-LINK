import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb, getFeedPosts, getTrendingVideos } from "../db";
import { users } from "../../drizzle/schema";
import { ne } from "drizzle-orm";

interface UserInteraction {
  userId: number;
  contentId: number;
  type: "like" | "comment" | "share" | "view";
  weight: number;
}

interface ContentVector {
  id: number;
  tags: string[];
  category: string;
  author: number;
  engagementScore: number;
}

// Deterministic, database-backed ranking: engagement is balanced with freshness so old viral content does not permanently dominate.
function calculateSimilarity(vector1: string[], vector2: string[]): number {
  const set1 = new Set(vector1);
  const set2 = new Set(vector2);
  const v1Array = Array.from(set1);
  const v2Array = Array.from(set2);
  const intersection = new Set(v1Array.filter((x) => set2.has(x)));
  const union = new Set([...v1Array, ...v2Array]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function freshness(createdAt: Date | string | null | undefined) {
  const ageHours = Math.max(0, (Date.now() - new Date(createdAt ?? Date.now()).getTime()) / 3_600_000);
  return Math.exp(-ageHours / (24 * 7));
}

function scoreContent(item: { createdAt?: Date | string | null; likes?: number; comments?: number; shares?: number; views?: number }) {
  const engagement = Math.log1p(Number(item.likes ?? 0) * 3 + Number(item.comments ?? 0) * 4 + Number(item.shares ?? 0) * 5 + Number(item.views ?? 0));
  return Number((engagement * 0.72 + freshness(item.createdAt) * 10 * 0.28).toFixed(6));
}

export const recommendationsRouter = router({
  // Get personalized feed recommendations
  getRecommendedPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const posts = await getFeedPosts(Math.min(input.limit * 3, 100), input.offset);
        const ranked = posts.map((post) => ({ ...post, score: scoreContent(post), reason: "Ranked by engagement and freshness" }))
          .sort((a, b) => b.score - a.score).slice(0, input.limit);
        return { posts: ranked, total: ranked.length };
      } catch (error) {
        console.error("Error getting recommendations:", error);
        throw new Error("Failed to get recommendations");
      }
    }),

  // Get recommended videos
  getRecommendedVideos: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const videos = await getTrendingVideos(Math.min(input.limit * 3, 100));
        const ranked = videos.map((video) => ({ ...video, score: scoreContent(video), reason: "Ranked by views, engagement, and freshness" }))
          .sort((a, b) => b.score - a.score).slice(input.offset, input.offset + input.limit);
        return { videos: ranked, total: videos.length };
      } catch (error) {
        console.error("Error getting video recommendations:", error);
        throw new Error("Failed to get video recommendations");
      }
    }),

  // Get suggested users to follow
  getSuggestedUsers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const usersResult = await db.select({ id: users.id, name: users.name, username: users.handle, avatar: users.profileImage, createdAt: users.createdAt })
          .from(users).where(ne(users.id, ctx.user.id)).orderBy(users.createdAt).limit(input.limit);
        const suggestions = usersResult.map((user, index) => ({ ...user, mutualFollowers: 0, score: Number((1 - index / Math.max(usersResult.length, 1)).toFixed(4)) }));
        return { users: suggestions, total: suggestions.length };
      } catch (error) {
        console.error("Error getting suggested users:", error);
        throw new Error("Failed to get suggested users");
      }
    }),

  // Get trending content
  getTrendingContent: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const videos = await getTrendingVideos(Math.min(input.limit * 5, 100));
        const filtered = input.category ? videos.filter((video) => video.category === input.category) : videos;
        const trending = filtered.map((video) => ({ ...video, engagementScore: scoreContent(video), viewCount: video.views }))
          .sort((a, b) => b.engagementScore - a.engagementScore).slice(0, input.limit)
          .map((video, index) => ({ ...video, trendingRank: index + 1 }));
        return { trending, total: trending.length };
      } catch (error) {
        console.error("Error getting trending content:", error);
        throw new Error("Failed to get trending content");
      }
    }),

  // Get trending hashtags
  getTrendingHashtags: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const videos = await getTrendingVideos(100);
        const counts = new Map<string, number>();
        videos.forEach((video) => (video.hashtags ?? []).forEach((tag) => counts.set(tag.startsWith("#") ? tag : `#${tag}`, (counts.get(tag.startsWith("#") ? tag : `#${tag}`) ?? 0) + 1)));
        const hashtags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, input.limit).map(([tag, count], index) => ({ tag, count, trend: "up" as const, trendingRank: index + 1 }));
        return { hashtags, total: hashtags.length };
      } catch (error) {
        console.error("Error getting trending hashtags:", error);
        throw new Error("Failed to get trending hashtags");
      }
    }),

  // Track user interaction for recommendations
  trackInteraction: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        contentType: z.enum(["post", "video", "comment"]),
        interactionType: z.enum(["like", "comment", "share", "view"]),
        duration: z.number().optional(), // in seconds, for view tracking
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Save interaction to database for recommendation model training

        return {
          success: true,
          message: "Interaction tracked",
        };
      } catch (error) {
        console.error("Error tracking interaction:", error);
        throw new Error("Failed to track interaction");
      }
    }),

  // Get personalized recommendations based on user's followed creators
  getFollowingRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get content from users the current user follows
        // Sort by engagement and recency

        return {
          content: [],
          total: 0,
        };
      } catch (error) {
        console.error("Error getting following recommendations:", error);
        throw new Error("Failed to get following recommendations");
      }
    }),

  // Get collaborative filtering recommendations
  getCollaborativeRecommendations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Find users with similar preferences
        // Recommend content they liked that current user hasn't seen

        return {
          content: [],
          total: 0,
        };
      } catch (error) {
        console.error("Error getting collaborative recommendations:", error);
        throw new Error("Failed to get collaborative recommendations");
      }
    }),
});
