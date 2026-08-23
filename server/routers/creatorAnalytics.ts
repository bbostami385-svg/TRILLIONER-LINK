import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { comments, posts, subscriptions, videos } from "../../drizzle/schema";

export const creatorAnalyticsRouter = router({
  getOverview: protectedProcedure
    .input(z.object({ days: z.number().int().min(7).max(90).default(30) }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [subscriberRow] = await db.select({ total: sql<number>`count(*)` }).from(subscriptions).where(eq(subscriptions.creatorId, ctx.user.id));
      const [videoRow] = await db.select({ videos: sql<number>`count(*)`, views: sql<number>`coalesce(sum(${videos.views}), 0)`, likes: sql<number>`coalesce(sum(${videos.likes}), 0)`, comments: sql<number>`coalesce(sum(${videos.comments}), 0)` }).from(videos).where(eq(videos.userId, ctx.user.id));
      const [postRow] = await db.select({ likes: sql<number>`coalesce(sum(${posts.likes}), 0)`, comments: sql<number>`coalesce(sum(${posts.comments}), 0)`, shares: sql<number>`coalesce(sum(${posts.shares}), 0)` }).from(posts).where(eq(posts.userId, ctx.user.id));
      const recentVideos = await db.select({ id: videos.id, title: videos.title, views: videos.views, likes: videos.likes, comments: videos.comments, createdAt: videos.createdAt }).from(videos).where(and(eq(videos.userId, ctx.user.id), eq(videos.isPublic, true))).orderBy(desc(videos.createdAt)).limit(8);
      const subscribers = Number(subscriberRow?.total ?? 0);
      const videoViews = Number(videoRow?.views ?? 0);
      const videoLikes = Number(videoRow?.likes ?? 0);
      const videoComments = Number(videoRow?.comments ?? 0);
      const postLikes = Number(postRow?.likes ?? 0);
      const postComments = Number(postRow?.comments ?? 0);
      const shares = Number(postRow?.shares ?? 0);
      const interactions = videoLikes + videoComments + postLikes + postComments + shares;
      const engagementRate = videoViews > 0 ? Number(((interactions / videoViews) * 100).toFixed(2)) : 0;
      return { days: input.days, subscribers, videos: Number(videoRow?.videos ?? 0), views: videoViews, likes: videoLikes + postLikes, comments: videoComments + postComments, shares, engagementRate, recentVideos };
    }),
});
