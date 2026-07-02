import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createVideo,
  getVideoById,
  getVideosByUserId,
  getTrendingVideos,
  incrementVideoViews,
  updateVideoLikes,
  addLike,
  removeLike,
  hasUserLiked,
  getCommentsByVideoId,
  createComment,
} from "../db";

export const videosRouter = router({
  // Get trending videos
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }))
    .query(async ({ input }) => {
      return await getTrendingVideos(input.limit);
    }),

  // Get videos by user
  getUserVideos: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return await getVideosByUserId(input.userId, input.limit, input.offset);
    }),

  // Get single video
  getVideo: publicProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input }) => {
      const video = await getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }
      await incrementVideoViews(input.videoId);
      return video;
    }),

  // Create video (protected)
  createVideo: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().max(5000).optional(),
        videoUrl: z.string().url(),
        thumbnailUrl: z.string().url().optional(),
        duration: z.number().optional(),
        isPublic: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const video = await createVideo(
        ctx.user.id,
        input.title,
        input.description || "",
        input.videoUrl,
        input.thumbnailUrl,
        input.duration
      );

      if (!video) {
        throw new Error("Failed to create video");
      }

      return video;
    }),

  // Like video (protected)
  likeVideo: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const video = await getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const alreadyLiked = await hasUserLiked(ctx.user.id, undefined, input.videoId);
      if (alreadyLiked) {
        throw new Error("Already liked this video");
      }

      await addLike(ctx.user.id, undefined, input.videoId);
      await updateVideoLikes(input.videoId, true);

      return await getVideoById(input.videoId);
    }),

  // Unlike video (protected)
  unlikeVideo: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const video = await getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const hasLiked = await hasUserLiked(ctx.user.id, undefined, input.videoId);
      if (!hasLiked) {
        throw new Error("You haven't liked this video");
      }

      await removeLike(ctx.user.id, undefined, input.videoId);
      await updateVideoLikes(input.videoId, false);

      return await getVideoById(input.videoId);
    }),

  // Check if user liked video
  hasLiked: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await hasUserLiked(ctx.user.id, undefined, input.videoId);
    }),

  // Get video comments
  getComments: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return await getCommentsByVideoId(input.videoId, input.limit);
    }),

  // Add comment to video
  addComment: protectedProcedure
    .input(
      z.object({
        videoId: z.number(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const video = await getVideoById(input.videoId);
      if (!video) {
        throw new Error("Video not found");
      }

      const comment = await createComment(ctx.user.id, input.content, undefined, input.videoId);
      if (!comment) {
        throw new Error("Failed to create comment");
      }

      return comment;
    }),
});
