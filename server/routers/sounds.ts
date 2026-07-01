import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sounds } from "../../drizzle/schema";
import { eq, desc, like } from "drizzle-orm";
import { getDb } from "../db";

export const soundsRouter = router({
  // Get trending sounds
  getTrendingSounds: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(sounds)
        .orderBy(desc(sounds.uses))
        .limit(input.limit);
    }),

  // Search sounds
  searchSounds: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(sounds)
        .where(like(sounds.title, `%${input.query}%`))
        .limit(input.limit);
    }),

  // Get sound details
  getSound: publicProcedure
    .input(z.object({ soundId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(sounds)
        .where(eq(sounds.id, input.soundId))
        .limit(1);

      return result[0] || null;
    }),

  // Get sounds by artist
  getSoundsByArtist: publicProcedure
    .input(z.object({ artist: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return db
        .select()
        .from(sounds)
        .where(like(sounds.artist, `%${input.artist}%`))
        .limit(input.limit);
    }),

  // Create sound (admin only)
  createSound: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        artist: z.string(),
        duration: z.number(),
        audioUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can create sounds");
      }

      const result = await db.insert(sounds).values({
        title: input.title,
        artist: input.artist,
        duration: input.duration,
        audioUrl: input.audioUrl,
        uses: 0,
        likes: 0,
      });

      const soundId = Number(result[0].insertId);
      const sound = await db
        .select()
        .from(sounds)
        .where(eq(sounds.id, soundId))
        .limit(1);

      return sound[0] || null;
    }),

  // Increment sound uses
  incrementUses: publicProcedure
    .input(z.object({ soundId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const sound = await db
        .select()
        .from(sounds)
        .where(eq(sounds.id, input.soundId))
        .limit(1);

      if (sound[0]) {
        await db
          .update(sounds)
          .set({ uses: sound[0].uses + 1 })
          .where(eq(sounds.id, input.soundId));
      }

      return { success: true };
    }),

  // Get popular sounds by genre
  getSoundsByGenre: publicProcedure
    .input(z.object({ genre: z.string(), limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // For now, return trending sounds
      // In a real app, you'd have a genre column
      return db
        .select()
        .from(sounds)
        .orderBy(desc(sounds.uses))
        .limit(input.limit);
    }),
});
