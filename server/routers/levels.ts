import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { db } from "../db";
import { userLevels, userModePreferences } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Level thresholds for each level (1-20)
 */
const LEVEL_THRESHOLDS: Record<number, number> = {
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

/**
 * Calculate current level based on follower count
 */
const calculateLevel = (followers: number): number => {
  for (let level = 20; level >= 1; level--) {
    if (followers >= LEVEL_THRESHOLDS[level]) {
      return level;
    }
  }
  return 1;
};

/**
 * Levels Router
 * Handles user level calculations and progression
 */
export const levelsRouter = router({
  /**
   * Get user's current level and progress
   */
  getUserLevel: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      // Get user's level record
      let userLevel = await db
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, userId));

      if (!userLevel || userLevel.length === 0) {
        // Create initial level record
        await db.insert(userLevels).values({
          userId,
          currentLevel: 1,
          totalFollowers: 0,
          levelUpCount: 0,
        });

        userLevel = await db
          .select()
          .from(userLevels)
          .where(eq(userLevels.userId, userId));
      }

      return userLevel[0];
    } catch (error) {
      console.error("Error getting user level:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get user level",
      });
    }
  }),

  /**
   * Update user level based on follower count
   * Called when followers change
   */
  updateUserLevel: protectedProcedure
    .input(
      z.object({
        newFollowerCount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { newFollowerCount } = input;

      try {
        // Get current level record
        const currentLevelRecord = await db
          .select()
          .from(userLevels)
          .where(eq(userLevels.userId, userId));

        if (!currentLevelRecord || currentLevelRecord.length === 0) {
          // Create initial record
          await db.insert(userLevels).values({
            userId,
            currentLevel: 1,
            totalFollowers: newFollowerCount,
            levelUpCount: 0,
          });

          return {
            success: true,
            leveledUp: false,
            newLevel: 1,
            previousLevel: 1,
          };
        }

        const record = currentLevelRecord[0];
        const previousLevel = record.currentLevel;
        const newLevel = calculateLevel(newFollowerCount);

        // Check if leveled up
        const leveledUp = newLevel > previousLevel;

        // Update level record
        await db
          .update(userLevels)
          .set({
            currentLevel: newLevel,
            totalFollowers: newFollowerCount,
            levelUpCount: leveledUp ? record.levelUpCount + 1 : record.levelUpCount,
            lastLevelUpAt: leveledUp ? new Date() : record.lastLevelUpAt,
            updatedAt: new Date(),
          })
          .where(eq(userLevels.userId, userId));

        return {
          success: true,
          leveledUp,
          newLevel,
          previousLevel,
          levelUpCount: leveledUp ? record.levelUpCount + 1 : record.levelUpCount,
        };
      } catch (error) {
        console.error("Error updating user level:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user level",
        });
      }
    }),

  /**
   * Get level statistics
   */
  getLevelStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      const userLevel = await db
        .select()
        .from(userLevels)
        .where(eq(userLevels.userId, userId));

      if (!userLevel || userLevel.length === 0) {
        return {
          currentLevel: 1,
          totalFollowers: 0,
          levelUpCount: 0,
          nextLevelThreshold: LEVEL_THRESHOLDS[2],
          currentLevelThreshold: LEVEL_THRESHOLDS[1],
        };
      }

      const record = userLevel[0];
      const nextLevel = Math.min(record.currentLevel + 1, 20);

      return {
        currentLevel: record.currentLevel,
        totalFollowers: record.totalFollowers,
        levelUpCount: record.levelUpCount,
        nextLevelThreshold: LEVEL_THRESHOLDS[nextLevel],
        currentLevelThreshold: LEVEL_THRESHOLDS[record.currentLevel],
        lastLevelUpAt: record.lastLevelUpAt,
      };
    } catch (error) {
      console.error("Error getting level stats:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get level stats",
      });
    }
  }),

  /**
   * Get top users by level
   */
  getTopUsersByLevel: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const topUsers = await db
          .select()
          .from(userLevels)
          .orderBy((t) => [t.currentLevel, t.totalFollowers])
          .limit(input.limit);

        return topUsers;
      } catch (error) {
        console.error("Error getting top users:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get top users",
        });
      }
    }),

  /**
   * Get leaderboard
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      try {
        const leaderboard = await db
          .select()
          .from(userLevels)
          .orderBy((t) => [t.currentLevel, t.totalFollowers])
          .limit(input.limit)
          .offset(input.offset);

        const totalCount = await db.select().from(userLevels);

        return {
          users: leaderboard,
          total: totalCount.length,
          limit: input.limit,
          offset: input.offset,
        };
      } catch (error) {
        console.error("Error getting leaderboard:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get leaderboard",
        });
      }
    }),
});
