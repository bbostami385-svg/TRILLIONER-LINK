import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { reactions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";

export const reactionsRouter = router({
  // Add reaction to post
  addReactionToPost: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        type: z.enum(["heart", "laugh", "sad", "angry", "wow"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already reacted
      const existing = await db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.postId, input.postId),
            eq(reactions.userId, ctx.user.id),
            eq(reactions.type, input.type)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(reactions).values({
          userId: ctx.user.id,
          postId: input.postId,
          type: input.type,
        });
      }

      return { success: true };
    }),

  // Add reaction to comment
  addReactionToComment: protectedProcedure
    .input(
      z.object({
        commentId: z.number(),
        type: z.enum(["heart", "laugh", "sad", "angry", "wow"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already reacted
      const existing = await db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.commentId, input.commentId),
            eq(reactions.userId, ctx.user.id),
            eq(reactions.type, input.type)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(reactions).values({
          userId: ctx.user.id,
          commentId: input.commentId,
          type: input.type,
        });
      }

      return { success: true };
    }),

  // Remove reaction
  removeReaction: protectedProcedure
    .input(z.object({ reactionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(reactions).where(eq(reactions.id, input.reactionId));
      return { success: true };
    }),

  // Get post reactions
  getPostReactions: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(reactions).where(eq(reactions.postId, input.postId));
    }),

  // Get comment reactions
  getCommentReactions: publicProcedure
    .input(z.object({ commentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(reactions).where(eq(reactions.commentId, input.commentId));
    }),

  // Get reaction summary
  getReactionSummary: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allReactions = await db.select().from(reactions).where(eq(reactions.postId, input.postId));
      
      const summary = {
        heart: 0,
        laugh: 0,
        sad: 0,
        angry: 0,
        wow: 0,
        total: allReactions.length,
      };

      for (const reaction of allReactions) {
        summary[reaction.type]++;
      }

      return summary;
    }),
});
