import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { duets, reels, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

export const duetsRouter = router({
  // Create duet
  createDuet: protectedProcedure
    .input(
      z.object({
        originalReelId: z.number(),
        duetReelId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(duets).values({
        originalReelId: input.originalReelId,
        duetReelId: input.duetReelId,
      });

      const duetId = Number(result[0].insertId);
      const duet = await db.select().from(duets).where(eq(duets.id, duetId)).limit(1);
      return duet[0] || null;
    }),

  // Get duet
  getDuet: publicProcedure
    .input(z.object({ duetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(duets).where(eq(duets.id, input.duetId)).limit(1);
      return result[0] || null;
    }),

  // Get duets for reel
  getReelDuets: publicProcedure
    .input(z.object({ reelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db
        .select()
        .from(duets)
        .where(eq(duets.originalReelId, input.reelId))
        .innerJoin(reels, eq(duets.duetReelId, reels.id));
    }),

  // Get duet details with both reels
  getDuetWithReels: publicProcedure
    .input(z.object({ duetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const duet = await db.select().from(duets).where(eq(duets.id, input.duetId)).limit(1);
      if (!duet[0]) return null;

      const originalReel = await db.select().from(reels).where(eq(reels.id, duet[0].originalReelId)).limit(1);
      const duetReel = await db.select().from(reels).where(eq(reels.id, duet[0].duetReelId)).limit(1);

      return {
        duet: duet[0],
        originalReel: originalReel[0],
        duetReel: duetReel[0],
      };
    }),

  // Delete duet
  deleteDuet: protectedProcedure
    .input(z.object({ duetId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify user owns the duet reel
      const duet = await db.select().from(duets).where(eq(duets.id, input.duetId)).limit(1);
      if (!duet[0]) throw new Error("Duet not found");

      const duetReel = await db.select().from(reels).where(eq(reels.id, duet[0].duetReelId)).limit(1);
      if (!duetReel[0] || duetReel[0].userId !== ctx.user.id) {
        throw new Error("Unauthorized to delete this duet");
      }

      await db.delete(duets).where(eq(duets.id, input.duetId));
      return { success: true };
    }),
});
