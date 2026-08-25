import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { notifications, userLevels } from "../../drizzle/schema";

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 50,
  3: 100,
  4: 500,
  5: 1000,
  6: 10000,
  7: 50000,
  8: 100000,
  9: 500000,
  10: 1000000,
  11: 5000000,
  12: 10000000,
  13: 20000000,
  14: 50000000,
  15: 100000000,
  16: 200000000,
  17: 500000000,
  18: 1000000000,
  19: 2000000000,
  20: 5000000000,
};

export const calculateLevel = (followers: number): number => {
  for (let level = 20; level >= 1; level -= 1) {
    if (followers >= LEVEL_THRESHOLDS[level]) return level;
  }
  return 1;
};

export const levelsRouter = router({
  getUserLevel: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    try {
      let [record] = await db
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, ctx.user.id))
        .limit(1);

      if (!record) {
        await db.insert(userLevels).values({
          userId: ctx.user.id,
          currentLevel: 1,
          totalFollowers: 0,
          levelUpCount: 0,
        });
        [record] = await db
          .select()
          .from(userLevels)
          .where(eq(userLevels.userId, ctx.user.id))
          .limit(1);
      }

      return record;
    } catch (error) {
      console.error("Error getting user level:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get user level" });
    }
  }),

  updateUserLevel: protectedProcedure
    .input(z.object({ newFollowerCount: z.number().int().nonnegative() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      try {
        const [record] = await db
          .select()
          .from(userLevels)
          .where(eq(userLevels.userId, ctx.user.id))
          .limit(1);
        const newLevel = calculateLevel(input.newFollowerCount);

        if (!record) {
          await db.insert(userLevels).values({
            userId: ctx.user.id,
            currentLevel: newLevel,
            totalFollowers: input.newFollowerCount,
            levelUpCount: 0,
            lastLevelUpAt: newLevel > 1 ? new Date() : null,
          });
          if (newLevel > 1) {
            await db.insert(notifications).values({
              userId: ctx.user.id,
              type: "level_up",
              message: `Congratulations! You reached Level ${newLevel}.`,
              isRead: false,
            });
          }
          return { success: true, leveledUp: newLevel > 1, newLevel, previousLevel: 1, levelUpCount: 0 };
        }

        const leveledUp = newLevel > record.currentLevel;
        const levelUpCount = record.levelUpCount + (leveledUp ? 1 : 0);
        await db
          .update(userLevels)
          .set({
            currentLevel: newLevel,
            totalFollowers: input.newFollowerCount,
            levelUpCount,
            lastLevelUpAt: leveledUp ? new Date() : record.lastLevelUpAt,
            updatedAt: new Date(),
          })
          .where(eq(userLevels.userId, ctx.user.id));
        if (leveledUp) {
          await db.insert(notifications).values({
            userId: ctx.user.id,
            type: "level_up",
            message: `Congratulations! You reached Level ${newLevel}.`,
            isRead: false,
          });
        }

        return {
          success: true,
          leveledUp,
          newLevel,
          previousLevel: record.currentLevel,
          levelUpCount,
        };
      } catch (error) {
        console.error("Error updating user level:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update user level" });
      }
    }),

  getLevelStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    try {
      const [record] = await db
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, ctx.user.id))
        .limit(1);
      const currentLevel = record?.currentLevel ?? 1;
      const nextLevel = Math.min(currentLevel + 1, 20);

      return {
        currentLevel,
        totalFollowers: record?.totalFollowers ?? 0,
        levelUpCount: record?.levelUpCount ?? 0,
        nextLevelThreshold: LEVEL_THRESHOLDS[nextLevel],
        currentLevelThreshold: LEVEL_THRESHOLDS[currentLevel],
        lastLevelUpAt: record?.lastLevelUpAt ?? null,
      };
    } catch (error) {
      console.error("Error getting level stats:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get level stats" });
    }
  }),

  getTopUsersByLevel: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      try {
        return await db
          .select()
          .from(userLevels)
          .orderBy(desc(userLevels.currentLevel), desc(userLevels.totalFollowers))
          .limit(input.limit);
      } catch (error) {
        console.error("Error getting top users:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get top users" });
      }
    }),

  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      try {
        const users = await db
          .select()
          .from(userLevels)
          .orderBy(desc(userLevels.currentLevel), desc(userLevels.totalFollowers))
          .limit(input.limit)
          .offset(input.offset);
        const total = await db.select().from(userLevels);
        return { users, total: total.length, limit: input.limit, offset: input.offset };
      } catch (error) {
        console.error("Error getting leaderboard:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get leaderboard" });
      }
    }),
});
