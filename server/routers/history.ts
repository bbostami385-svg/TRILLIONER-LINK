import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { watchHistory } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";

export const historyRouter = router({
  // Add to watch history
  addToHistory: protectedProcedure
    .input(z.object({ videoId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already in history
      const existing = await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.videoId, input.videoId))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(watchHistory).values({
          userId: ctx.user.id,
          videoId: input.videoId,
        });
      }

      return { success: true };
    }),

  // Get watch history
  getWatchHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.userId, ctx.user.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(input.limit);
    }),

  // Clear watch history
  clearWatchHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(watchHistory).where(eq(watchHistory.userId, ctx.user.id));
    return { success: true };
  }),

  // Remove single item from history
  removeFromHistory: protectedProcedure
    .input(z.object({ historyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select()
        .from(watchHistory)
        .where(eq(watchHistory.id, input.historyId))
        .limit(1);

      if (!history[0]) {
        throw new Error("History item not found");
      }

      if (history[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await db.delete(watchHistory).where(eq(watchHistory.id, input.historyId));
      return { success: true };
    }),
});
