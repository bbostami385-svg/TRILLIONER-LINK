import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createPost,
  getPostsByUserId,
  getFeedPosts,
  getPostById,
  updatePostLikes,
  addLike,
  removeLike,
  hasUserLiked,
} from "../db";

export const feedRouter = router({
  // Get all posts for the feed
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const posts = await getFeedPosts(input.limit, input.offset);
      return {
        posts,
        total: posts.length,
      };
    }),

  // Get posts by a specific user
  getUserPosts: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const posts = await getPostsByUserId(input.userId, input.limit, input.offset);
      return {
        posts,
        total: posts.length,
      };
    }),

  // Get a single post
  getPost: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post) {
        throw new Error("Post not found");
      }
      return post;
    }),

  // Create a new post (protected)
  createPost: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        imageUrl: z.string().optional(),
        videoUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const post = await createPost(
        ctx.user.id,
        input.content,
        input.imageUrl,
        input.videoUrl
      );

      if (!post) {
        throw new Error("Failed to create post");
      }

      return post;
    }),

  // Like a post (protected)
  likePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const post = await getPostById(input.postId);
      if (!post) {
        throw new Error("Post not found");
      }

      const alreadyLiked = await hasUserLiked(ctx.user.id, input.postId);
      if (alreadyLiked) {
        throw new Error("Already liked this post");
      }

      await addLike(ctx.user.id, input.postId);
      await updatePostLikes(input.postId, true);

      const updatedPost = await getPostById(input.postId);
      return updatedPost;
    }),

  // Unlike a post (protected)
  unlikePost: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const post = await getPostById(input.postId);
      if (!post) {
        throw new Error("Post not found");
      }

      const hasLiked = await hasUserLiked(ctx.user.id, input.postId);
      if (!hasLiked) {
        throw new Error("You haven't liked this post");
      }

      await removeLike(ctx.user.id, input.postId);
      await updatePostLikes(input.postId, false);

      const updatedPost = await getPostById(input.postId);
      return updatedPost;
    }),

  // Check if user has liked a post
  hasLiked: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await hasUserLiked(ctx.user.id, input.postId);
    }),
});
