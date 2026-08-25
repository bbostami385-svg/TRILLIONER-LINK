import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { reels, videos, watchHistory } from "../../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";

export const historyRouter = router({
  // Add to watch history
  addToHistory: protectedProcedure
    .input(z.object({ videoId: z.number().int().positive().optional(), reelId: z.number().int().positive().optional() }).refine((input) => Boolean(input.videoId ?? input.reelId), { message: "Provide a videoId or reelId" }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if already in history
      const existing = await db
        .select()
        .from(watchHistory)
        .where(and(eq(watchHistory.userId, ctx.user.id), input.videoId ? eq(watchHistory.videoId, input.videoId) : eq(watchHistory.reelId, input.reelId!)))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(watchHistory).values({
          userId: ctx.user.id,
          videoId: input.videoId ?? null,
          reelId: input.reelId ?? null,
        });
      }

      return { success: true };
    }),

  // Get watch history
  getWatchHistory: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select({ history: watchHistory, video: videos, reel: reels })
        .from(watchHistory)
        .leftJoin(videos, eq(watchHistory.videoId, videos.id))
        .leftJoin(reels, eq(watchHistory.reelId, reels.id))
        .where(eq(watchHistory.userId, ctx.user.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(input.limit);
      return rows.flatMap(({ history, video, reel }) => {
        const media = video ?? (reel ? { id: reel.id, userId: reel.userId, title: reel.title ?? reel.caption ?? "TRILLIONER LINK Short", description: reel.description ?? reel.caption, videoUrl: reel.videoUrl, thumbnailUrl: reel.thumbnail, duration: reel.duration, views: reel.views, category: reel.category, createdAt: reel.createdAt } : null);
        return media ? [{ history, video: media }] : [];
      });
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
