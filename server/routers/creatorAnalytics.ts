import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { posts, socialLinkClicks, subscriptions, videos } from "../../drizzle/schema";

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must use YYYY-MM-DD format.");
const categoryInput = z.string().trim().min(1).max(80);
const hashtagInput = z.string().trim().regex(/^#[a-z0-9_]+$/i, "Hashtags must begin with #.");
export const analyticsRangeSchema = z.object({
  days: z.number().int().min(7).max(366).default(30),
  startDate: dateInput.optional(),
  endDate: dateInput.optional(),
  category: z.union([z.literal("all"), categoryInput]).default("all"),
  hashtag: z.union([z.literal("all"), hashtagInput]).default("all"),
}).superRefine((value, ctx) => {
  if ((value.startDate && !value.endDate) || (!value.startDate && value.endDate)) ctx.addIssue({ code: "custom", message: "Provide both startDate and endDate." });
  if (value.startDate && value.endDate && value.startDate > value.endDate) ctx.addIssue({ code: "custom", message: "Start date must be before end date." });
});

function dayKey(value: Date | string) { return new Date(value).toISOString().slice(0, 10); }
export function compareMetric(current: number, previous: number) { return { current, previous, delta: current - previous, percent: previous === 0 ? (current === 0 ? 0 : 100) : Number((((current - previous) / previous) * 100).toFixed(2)) }; }
function rangeDates(input: z.infer<typeof analyticsRangeSchema>) {
  if (input.startDate && input.endDate) return { start: new Date(`${input.startDate}T00:00:00.000Z`), end: new Date(`${input.endDate}T23:59:59.999Z`), days: Math.ceil((new Date(`${input.endDate}T23:59:59.999Z`).getTime() - new Date(`${input.startDate}T00:00:00.000Z`).getTime()) / 86_400_000) + 1 };
  const end = new Date(); const start = new Date(end.getTime() - input.days * 86_400_000); return { start, end, days: input.days };
}

export function sortTopVideos<T extends { views: number; engagement: number }>(rows: T[], sortBy: "views" | "engagement") { return [...rows].sort((a, b) => sortBy === "views" ? b.views - a.views || b.engagement - a.engagement : b.engagement - a.engagement || b.views - a.views).slice(0, 8); }

function videoWhere(userId: number, start: Date, end: Date, category: string, hashtag: string) {
  const conditions = [eq(videos.userId, userId), eq(videos.isPublic, true), gte(videos.createdAt, start), lte(videos.createdAt, end)];
  if (category !== "all") conditions.push(eq(videos.category, category));
  if (hashtag !== "all") conditions.push(sql`JSON_CONTAINS(${videos.hashtags}, JSON_QUOTE(${hashtag}))`);
  return and(...conditions);
}

export const creatorAnalyticsRouter = router({
  getFilters: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const rows = await db.select({ category: videos.category, hashtags: videos.hashtags }).from(videos).where(and(eq(videos.userId, ctx.user.id), eq(videos.isPublic, true))).limit(500);
    const categories = Array.from(new Set(rows.map((row) => row.category).filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b));
    const hashtags = Array.from(new Set(rows.flatMap((row) => row.hashtags ?? []))).sort((a, b) => a.localeCompare(b));
    return { categories, hashtags };
  }),

  getOverview: protectedProcedure.input(analyticsRangeSchema).query(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const { start, end, days } = rangeDates(input);
    const videoRows = await db.select({ createdAt: videos.createdAt, title: videos.title, category: videos.category, hashtags: videos.hashtags, views: videos.views, likes: videos.likes, comments: videos.comments }).from(videos).where(videoWhere(ctx.user.id, start, end, input.category, input.hashtag)).orderBy(desc(videos.createdAt));
    const postRows = await db.select({ createdAt: posts.createdAt, likes: posts.likes, comments: posts.comments, shares: posts.shares }).from(posts).where(and(eq(posts.userId, ctx.user.id), gte(posts.createdAt, start), lte(posts.createdAt, end)));
    const subscriptionRows = await db.select({ createdAt: subscriptions.createdAt }).from(subscriptions).where(and(eq(subscriptions.creatorId, ctx.user.id), gte(subscriptions.createdAt, start), lte(subscriptions.createdAt, end)));
    const socialClickRows = await db.select({ provider: socialLinkClicks.provider, total: sql<number>`count(*)` }).from(socialLinkClicks).where(and(eq(socialLinkClicks.profileOwnerId, ctx.user.id), gte(socialLinkClicks.clickedAt, start), lte(socialLinkClicks.clickedAt, end))).groupBy(socialLinkClicks.provider);
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(start.getTime() - (days * 86_400_000));
    const previousVideoRows = await db.select({ views: videos.views, likes: videos.likes, comments: videos.comments }).from(videos).where(videoWhere(ctx.user.id, previousStart, previousEnd, input.category, input.hashtag));
    const previousPostRows = await db.select({ likes: posts.likes, comments: posts.comments, shares: posts.shares }).from(posts).where(and(eq(posts.userId, ctx.user.id), gte(posts.createdAt, previousStart), lte(posts.createdAt, previousEnd)));
    const previousSubscriptionRows = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.creatorId, ctx.user.id), gte(subscriptions.createdAt, previousStart), lte(subscriptions.createdAt, previousEnd)));
    const seriesMap = new Map<string, { date: string; subscribers: number; views: number; likes: number; comments: number; shares: number; videos: number; posts: number }>();
    const ensure = (date: string) => { const existing = seriesMap.get(date); if (existing) return existing; const value = { date, subscribers: 0, views: 0, likes: 0, comments: 0, shares: 0, videos: 0, posts: 0 }; seriesMap.set(date, value); return value; };
    videoRows.forEach((row) => { const item = ensure(dayKey(row.createdAt)); item.videos += 1; item.views += Number(row.views); item.likes += Number(row.likes); item.comments += Number(row.comments); });
    postRows.forEach((row) => { const item = ensure(dayKey(row.createdAt)); item.posts += 1; item.likes += Number(row.likes); item.comments += Number(row.comments); item.shares += Number(row.shares); });
    subscriptionRows.forEach((row) => { ensure(dayKey(row.createdAt)).subscribers += 1; });
    const series = Array.from(seriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    const subscribers = subscriptionRows.length;
    const views = videoRows.reduce((sum, row) => sum + Number(row.views), 0);
    const likes = videoRows.reduce((sum, row) => sum + Number(row.likes), 0) + postRows.reduce((sum, row) => sum + Number(row.likes), 0);
    const commentsTotal = videoRows.reduce((sum, row) => sum + Number(row.comments), 0) + postRows.reduce((sum, row) => sum + Number(row.comments), 0);
    const shares = postRows.reduce((sum, row) => sum + Number(row.shares), 0);
    const engagementRate = views > 0 ? Number((((likes + commentsTotal + shares) / views) * 100).toFixed(2)) : 0;
    const videoPerformance = videoRows.map((video, index) => ({ id: index + 1, title: video.title, category: video.category, hashtags: video.hashtags ?? [], views: Number(video.views), likes: Number(video.likes), comments: Number(video.comments), engagement: Number(video.likes) + Number(video.comments), createdAt: video.createdAt }));
    const recentVideos = videoPerformance.slice(0, 8);
    const topByViews = sortTopVideos(videoPerformance, "views");
    const topByEngagement = sortTopVideos(videoPerformance, "engagement");
    const previousSubscribers = previousSubscriptionRows.length;
    const previousViews = previousVideoRows.reduce((sum, row) => sum + Number(row.views), 0);
    const previousLikes = previousVideoRows.reduce((sum, row) => sum + Number(row.likes), 0) + previousPostRows.reduce((sum, row) => sum + Number(row.likes), 0);
    const previousComments = previousVideoRows.reduce((sum, row) => sum + Number(row.comments), 0) + previousPostRows.reduce((sum, row) => sum + Number(row.comments), 0);
    const previousShares = previousPostRows.reduce((sum, row) => sum + Number(row.shares), 0);
    const previousVideos = previousVideoRows.length;
    const comparison = compareMetric;
    const socialClicks = socialClickRows.map((row) => ({ provider: row.provider, clicks: Number(row.total) }));
    const socialClickTotal = socialClicks.reduce((sum, row) => sum + row.clicks, 0);
    return { days, category: input.category, hashtag: input.hashtag, startDate: dayKey(start), endDate: dayKey(end), subscribers, videos: videoRows.length, views, likes, comments: commentsTotal, shares, engagementRate, socialClicks, socialClickTotal, series, recentVideos, topByViews, topByEngagement, comparison: { subscribers: comparison(subscribers, previousSubscribers), videos: comparison(videoRows.length, previousVideos), views: comparison(views, previousViews), likes: comparison(likes, previousLikes), comments: comparison(commentsTotal, previousComments), shares: comparison(shares, previousShares) }, previousStartDate: dayKey(previousStart), previousEndDate: dayKey(previousEnd) };
  }),
});
