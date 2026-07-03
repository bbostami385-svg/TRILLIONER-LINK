import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { reactions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const reactionsRouter = router({
  // Add reaction to post
  addReaction: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        emoji: z.enum([
          "❤️", "😘", "🤔", "🤣", "😡", "😱", "🥵", "🥶", "🤢",
          "👍", "👎", "🔥", "💯", "😂", "😍", "🤩", "😎", "🥳",
          "💪", "🙌", "👏", "🎉", "✨", "🚀", "💖", "⭐", "🌟"
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [reaction] = await db
        .insert(reactions)
        .values({
          userId: ctx.user.id,
          postId: input.postId,
          emoji: input.emoji,
        })
        .returning();
      return reaction;
    }),

  // Remove reaction
  removeReaction: protectedProcedure
    .input(z.object({ postId: z.string(), emoji: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.userId, ctx.user.id),
            eq(reactions.postId, input.postId),
            eq(reactions.emoji, input.emoji)
          )
        );
      return { success: true };
    }),

  // Get reactions for post
  getPostReactions: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      const postReactions = await db
        .select()
        .from(reactions)
        .where(eq(reactions.postId, input.postId));

      // Group by emoji and count
      const grouped = new Map<string, number>();
      postReactions.forEach((r) => {
        grouped.set(r.emoji, (grouped.get(r.emoji) || 0) + 1);
      });

      return Array.from(grouped.entries()).map(([emoji, count]) => ({
        emoji,
        count,
      }));
    }),

  // Get user's reaction on post
  getUserReaction: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [userReaction] = await db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.userId, ctx.user.id),
            eq(reactions.postId, input.postId)
          )
        );
      return userReaction || null;
    }),
});
