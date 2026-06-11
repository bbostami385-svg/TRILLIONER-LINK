import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { reels, sounds } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "../db";

export const reelsRouter = router({
  // Create a reel
  createReel: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string(),
        caption: z.string().optional(),
        thumbnail: z.string().optional(),
        duration: z.number().optional(),
        soundId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(reels).values({
        userId: ctx.user.id,
        videoUrl: input.videoUrl,
        caption: input.caption,
        thumbnail: input.thumbnail,
        duration: input.duration,
        soundId: input.soundId,
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
      });

      const reelId = Number(result[0].insertId);
      const reel = await db.select().from(reels).where(eq(reels.id, reelId)).limit(1);
      return reel[0] || null;
    }),

  // Get trending reels
  getTrendingReels: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(reels).orderBy(desc(reels.views)).limit(input.limit);
    }),

  // Get user's reels
  getUserReels: publicProcedure
    .input(z.object({ userId: z.number(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(reels).where(eq(reels.userId, input.userId)).limit(input.limit);
    }),

  // Get reel details
  getReel: publicProcedure
    .input(z.object({ reelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(reels).where(eq(reels.id, input.reelId)).limit(1);
      return result[0] || null;
    }),

  // Like reel (increment likes count)
  likeReel: protectedProcedure
    .input(z.object({ reelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const reel = await db.select().from(reels).where(eq(reels.id, input.reelId)).limit(1);
      if (reel[0]) {
        await db.update(reels).set({ likes: reel[0].likes + 1 }).where(eq(reels.id, input.reelId));
      }

      return { success: true };
    }),

  // Unlike reel (decrement likes count)
  unlikeReel: protectedProcedure
    .input(z.object({ reelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const reel = await db.select().from(reels).where(eq(reels.id, input.reelId)).limit(1);
      if (reel[0] && reel[0].likes > 0) {
        await db.update(reels).set({ likes: reel[0].likes - 1 }).where(eq(reels.id, input.reelId));
      }

      return { success: true };
    }),

  // Get trending sounds
  getTrendingSounds: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(sounds).orderBy(desc(sounds.uses)).limit(input.limit);
    }),

  // Get sound details
  getSound: publicProcedure
    .input(z.object({ soundId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(sounds).where(eq(sounds.id, input.soundId)).limit(1);
      return result[0] || null;
    }),
});
