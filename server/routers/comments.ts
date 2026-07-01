import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createComment,
  getCommentsByPostId,
  getCommentsByVideoId,
  getReplies,
  updateCommentLikes,
  addLike,
  removeLike,
  hasUserLiked,
} from "../db";

export const commentsRouter = router({
  // Get comments for a post
  getPostComments: publicProcedure
    .input(
      z.object({
        postId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return await getCommentsByPostId(input.postId, input.limit);
    }),

  // Get comments for a video
  getVideoComments: publicProcedure
    .input(
      z.object({
        videoId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      return await getCommentsByVideoId(input.videoId, input.limit);
    }),

  // Get replies to a comment
  getReplies: publicProcedure
    .input(z.object({ commentId: z.number() }))
    .query(async ({ input }) => {
      return await getReplies(input.commentId);
    }),

  // Create comment (protected)
  createComment: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
        postId: z.number().optional(),
        videoId: z.number().optional(),
        parentCommentId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.postId && !input.videoId) {
        throw new Error("Either postId or videoId is required");
      }

      const comment = await createComment(
        ctx.user.id,
        input.content,
        input.postId,
        input.videoId,
        input.parentCommentId
      );

      if (!comment) {
        throw new Error("Failed to create comment");
      }

      return comment;
    }),

  // Like comment (protected)
  likeComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const alreadyLiked = await hasUserLiked(ctx.user.id, undefined, undefined, input.commentId);
      if (alreadyLiked) {
        throw new Error("Already liked this comment");
      }

      await addLike(ctx.user.id, undefined, undefined, input.commentId);
      await updateCommentLikes(input.commentId, true);

      return { success: true };
    }),

  // Unlike comment (protected)
  unlikeComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const hasLiked = await hasUserLiked(ctx.user.id, undefined, undefined, input.commentId);
      if (!hasLiked) {
        throw new Error("You haven't liked this comment");
      }

      await removeLike(ctx.user.id, undefined, undefined, input.commentId);
      await updateCommentLikes(input.commentId, false);

      return { success: true };
    }),

  // Check if user liked comment
  hasLiked: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await hasUserLiked(ctx.user.id, undefined, undefined, input.commentId);
    }),
});
