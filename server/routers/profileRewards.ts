import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { profileRewards, users } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

export const profileRewardCatalog = [
  { id: "signal-scout", type: "badge" as const, name: "Signal Scout", description: "A verified connector badge for early community builders.", cost: 50, accent: "cyan" },
  { id: "orbit-builder", type: "badge" as const, name: "Orbit Builder", description: "A standout badge for growing a trusted circle.", cost: 150, accent: "violet" },
  { id: "aurora-violet", type: "theme" as const, name: "Aurora Violet", description: "A luminous indigo profile atmosphere.", cost: 100, accent: "violet" },
  { id: "midnight-cyan", type: "theme" as const, name: "Midnight Cyan", description: "A deep night canvas with a cyan signal glow.", cost: 250, accent: "cyan" },
] as const;

const rewardIdSchema = z.string().trim().min(1).max(80);
const rewardFor = (rewardId: string) => profileRewardCatalog.find((reward) => reward.id === rewardId);

export const profileRewardsRouter = router({
  catalog: publicProcedure.query(() => profileRewardCatalog),
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [account] = await db.select({ points: users.inviteRewardPoints, activeBadge: users.activeProfileBadge, activeTheme: users.activeProfileTheme }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    const owned = await db.select({ rewardId: profileRewards.rewardId, rewardType: profileRewards.rewardType, cost: profileRewards.cost, unlockedAt: profileRewards.unlockedAt }).from(profileRewards).where(eq(profileRewards.userId, ctx.user.id)).orderBy(desc(profileRewards.unlockedAt));
    return { points: Number(account?.points ?? 0), activeBadge: account?.activeBadge ?? null, activeTheme: account?.activeTheme ?? null, owned };
  }),
  unlock: protectedProcedure.input(z.object({ rewardId: rewardIdSchema })).mutation(async ({ ctx, input }) => {
    const reward = rewardFor(input.rewardId);
    if (!reward) throw new Error("This profile reward does not exist.");
    const db = await getRequiredDb();
    const [existing] = await db.select({ id: profileRewards.id }).from(profileRewards).where(and(eq(profileRewards.userId, ctx.user.id), eq(profileRewards.rewardId, reward.id))).limit(1);
    if (existing) return { success: true, alreadyOwned: true, reward };
    const charged = await db.update(users).set({ inviteRewardPoints: sql`${users.inviteRewardPoints} - ${reward.cost}` }).where(and(eq(users.id, ctx.user.id), sql`${users.inviteRewardPoints} >= ${reward.cost}`));
    if (Number(charged[0]?.affectedRows ?? 0) === 0) throw new Error(`You need ${reward.cost} invite points to unlock ${reward.name}.`);
    try {
      await db.insert(profileRewards).values({ userId: ctx.user.id, rewardId: reward.id, rewardType: reward.type, cost: reward.cost });
    } catch (error) {
      await db.update(users).set({ inviteRewardPoints: sql`${users.inviteRewardPoints} + ${reward.cost}` }).where(eq(users.id, ctx.user.id));
      if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("unique")) return { success: true, alreadyOwned: true, reward };
      throw error;
    }
    return { success: true, alreadyOwned: false, reward };
  }),
  select: protectedProcedure.input(z.object({ rewardId: rewardIdSchema, rewardType: z.enum(["badge", "theme"]) })).mutation(async ({ ctx, input }) => {
    const reward = rewardFor(input.rewardId);
    if (!reward || reward.type !== input.rewardType) throw new Error("Invalid profile reward selection.");
    const db = await getRequiredDb();
    const [owned] = await db.select({ id: profileRewards.id }).from(profileRewards).where(and(eq(profileRewards.userId, ctx.user.id), eq(profileRewards.rewardId, reward.id))).limit(1);
    if (!owned) throw new Error("Unlock this reward before selecting it.");
    if (reward.type === "badge") await db.update(users).set({ activeProfileBadge: reward.id, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    else await db.update(users).set({ activeProfileTheme: reward.id, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
    return { success: true, reward };
  }),
});
