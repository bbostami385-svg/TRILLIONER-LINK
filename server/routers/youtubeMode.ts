import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users, subscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const youtubeModeRouter = router({
  // Subscribe to channel
  subscribe: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.channelId) {
        throw new Error("Cannot subscribe to your own channel");
      }

      const [subscription] = await db
        .insert(subscriptions)
        .values({
          userId: ctx.user.id,
          channelId: input.channelId,
        })
        .returning();
      return subscription;
    }),

  // Unsubscribe from channel
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

  // Get subscriber count
  getSubscriberCount: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select({ count: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.channelId, input.channelId));
      return result.length;
    }),

  // Check if subscribed
  isSubscribed: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.userId, ctx.user.id),
            eq(subscriptions.channelId, input.channelId)
          )
        );
      return !!subscription;
    }),

  // Get user's subscriptions
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id));

    // Get channel details
    const channels = await db
      .select()
      .from(users)
      .where(
        eq(users.accountMode, "youtube")
      );

    return userSubscriptions.map((sub) => {
      const channel = channels.find((c) => c.id === sub.channelId);
      return {
        ...sub,
        channel,
      };
    });
  }),

  // Get channel's subscribers
  getChannelSubscribers: protectedProcedure
    .input(z.object({ channelId: z.string() }))
    .query(async ({ input }) => {
      const subs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.channelId, input.channelId));

      // Get subscriber details
      const subscribers = await db
        .select()
        .from(users)
        .where(
          eq(users.accountMode, "social")
        );

      return subs.map((sub) => {
        const subscriber = subscribers.find((s) => s.id === sub.userId);
        return {
          ...sub,
          subscriber,
        };
      });
    }),
});
