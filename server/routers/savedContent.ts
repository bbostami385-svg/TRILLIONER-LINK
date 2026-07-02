import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { savedPosts, archivedPosts } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const savedContentRouter = router({
  // Save post
  savePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [saved] = await db
        .insert(savedPosts)
        .values({
          userId: ctx.user.id,
          postId: input.postId,
        })
        .returning();
      return saved;
    }),

  // Unsave post
  unsavePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(savedPosts)
        .where(
          and(
            eq(savedPosts.userId, ctx.user.id),
            eq(savedPosts.postId, input.postId)
          )
        );
      return { success: true };
    }),

  // Get saved posts
  getSavedPosts: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(savedPosts)
      .where(eq(savedPosts.userId, ctx.user.id));
  }),

  // Archive post
  archivePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [archived] = await db
        .insert(archivedPosts)
        .values({
          userId: ctx.user.id,
          postId: input.postId,
        })
        .returning();
      return archived;
    }),

  // Get archived posts
  getArchivedPosts: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(archivedPosts)
      .where(eq(archivedPosts.userId, ctx.user.id));
  }),
});
