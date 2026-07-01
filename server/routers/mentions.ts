import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { mentions, posts, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";

export const mentionsRouter = router({
  // Add mention to post
  addMention: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already mentioned
      const existing = await db
        .select()
        .from(mentions)
        .where(and(eq(mentions.postId, input.postId), eq(mentions.userId, input.userId)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(mentions).values({
          postId: input.postId,
          userId: input.userId,
        });
      }

      return { success: true };
    }),

  // Get post mentions
  getPostMentions: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db
        .select()
        .from(mentions)
        .where(eq(mentions.postId, input.postId))
        .innerJoin(users, eq(mentions.userId, users.id));
    }),

  // Get user mentions
  getUserMentions: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db
        .select()
        .from(mentions)
        .where(eq(mentions.userId, input.userId))
        .innerJoin(posts, eq(mentions.postId, posts.id));
    }),

  // Remove mention
  removeMention: protectedProcedure
    .input(z.object({ mentionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(mentions).where(eq(mentions.id, input.mentionId));
      return { success: true };
    }),
});
