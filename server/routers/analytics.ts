import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { analytics } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const analyticsRouter = router({
  // Track event
  trackEvent: protectedProcedure
    .input(
      z.object({
        eventType: z.string(),
        contentId: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [event] = await db
        .insert(analytics)
        .values({
          userId: ctx.user.id,
          eventType: input.eventType,
          contentId: input.contentId,
          metadata: input.metadata || {},
        })
        .returning();
      return event;
    }),

  // Get user analytics
  getUserAnalytics: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(analytics)
      .where(eq(analytics.userId, ctx.user.id));
  }),

  // Get trending topics
  getTrendingTopics: publicProcedure.query(async () => {
    const events = await db.select().from(analytics);
    const topics = new Map<string, number>();
    
    events.forEach((event) => {
      if (event.metadata?.hashtag) {
        topics.set(event.metadata.hashtag, (topics.get(event.metadata.hashtag) || 0) + 1);
      }
    });
    
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
  }),
});
