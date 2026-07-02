import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { subscriptions, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const subscriptionsRouter = router({
  // Subscribe to channel
  subscribe: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [subscription] = await db
        .insert(subscriptions)
        .values({
          userId: ctx.user.id,
          channelId: input.channelId,
        })
        .returning();
      return subscription;
    }),

  // Unsubscribe
  unsubscribe: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.user.id),
            eq(subscriptions.channelId, input.channelId)
          )
        );
      return { success: true };
    }),

  // Get user subscriptions
  getMySubscriptions: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id));
  }),

  // Get channel subscribers count
  getSubscriberCount: publicProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.channelId, input.channelId));
      return { count: result.length };
    }),

  // Check if subscribed
  isSubscribed: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.user.id),
            eq(subscriptions.channelId, input.channelId)
          )
        );
      return { isSubscribed: result.length > 0 };
    }),
});
