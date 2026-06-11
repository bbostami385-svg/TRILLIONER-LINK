import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import { verificationBadges, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

export const verificationRouter = router({
  // Request verification
  requestVerification: protectedProcedure
    .input(
      z.object({
        badgeType: z.enum(["verified", "creator", "business", "media"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already has verification
      const existing = await db
        .select()
        .from(verificationBadges)
        .where(eq(verificationBadges.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("User already has a verification badge");
      }

      // Create verification badge (pending approval)
      const result = await db.insert(verificationBadges).values({
        userId: ctx.user.id,
        badgeType: input.badgeType,
      });

      const badgeId = Number(result[0].insertId);
      const badge = await db.select().from(verificationBadges).where(eq(verificationBadges.id, badgeId)).limit(1);
      return badge[0] || null;
    }),

  // Get user verification
  getUserVerification: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(verificationBadges).where(eq(verificationBadges.userId, input.userId)).limit(1);
      return result[0] || null;
    }),

  // Admin: Approve verification
  approveVerification: adminProcedure
    .input(z.object({ badgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(verificationBadges)
        .set({ verifiedAt: new Date() })
        .where(eq(verificationBadges.id, input.badgeId));

      return { success: true };
    }),

  // Admin: Reject verification
  rejectVerification: adminProcedure
    .input(z.object({ badgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(verificationBadges).where(eq(verificationBadges.id, input.badgeId));
      return { success: true };
    }),

  // Get all pending verifications (admin only)
  getPendingVerifications: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    return db
      .select()
      .from(verificationBadges)
      .innerJoin(users, eq(verificationBadges.userId, users.id));
  }),

  // Revoke verification
  revokeVerification: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(verificationBadges).where(eq(verificationBadges.userId, input.userId));
      return { success: true };
    }),
});
