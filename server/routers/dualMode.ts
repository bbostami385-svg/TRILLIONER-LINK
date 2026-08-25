import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { calculateLevel } from "./levels";
import { follows, notifications, subscriptions, userLevels, userModePreferences, users } from "../../drizzle/schema";

const modeSchema = z.enum(["social", "creator"]);
const idSchema = z.number().int().positive();
const pageSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
});

async function ensureModePreferences(db: Awaited<ReturnType<typeof getRequiredDb>>, userId: number) {
  const existing = await db.select({ mode: userModePreferences.mode })
    .from(userModePreferences)
    .where(eq(userModePreferences.userId, userId));
  const existingModes = new Set(existing.map((row) => row.mode));
  for (const mode of ["social", "creator"] as const) {
    if (!existingModes.has(mode)) {
      await db.insert(userModePreferences).values({ userId, mode });
    }
  }
}

async function syncAudienceLevel(db: Awaited<ReturnType<typeof getRequiredDb>>, userId: number, audienceCount: number, fromUserId: number) {
  const [levelRecord] = await db.select().from(userLevels).where(eq(userLevels.userId, userId)).limit(1);
  const newLevel = calculateLevel(audienceCount);
  if (!levelRecord) {
    await db.insert(userLevels).values({ userId, currentLevel: newLevel, totalFollowers: audienceCount, levelUpCount: 0, lastLevelUpAt: null });
    return;
  }
  const leveledUp = newLevel > levelRecord.currentLevel;
  await db.update(userLevels).set({ totalFollowers: audienceCount, ...(leveledUp ? { currentLevel: newLevel, levelUpCount: levelRecord.levelUpCount + 1, lastLevelUpAt: new Date() } : {}), updatedAt: new Date() }).where(eq(userLevels.userId, userId));
  if (leveledUp) await db.insert(notifications).values({ userId, fromUserId, type: "level_up", message: `Congratulations! You reached Level ${newLevel}.`, isRead: false });
}

export const dualModeRouter = router({
  initializeModePreferences: protectedProcedure
    .input(z.object({ selectedMode: modeSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db.update(users).set({ accountMode: input.selectedMode, modeSelected: true, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      await ensureModePreferences(db, ctx.user.id);
      return { success: true, mode: input.selectedMode, message: `Successfully selected ${input.selectedMode} mode.` };
    }),

  switchMode: protectedProcedure
    .input(z.object({ newMode: modeSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db.update(users).set({ accountMode: input.newMode, modeSelected: true, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      await ensureModePreferences(db, ctx.user.id);
      return { success: true, newMode: input.newMode, message: `Successfully switched to ${input.newMode} mode.` };
    }),

  getCurrentMode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    const [statistics] = await db.select().from(userModePreferences)
      .where(and(eq(userModePreferences.userId, ctx.user.id), eq(userModePreferences.mode, user.accountMode)))
      .limit(1);
    return { userId: ctx.user.id, currentMode: user.accountMode, modeSelected: user.modeSelected, statistics: statistics ?? null };
  }),

  getModeStatistics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const preferences = await db.select().from(userModePreferences).where(eq(userModePreferences.userId, ctx.user.id));
    return {
      social: preferences.find((preference) => preference.mode === "social") ?? null,
      creator: preferences.find((preference) => preference.mode === "creator") ?? null,
    };
  }),

  followUser: protectedProcedure
    .input(z.object({ targetUserId: idSchema }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.targetUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot follow yourself." });
      const db = await getRequiredDb();
      const [target] = await db.select({ id: users.id, accountMode: users.accountMode }).from(users).where(eq(users.id, input.targetUserId)).limit(1);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      const [existing] = await db.select({ id: follows.id }).from(follows).where(and(
        eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.targetUserId)
      )).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already following this user." });
      await db.insert(follows).values({ followerId: ctx.user.id, followingId: input.targetUserId });
      await ensureModePreferences(db, ctx.user.id);
      await ensureModePreferences(db, input.targetUserId);
      const following = await db.select({ id: follows.id }).from(follows).where(eq(follows.followerId, ctx.user.id));
      const followers = await db.select({ id: follows.id }).from(follows).where(eq(follows.followingId, input.targetUserId));
      await db.update(userModePreferences).set({ following: following.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, ctx.user.id), eq(userModePreferences.mode, "social")
      ));
      await db.update(userModePreferences).set({ followers: followers.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, input.targetUserId), eq(userModePreferences.mode, "social")
      ));
      if (target.accountMode !== "creator") await syncAudienceLevel(db, input.targetUserId, followers.length, ctx.user.id);
      return { success: true, message: "Successfully followed user." };
    }),

  unfollowUser: protectedProcedure
    .input(z.object({ targetUserId: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db.delete(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.targetUserId)));
      const following = await db.select({ id: follows.id }).from(follows).where(eq(follows.followerId, ctx.user.id));
      const followers = await db.select({ id: follows.id }).from(follows).where(eq(follows.followingId, input.targetUserId));
      await db.update(userModePreferences).set({ following: following.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, ctx.user.id), eq(userModePreferences.mode, "social")
      ));
      await db.update(userModePreferences).set({ followers: followers.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, input.targetUserId), eq(userModePreferences.mode, "social")
      ));
      const [levelRecord] = await db.select().from(userLevels).where(eq(userLevels.userId, input.targetUserId)).limit(1);
      if (levelRecord) await db.update(userLevels).set({ totalFollowers: followers.length, updatedAt: new Date() }).where(eq(userLevels.userId, input.targetUserId));
      return { success: true, message: "Successfully unfollowed user." };
    }),

  getFollowers: protectedProcedure
    .input(z.object({ userId: idSchema }).merge(pageSchema))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const followers = await db.select({ id: users.id, name: users.name, profileImage: users.profileImage, bio: users.bio })
        .from(follows).innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, input.userId)).limit(input.limit).offset(input.offset);
      const total = await db.select({ id: follows.id }).from(follows).where(eq(follows.followingId, input.userId));
      return { followers, total: total.length, limit: input.limit, offset: input.offset };
    }),

  getFollowing: protectedProcedure
    .input(z.object({ userId: idSchema }).merge(pageSchema))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const following = await db.select({ id: users.id, name: users.name, profileImage: users.profileImage, bio: users.bio })
        .from(follows).innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, input.userId)).limit(input.limit).offset(input.offset);
      const total = await db.select({ id: follows.id }).from(follows).where(eq(follows.followerId, input.userId));
      return { following, total: total.length, limit: input.limit, offset: input.offset };
    }),

  isFollowing: protectedProcedure
    .input(z.object({ targetUserId: idSchema }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [follow] = await db.select({ id: follows.id }).from(follows).where(and(
        eq(follows.followerId, ctx.user.id), eq(follows.followingId, input.targetUserId)
      )).limit(1);
      return { isFollowing: Boolean(follow) };
    }),

  subscribeToCreator: protectedProcedure
    .input(z.object({ creatorId: idSchema, tier: z.enum(["free", "basic", "premium"]).default("free") }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.creatorId) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot subscribe to yourself." });
      const db = await getRequiredDb();
      const [creator] = await db.select({ id: users.id, accountMode: users.accountMode }).from(users).where(eq(users.id, input.creatorId)).limit(1);
      if (!creator) throw new TRPCError({ code: "NOT_FOUND", message: "Creator not found." });
      if (creator.accountMode !== "creator") throw new TRPCError({ code: "BAD_REQUEST", message: "Subscriptions are available only for Creator Mode accounts." });
      const [existing] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(
        eq(subscriptions.subscriberId, ctx.user.id), eq(subscriptions.creatorId, input.creatorId)
      )).limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Already subscribed to this creator." });
      await db.insert(subscriptions).values({ subscriberId: ctx.user.id, creatorId: input.creatorId, subscriptionTier: input.tier });
      await ensureModePreferences(db, input.creatorId);
      const count = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.creatorId, input.creatorId));
      await db.update(userModePreferences).set({ subscribers: count.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, input.creatorId), eq(userModePreferences.mode, "creator")
      ));
      await syncAudienceLevel(db, input.creatorId, count.length, ctx.user.id);
      await db.insert(notifications).values({
        userId: input.creatorId,
        fromUserId: ctx.user.id,
        type: "subscribe",
        message: `subscribed to your Creator channel (${input.tier} tier).`,
        isRead: false,
      });
      return { success: true, message: `Successfully subscribed to creator (${input.tier} tier).` };
    }),

  unsubscribeFromCreator: protectedProcedure
    .input(z.object({ creatorId: idSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db.delete(subscriptions).where(and(
        eq(subscriptions.subscriberId, ctx.user.id), eq(subscriptions.creatorId, input.creatorId)
      ));
      const count = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.creatorId, input.creatorId));
      await db.update(userModePreferences).set({ subscribers: count.length, updatedAt: new Date() }).where(and(
        eq(userModePreferences.userId, input.creatorId), eq(userModePreferences.mode, "creator")
      ));
      await syncAudienceLevel(db, input.creatorId, count.length, ctx.user.id);
      return { success: true, message: "Successfully unsubscribed from creator." };
    }),

  getSubscribers: protectedProcedure
    .input(z.object({ creatorId: idSchema }).merge(pageSchema))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const subscribers = await db.select({
        id: users.id, name: users.name, profileImage: users.profileImage, bio: users.bio, tier: subscriptions.subscriptionTier,
      }).from(subscriptions).innerJoin(users, eq(subscriptions.subscriberId, users.id))
        .where(eq(subscriptions.creatorId, input.creatorId)).limit(input.limit).offset(input.offset);
      const total = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.creatorId, input.creatorId));
      return { subscribers, total: total.length, limit: input.limit, offset: input.offset };
    }),

  isSubscribed: protectedProcedure
    .input(z.object({ creatorId: idSchema }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [subscription] = await db.select({ tier: subscriptions.subscriptionTier }).from(subscriptions).where(and(
        eq(subscriptions.subscriberId, ctx.user.id), eq(subscriptions.creatorId, input.creatorId)
      )).limit(1);
      return { isSubscribed: Boolean(subscription), tier: subscription?.tier ?? null };
    }),

  getSubscriptions: protectedProcedure
    .input(z.object({ userId: idSchema }).merge(pageSchema))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const subscriptionsList = await db.select({
        id: users.id, name: users.name, profileImage: users.profileImage, bio: users.bio, tier: subscriptions.subscriptionTier,
      }).from(subscriptions).innerJoin(users, eq(subscriptions.creatorId, users.id))
        .where(eq(subscriptions.subscriberId, input.userId)).limit(input.limit).offset(input.offset);
      const total = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.subscriberId, input.userId));
      return { subscriptions: subscriptionsList, total: total.length, limit: input.limit, offset: input.offset };
    }),
});
