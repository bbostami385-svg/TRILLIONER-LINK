import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { db } from "../db";
import { users, follows, subscriptions, userModePreferences } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Dual Mode Router
 * Handles Follow/Subscribe functionality for both Social and Creator modes
 */
export const dualModeRouter = router({
  /**
   * Initialize user mode preferences on first signup
   * Creates default preferences for both social and creator modes
   */
  initializeModePreferences: protectedProcedure
    .input(
      z.object({
        selectedMode: z.enum(["social", "creator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Update user's selected mode
        await db
          .update(users)
          .set({
            accountMode: input.selectedMode,
            modeSelected: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create mode preferences for both modes if they don't exist
        const existingPrefs = await db
          .select()
          .from(userModePreferences)
          .where(eq(userModePreferences.userId, userId));

        if (existingPrefs.length === 0) {
          // Create social mode preferences
          await db.insert(userModePreferences).values({
            userId,
            mode: "social",
            followers: 0,
            following: 0,
            subscribers: 0,
            totalViews: 0,
            totalPosts: 0,
            totalVideos: 0,
          });

          // Create creator mode preferences
          await db.insert(userModePreferences).values({
            userId,
            mode: "creator",
            followers: 0,
            following: 0,
            subscribers: 0,
            totalViews: 0,
            totalPosts: 0,
            totalVideos: 0,
          });
        }

        return {
          success: true,
          mode: input.selectedMode,
          message: `Successfully switched to ${input.selectedMode} mode`,
        };
      } catch (error) {
        console.error("Error initializing mode preferences:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize mode preferences",
        });
      }
    }),

  /**
   * Switch between Social and Creator modes
   */
  switchMode: protectedProcedure
    .input(
      z.object({
        newMode: z.enum(["social", "creator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Update user's account mode
        await db
          .update(users)
          .set({
            accountMode: input.newMode,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        return {
          success: true,
          newMode: input.newMode,
          message: `Successfully switched to ${input.newMode} mode`,
        };
      } catch (error) {
        console.error("Error switching mode:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to switch mode",
        });
      }
    }),

  /**
   * Get current user's mode and statistics
   */
  getCurrentMode: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      const user = await db.select().from(users).where(eq(users.id, userId));

      if (!user || user.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const currentUser = user[0];
      const modePrefs = await db
        .select()
        .from(userModePreferences)
        .where(
          and(
            eq(userModePreferences.userId, userId),
            eq(userModePreferences.mode, currentUser.accountMode)
          )
        );

      return {
        userId,
        currentMode: currentUser.accountMode,
        modeSelected: currentUser.modeSelected,
        statistics: modePrefs[0] || null,
      };
    } catch (error) {
      console.error("Error getting current mode:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get current mode",
      });
    }
  }),

  /**
   * Get user's statistics for both modes
   */
  getModeStatistics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    try {
      const prefs = await db
        .select()
        .from(userModePreferences)
        .where(eq(userModePreferences.userId, userId));

      const socialMode = prefs.find((p) => p.mode === "social");
      const creatorMode = prefs.find((p) => p.mode === "creator");

      return {
        social: socialMode || null,
        creator: creatorMode || null,
      };
    } catch (error) {
      console.error("Error getting mode statistics:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get mode statistics",
      });
    }
  }),

  /**
   * SOCIAL MODE: Follow a user
   */
  followUser: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.user.id;
      const { targetUserId } = input;

      if (followerId === targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself",
        });
      }

      try {
        // Check if already following
        const existingFollow = await db
          .select()
          .from(follows)
          .where(
            and(
              eq(follows.followerId, followerId),
              eq(follows.followingId, targetUserId)
            )
          );

        if (existingFollow.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already following this user",
          });
        }

        // Create follow relationship
        await db.insert(follows).values({
          followerId,
          followingId: targetUserId,
        });

        // Update follower's "following" count
        const followingCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followerId, followerId));

        await db
          .update(userModePreferences)
          .set({
            following: followingCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, followerId),
              eq(userModePreferences.mode, "social")
            )
          );

        // Update target's "followers" count
        const followerCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followingId, targetUserId));

        await db
          .update(userModePreferences)
          .set({
            followers: followerCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, targetUserId),
              eq(userModePreferences.mode, "social")
            )
          );

        return {
          success: true,
          message: "Successfully followed user",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error following user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to follow user",
        });
      }
    }),

  /**
   * SOCIAL MODE: Unfollow a user
   */
  unfollowUser: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const followerId = ctx.user.id;
      const { targetUserId } = input;

      try {
        // Delete follow relationship
        await db
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, followerId),
              eq(follows.followingId, targetUserId)
            )
          );

        // Update follower's "following" count
        const followingCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followerId, followerId));

        await db
          .update(userModePreferences)
          .set({
            following: followingCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, followerId),
              eq(userModePreferences.mode, "social")
            )
          );

        // Update target's "followers" count
        const followerCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followingId, targetUserId));

        await db
          .update(userModePreferences)
          .set({
            followers: followerCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, targetUserId),
              eq(userModePreferences.mode, "social")
            )
          );

        return {
          success: true,
          message: "Successfully unfollowed user",
        };
      } catch (error) {
        console.error("Error unfollowing user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unfollow user",
        });
      }
    }),

  /**
   * SOCIAL MODE: Get followers list
   */
  getFollowers: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { userId, limit, offset } = input;

      try {
        const followersList = await db
          .select({
            id: users.id,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
          })
          .from(follows)
          .innerJoin(users, eq(follows.followerId, users.id))
          .where(eq(follows.followingId, userId))
          .limit(limit)
          .offset(offset);

        const totalCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followingId, userId));

        return {
          followers: followersList,
          total: totalCount.length,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error getting followers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get followers",
        });
      }
    }),

  /**
   * SOCIAL MODE: Get following list
   */
  getFollowing: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { userId, limit, offset } = input;

      try {
        const followingList = await db
          .select({
            id: users.id,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
          })
          .from(follows)
          .innerJoin(users, eq(follows.followingId, users.id))
          .where(eq(follows.followerId, userId))
          .limit(limit)
          .offset(offset);

        const totalCount = await db
          .select()
          .from(follows)
          .where(eq(follows.followerId, userId));

        return {
          following: followingList,
          total: totalCount.length,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error getting following:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get following",
        });
      }
    }),

  /**
   * SOCIAL MODE: Check if following a user
   */
  isFollowing: protectedProcedure
    .input(
      z.object({
        targetUserId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const followerId = ctx.user.id;
      const { targetUserId } = input;

      try {
        const follow = await db
          .select()
          .from(follows)
          .where(
            and(
              eq(follows.followerId, followerId),
              eq(follows.followingId, targetUserId)
            )
          );

        return {
          isFollowing: follow.length > 0,
        };
      } catch (error) {
        console.error("Error checking follow status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check follow status",
        });
      }
    }),

  /**
   * CREATOR MODE: Subscribe to a creator
   */
  subscribeToCreator: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
        tier: z.enum(["free", "basic", "premium"]).default("free"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subscriberId = ctx.user.id;
      const { creatorId, tier } = input;

      if (subscriberId === creatorId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot subscribe to yourself",
        });
      }

      try {
        // Check if already subscribed
        const existingSubscription = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.subscriberId, subscriberId),
              eq(subscriptions.creatorId, creatorId)
            )
          );

        if (existingSubscription.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Already subscribed to this creator",
          });
        }

        // Create subscription
        await db.insert(subscriptions).values({
          subscriberId,
          creatorId,
          subscriptionTier: tier,
        });

        // Update creator's subscriber count
        const creatorSubscriberCount = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, creatorId));

        await db
          .update(userModePreferences)
          .set({
            subscribers: creatorSubscriberCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, creatorId),
              eq(userModePreferences.mode, "creator")
            )
          );

        return {
          success: true,
          message: `Successfully subscribed to creator (${tier} tier)`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Error subscribing to creator:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to subscribe to creator",
        });
      }
    }),

  /**
   * CREATOR MODE: Unsubscribe from a creator
   */
  unsubscribeFromCreator: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subscriberId = ctx.user.id;
      const { creatorId } = input;

      try {
        // Delete subscription
        await db
          .delete(subscriptions)
          .where(
            and(
              eq(subscriptions.subscriberId, subscriberId),
              eq(subscriptions.creatorId, creatorId)
            )
          );

        // Update creator's subscriber count
        const creatorSubscriberCount = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, creatorId));

        await db
          .update(userModePreferences)
          .set({
            subscribers: creatorSubscriberCount.length,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userModePreferences.userId, creatorId),
              eq(userModePreferences.mode, "creator")
            )
          );

        return {
          success: true,
          message: "Successfully unsubscribed from creator",
        };
      } catch (error) {
        console.error("Error unsubscribing from creator:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unsubscribe from creator",
        });
      }
    }),

  /**
   * CREATOR MODE: Get subscribers list
   */
  getSubscribers: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { creatorId, limit, offset } = input;

      try {
        const subscribersList = await db
          .select({
            id: users.id,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
            tier: subscriptions.subscriptionTier,
          })
          .from(subscriptions)
          .innerJoin(users, eq(subscriptions.subscriberId, users.id))
          .where(eq(subscriptions.creatorId, creatorId))
          .limit(limit)
          .offset(offset);

        const totalCount = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.creatorId, creatorId));

        return {
          subscribers: subscribersList,
          total: totalCount.length,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error getting subscribers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get subscribers",
        });
      }
    }),

  /**
   * CREATOR MODE: Check if subscribed to a creator
   */
  isSubscribed: protectedProcedure
    .input(
      z.object({
        creatorId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const subscriberId = ctx.user.id;
      const { creatorId } = input;

      try {
        const subscription = await db
          .select()
          .from(subscriptions)
          .where(
            and(
              eq(subscriptions.subscriberId, subscriberId),
              eq(subscriptions.creatorId, creatorId)
            )
          );

        return {
          isSubscribed: subscription.length > 0,
          tier: subscription[0]?.subscriptionTier || null,
        };
      } catch (error) {
        console.error("Error checking subscription status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to check subscription status",
        });
      }
    }),

  /**
   * Get user's subscriptions (creators they follow)
   */
  getSubscriptions: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const { userId, limit, offset } = input;

      try {
        const subscriptionsList = await db
          .select({
            id: users.id,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
            tier: subscriptions.subscriptionTier,
          })
          .from(subscriptions)
          .innerJoin(users, eq(subscriptions.creatorId, users.id))
          .where(eq(subscriptions.subscriberId, userId))
          .limit(limit)
          .offset(offset);

        const totalCount = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.subscriberId, userId));

        return {
          subscriptions: subscriptionsList,
          total: totalCount.length,
          limit,
          offset,
        };
      } catch (error) {
        console.error("Error getting subscriptions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get subscriptions",
        });
      }
    }),
});
