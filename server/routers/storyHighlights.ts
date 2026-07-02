import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { storyHighlights } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const storyHighlightsRouter = router({
  // Create highlight
  create: protectedProcedure
    .input(z.object({ name: z.string(), storyIds: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const [highlight] = await db
        .insert(storyHighlights)
        .values({
          userId: ctx.user.id,
          name: input.name,
          storyIds: input.storyIds,
        })
        .returning();
      return highlight;
    }),

  // Get user highlights
  getUserHighlights: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(storyHighlights)
      .where(eq(storyHighlights.userId, ctx.user.id));
  }),

  // Delete highlight
  delete: protectedProcedure
    .input(z.object({ highlightId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(storyHighlights)
        .where(eq(storyHighlights.id, input.highlightId));
      return { success: true };
    }),
});
