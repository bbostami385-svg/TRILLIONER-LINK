import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  searchUsers,
  searchPosts,
  searchVideos,
  searchHashtags,
  getTrendingHashtags,
} from "../db";

export const searchRouter = router({
  // Search users
  searchUsers: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await searchUsers(input.query, input.limit);
    }),

  // Search posts
  searchPosts: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await searchPosts(input.query, input.limit);
    }),

  // Search videos
  searchVideos: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await searchVideos(input.query, input.limit);
    }),

  // Search hashtags
  searchHashtags: publicProcedure
    .input(
      z.object({
        query: z.string().min(1).max(100),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      return await searchHashtags(input.query, input.limit);
    }),

  // Get trending hashtags
  getTrendingHashtags: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      return await getTrendingHashtags(input.limit);
    }),
});
