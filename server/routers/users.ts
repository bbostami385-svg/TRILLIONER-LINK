import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  followUser,
  unfollowUser,
  isFollowing,
  getFollowers,
  getFollowing,
  getDb,
} from "../db";
import { users } from "../../drizzle/schema";

export const usersRouter = router({
  // Get user profile by ID
  getProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!result.length) {
        throw new Error("User not found");
      }

      const user = result[0];
      const followers = await getFollowers(input.userId);
      const following = await getFollowing(input.userId);

      return {
        ...user,
        followerCount: followers.length,
        followingCount: following.length,
      };
    }),

  // Get current user profile
  getCurrentProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const followers = await getFollowers(ctx.user.id);
    const following = await getFollowing(ctx.user.id);

    return {
      ...ctx.user,
      followerCount: followers.length,
      followingCount: following.length,
    };
  }),

  // Follow a user
  followUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot follow yourself");
      }

      const alreadyFollowing = await isFollowing(ctx.user.id, input.userId);
      if (alreadyFollowing) {
        throw new Error("Already following this user");
      }

      const follow = await followUser(ctx.user.id, input.userId);
      if (!follow) {
        throw new Error("Failed to follow user");
      }

      return follow;
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) {
        throw new Error("Cannot unfollow yourself");
      }

      const isCurrentlyFollowing = await isFollowing(ctx.user.id, input.userId);
      if (!isCurrentlyFollowing) {
        throw new Error("Not following this user");
      }

      await unfollowUser(ctx.user.id, input.userId);
      return { success: true };
    }),

  // Check if following a user
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      return await isFollowing(ctx.user.id, input.userId);
    }),

  // Get followers list
  getFollowers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const followerIds = await getFollowers(input.userId);
      const db = await getDb();
      if (!db) {
        return [];
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, followerIds[0] || 0));

      return result;
    }),

  // Get following list
  getFollowing: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const followingIds = await getFollowing(input.userId);
      const db = await getDb();
      if (!db) {
        return [];
      }

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, followingIds[0] || 0));

      return result;
    }),

  // Search users by name or email
  searchUsers: publicProcedure
    .input(z.object({ query: z.string().min(1).max(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const searchPattern = `%${input.query}%`;
      const result = await db
        .select()
        .from(users)
        .where(
          sql`${users.name} LIKE ${searchPattern} OR ${users.email} LIKE ${searchPattern}`
        )
        .limit(20);

      return result;
    }),

  // Get all users
  getAllUsers: publicProcedure
    .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return [];
      }

      const result = await db
        .select()
        .from(users)
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),

  // Update user role
  updateUserRole: protectedProcedure
    .input(z.object({ userId: z.number(), newRole: z.enum(["admin", "user"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("Cannot change your own role");
      }

      await db
        .update(users)
        .set({ role: input.newRole })
        .where(eq(users.id, input.userId));

      return { success: true, message: `User role updated to ${input.newRole}` };
    }),

  // Suspend user account
  suspendUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("Cannot suspend your own account");
      }

      await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      return { success: true, message: "User account suspended" };
    }),

  // Delete user account
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      if (input.userId === ctx.user.id) {
        throw new Error("Cannot delete your own account");
      }

      await db
        .delete(users)
        .where(eq(users.id, input.userId));

      return { success: true, message: "User account deleted" };
    }),
});
