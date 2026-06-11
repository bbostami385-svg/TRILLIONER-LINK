import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { challenges } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";

export const challengesRouter = router({
  // Create challenge
  createChallenge: protectedProcedure
    .input(
      z.object({
        hashtag: z.string().min(1).max(255),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(challenges).values({
        hashtag: input.hashtag,
        description: input.description,
        creatorId: ctx.user.id,
        coverImage: input.coverImage,
        participants: 1,
        views: 0,
        startDate: input.startDate,
        endDate: input.endDate,
      });

      const challengeId = Number(result[0].insertId);
      const challenge = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
      return challenge[0] || null;
    }),

  // Get challenge
  getChallenge: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      return result[0] || null;
    }),

  // Get trending challenges
  getTrendingChallenges: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(challenges).orderBy(desc(challenges.views)).limit(input.limit);
    }),

  // Get challenge by hashtag
  getChallengeByHashtag: publicProcedure
    .input(z.object({ hashtag: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(challenges).where(eq(challenges.hashtag, input.hashtag)).limit(1);
      return result[0] || null;
    }),

  // Increment participants
  incrementParticipants: protectedProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const challenge = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      if (challenge[0]) {
        await db
          .update(challenges)
          .set({ participants: challenge[0].participants + 1 })
          .where(eq(challenges.id, input.challengeId));
      }

      return { success: true };
    }),

  // Increment views
  incrementViews: publicProcedure
    .input(z.object({ challengeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const challenge = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      if (challenge[0]) {
        await db
          .update(challenges)
          .set({ views: challenge[0].views + 1 })
          .where(eq(challenges.id, input.challengeId));
      }

      return { success: true };
    }),

  // Update challenge
  updateChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.number(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const challenge = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      if (!challenge[0] || challenge[0].creatorId !== ctx.user.id) {
        throw new Error("Only challenge creator can update");
      }

      await db
        .update(challenges)
        .set({
          description: input.description,
          coverImage: input.coverImage,
          endDate: input.endDate,
        })
        .where(eq(challenges.id, input.challengeId));

      const updated = await db.select().from(challenges).where(eq(challenges.id, input.challengeId)).limit(1);
      return updated[0] || null;
    }),
});
