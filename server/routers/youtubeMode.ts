import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, subscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const youtubeModeRouter = router({
  /**
   * Subscribe to a creator's channel
   */
  // Subscribe to channel
  subscribe: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.channelId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot subscribe to your own channel",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const subscription = await db
        .insert(subscriptions)
        .values({
          subscriberId: ctx.user.id,
          creatorId: input.channelId,
        });
      return { success: true };
    }),

  // Unsubscribe from channel
  unsubscribe: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberId, ctx.user.id),
            eq(subscriptions.creatorId, input.channelId)
          )
        );
      return { success: true };
    }),

  // Get subscriber count
  getSubscriberCount: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db
        .select({ count: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.creatorId, input.channelId));
      return result.length;
    }),

  // Check if subscribed
  isSubscribed: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const subscriptionList = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.subscriberId, ctx.user.id),
            eq(subscriptions.creatorId, input.channelId)
          )
        );
      return subscriptionList.length > 0;
    }),

  // Get user's subscriptions
  getSubscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.subscriberId, ctx.user.id));

    // Get channel details
      const channels = await db
        .select()
        .from(users)
        .where(
          eq(users.accountMode, "creator" as any)
        );

    return userSubscriptions.map((sub: any) => {
      const channel = channels.find((c: any) => c.id === sub.creatorId);
      return {
        ...sub,
        channel,
      };
    });
  }),

  // Get channel's subscribers
  getChannelSubscribers: protectedProcedure
    .input(z.object({ channelId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const subs = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.creatorId, input.channelId));

      // Get subscriber details
      const subscribers = await db
        .select()
        .from(users)
        .where(
          eq(users.accountMode, "social" as any)
        );

      return subs.map((sub: any) => {
        const subscriber = subscribers.find((s: any) => s.id === sub.subscriberId);
        return {
          ...sub,
          subscriber,
        };
      });
    }),
});
