import { and, desc, eq, ne, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getRequiredDb } from "../db";
import { follows, posts, recommendationInteractions, subscriptions, users, videos } from "../../drizzle/schema";

const pageInput = z.object({ limit: z.number().int().min(1).max(100).default(20), offset: z.number().int().nonnegative().default(0) });
export const scoreFreshness = (createdAt: Date | null, engagement: number) => {
  const hours = Math.max(0, (Date.now() - (createdAt?.getTime() ?? Date.now())) / 3_600_000);
  return engagement / Math.pow(1 + hours / 24, 0.65);
};

export const recommendationsRouter = router({
  getRecommendedPosts: protectedProcedure.input(pageInput).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const candidates = await db.select().from(posts).where(ne(posts.userId, ctx.user.id)).orderBy(desc(posts.createdAt)).limit(200);
    const postsWithScore = candidates.map((post) => ({ ...post, score: scoreFreshness(post.createdAt, post.likes + post.comments * 2 + post.shares * 3), reason: post.likes + post.comments + post.shares > 0 ? "Based on recent engagement" : "Recently published" })).sort((a, b) => b.score - a.score);
    return { posts: postsWithScore.slice(input.offset, input.offset + input.limit), total: postsWithScore.length };
  }),

  getRecommendedVideos: protectedProcedure.input(pageInput).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const candidates = await db.select().from(videos).where(and(eq(videos.isPublic, true), ne(videos.userId, ctx.user.id))).orderBy(desc(videos.createdAt)).limit(200);
    const videosWithScore = candidates.map((video) => ({ ...video, score: scoreFreshness(video.createdAt, video.views + video.likes * 4 + video.comments * 6), reason: video.category ? `Popular in ${video.category}` : "Recommended from recent activity" })).sort((a, b) => b.score - a.score);
    return { videos: videosWithScore.slice(input.offset, input.offset + input.limit), total: videosWithScore.length };
  }),

  getSuggestedUsers: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(10) })).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const following = await db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, ctx.user.id));
    const followedIds = new Set(following.map((row) => row.followingId));
    const candidates = await db.select({ id: users.id, name: users.name, username: users.handle, avatar: users.profileImage, accountMode: users.accountMode }).from(users).where(ne(users.id, ctx.user.id)).limit(200);
    const suggestions = candidates.filter((candidate) => !followedIds.has(candidate.id)).slice(0, input.limit).map((candidate) => ({ ...candidate, mutualFollowers: 0, score: candidate.accountMode === "creator" ? 1 : 0.5 }));
    return { users: suggestions, total: suggestions.length };
  }),

  getTrendingContent: publicProcedure.input(z.object({ category: z.string().optional(), timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h"), limit: z.number().int().min(1).max(100).default(20) })).query(async ({ input }) => {
    const db = await getRequiredDb();
    const since = new Date(Date.now() - ({ "1h": 3_600_000, "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000 }[input.timeframe]));
    const candidates = await db.select().from(videos).where(and(eq(videos.isPublic, true), sql`${videos.createdAt} >= ${since}`)).orderBy(desc(videos.createdAt)).limit(200);
    const filtered = input.category ? candidates.filter((video) => video.category === input.category) : candidates;
    const trending = filtered.map((video) => ({ id: video.id, title: video.title, engagementScore: scoreFreshness(video.createdAt, video.views + video.likes * 4 + video.comments * 6), viewCount: video.views, trendingRank: 0 })).sort((a, b) => b.engagementScore - a.engagementScore).slice(0, input.limit).map((item, index) => ({ ...item, trendingRank: index + 1 }));
    return { trending, total: trending.length };
  }),

  getTrendingHashtags: publicProcedure.input(z.object({ limit: z.number().int().min(1).max(50).default(10), timeframe: z.enum(["1h", "24h", "7d", "30d"]).default("24h") })).query(async ({ input }) => {
    const db = await getRequiredDb();
    const since = new Date(Date.now() - ({ "1h": 3_600_000, "24h": 86_400_000, "7d": 604_800_000, "30d": 2_592_000_000 }[input.timeframe]));
    const recent = await db.select({ hashtags: videos.hashtags }).from(videos).where(and(eq(videos.isPublic, true), sql`${videos.createdAt} >= ${since}`));
    const counts = new Map<string, number>();
    recent.forEach(({ hashtags }) => (hashtags ?? []).forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    const hashtags = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, input.limit).map(([tag, count], index) => ({ tag: tag.startsWith("#") ? tag : `#${tag}`, count, trend: "up" as const, trendingRank: index + 1 }));
    return { hashtags, total: hashtags.length };
  }),

  trackInteraction: protectedProcedure.input(z.object({ contentId: z.number().int().positive(), contentType: z.enum(["post", "video", "comment"]), interactionType: z.enum(["like", "comment", "share", "view"]), duration: z.number().int().nonnegative().optional() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    await db.insert(recommendationInteractions).values({ userId: ctx.user.id, contentId: input.contentId, contentType: input.contentType, interactionType: input.interactionType, duration: input.duration });
    return { success: true, message: "Interaction tracked" };
  }),

  getFollowingRecommendations: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(20) })).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const creators = await db.select({ creatorId: follows.followingId }).from(follows).where(eq(follows.followerId, ctx.user.id));
    const ids = creators.map((row) => row.creatorId);
    if (ids.length === 0) return { content: [], total: 0 };
    const feed = await db.select().from(videos).where(and(eq(videos.isPublic, true), sql`${videos.userId} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`)).orderBy(desc(videos.createdAt)).limit(input.limit);
    return { content: feed, total: feed.length };
  }),

  getCollaborativeRecommendations: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(100).default(20) })).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const popular = await db.select({ contentId: recommendationInteractions.contentId, contentType: recommendationInteractions.contentType, signalCount: sql<number>`count(*)` }).from(recommendationInteractions).where(ne(recommendationInteractions.userId, ctx.user.id)).groupBy(recommendationInteractions.contentId, recommendationInteractions.contentType).orderBy(desc(sql`count(*)`)).limit(input.limit);
    return { content: popular, total: popular.length };
  }),
});
