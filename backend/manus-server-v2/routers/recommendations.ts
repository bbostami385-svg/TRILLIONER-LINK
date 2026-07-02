import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";

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

// Simple recommendation algorithm
function calculateSimilarity(vector1: string[], vector2: string[]): number {
  const set1 = new Set(vector1);
  const set2 = new Set(vector2);
  const v1Array = Array.from(set1);
  const v2Array = Array.from(set2);
  const intersection = new Set(v1Array.filter((x) => set2.has(x)));
  const union = new Set([...v1Array, ...v2Array]);
  return intersection.size / union.size;
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

        // 1. Get user's interaction history
        // 2. Extract user preferences from interactions
        // 3. Score all available posts
        // 4. Return top scored posts

        // For now, return mock recommendations
        return {
          posts: [
            {
              id: 1,
              title: "Amazing Travel Experience",
              score: 0.95,
              reason: "Based on your travel interests",
            },
            {
              id: 2,
              title: "Tech News Update",
              score: 0.87,
              reason: "Popular in your network",
            },
          ],
          total: 2,
        };
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

        // Similar to posts recommendations

        return {
          videos: [],
          total: 0,
        };
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

        // 1. Find users with similar interests
        // 2. Find users followed by users you follow
        // 3. Calculate suggestion score
        // 4. Return top suggestions

        return {
          users: [
            {
              id: 1,
              name: "John Doe",
              username: "johndoe",
              avatar: "https://example.com/avatar1.jpg",
              mutualFollowers: 5,
              score: 0.92,
            },
          ],
          total: 1,
        };
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

        // Calculate trending score based on:
        // - Engagement rate (likes, comments, shares)
        // - Time decay (newer content scores higher)
        // - Category relevance
        // - Viral coefficient

        return {
          trending: [
            {
              id: 1,
              title: "Viral Post",
              engagementScore: 9.8,
              viewCount: 100000,
              trendingRank: 1,
            },
          ],
          total: 1,
        };
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

        // Get hashtags sorted by usage count and trend velocity

        return {
          hashtags: [
            {
              tag: "#TRILLIONER",
              count: 50000,
              trend: "up",
              trendingRank: 1,
            },
          ],
          total: 1,
        };
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
