import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { sponsoredPosts, posts, users } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { getDb } from "../db";

export const adsRouter = router({
  // Create sponsored post
  createSponsoredPost: protectedProcedure
    .input(
      z.object({
        postId: z.number().int().positive(),
        budget: z.string().regex(/^\d+(\.\d{1,2})?$/, "Budget must be a positive currency amount"),
        startDate: z.date(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify post belongs to user
      const post = await db.select().from(posts).where(eq(posts.id, input.postId)).limit(1);
      if (!post[0] || post[0].userId !== ctx.user.id) {
        throw new Error("Post not found or not owned by user");
      }

      const result = await db.insert(sponsoredPosts).values({
        postId: input.postId,
        advertiserUserId: ctx.user.id,
        budget: input.budget,
        spent: "0",
        impressions: 0,
        clicks: 0,
        startDate: input.startDate,
        endDate: input.endDate,
        status: "active",
      });

      const adId = Number(result[0].insertId);
      const ad = await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.id, adId)).limit(1);
      return ad[0] || null;
    }),

  // Get sponsored post
  getSponsoredPost: publicProcedure
    .input(z.object({ adId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId)).limit(1);
      return result[0] || null;
    }),

  // Get user's ads
  getUserAds: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return db.select().from(sponsoredPosts).where(eq(sponsoredPosts.advertiserUserId, ctx.user.id));
  }),

  // Update ad status
  updateAdStatus: protectedProcedure
    .input(
      z.object({
        adId: z.number().int().positive(),
        status: z.enum(["active", "paused", "ended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const ad = await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId)).limit(1);
      if (!ad[0] || ad[0].advertiserUserId !== ctx.user.id) {
        throw new Error("Ad not found or not owned by user");
      }

      await db.update(sponsoredPosts).set({ status: input.status }).where(eq(sponsoredPosts.id, input.adId));
      return { success: true };
    }),

  // Track impression
  trackImpression: publicProcedure
    .input(z.object({ adId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const ad = await db.select({ id: sponsoredPosts.id, status: sponsoredPosts.status }).from(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId)).limit(1);
      if (ad[0]?.status === "active") {
        await db.update(sponsoredPosts).set({ impressions: sql`${sponsoredPosts.impressions} + 1` }).where(and(eq(sponsoredPosts.id, input.adId), eq(sponsoredPosts.status, "active")));
      }

      return { success: true };
    }),

  // Track click
  trackClick: publicProcedure
    .input(z.object({ adId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const ad = await db.select({ id: sponsoredPosts.id, status: sponsoredPosts.status }).from(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId)).limit(1);
      if (ad[0]?.status === "active") {
        await db.update(sponsoredPosts).set({ clicks: sql`${sponsoredPosts.clicks} + 1` }).where(and(eq(sponsoredPosts.id, input.adId), eq(sponsoredPosts.status, "active")));
      }

      return { success: true };
    }),

  // Delete ad
  deleteAd: protectedProcedure
    .input(z.object({ adId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const ad = await db.select().from(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId)).limit(1);
      if (!ad[0] || ad[0].advertiserUserId !== ctx.user.id) {
        throw new Error("Ad not found or not owned by user");
      }

      await db.delete(sponsoredPosts).where(eq(sponsoredPosts.id, input.adId));
      return { success: true };
    }),
});
