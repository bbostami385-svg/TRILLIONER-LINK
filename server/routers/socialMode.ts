import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users, followers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const socialModeRouter = router({
  // Follow user
  follow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new Error("Cannot follow yourself");
      }

      const [follow] = await db
        .insert(followers)
        .values({
          followerId: ctx.user.id,
          followingId: input.userId,
        })
        .returning();
      return follow;
    }),

  // Unfollow user
  unfollow: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(followers)
        .where(
          and(
            eq(followers.followerId, ctx.user.id),
            eq(followers.followingId, input.userId)
          )
        );
      return { success: true };
    }),

  // Get follower count
  getFollowerCount: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select({ count: followers.id })
        .from(followers)
        .where(eq(followers.followingId, input.userId));
      return result.length;
    }),

  // Check if following
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [follow] = await db
        .select()
        .from(followers)
        .where(
          and(
            eq(followers.followerId, ctx.user.id),
            eq(followers.followingId, input.userId)
          )
        );
      return !!follow;
    }),

  // Get user's following list
  getFollowing: protectedProcedure.query(async ({ ctx }) => {
    const following = await db
      .select()
      .from(followers)
      .where(eq(followers.followerId, ctx.user.id));

    // Get user details
    const userDetails = await db
      .select()
      .from(users)
      .where(eq(users.accountMode, "social"));

    return following.map((f) => {
      const user = userDetails.find((u) => u.id === f.followingId);
      return {
        ...f,
        user,
      };
    });
  }),

  // Get user's followers
  getFollowers: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const userFollowers = await db
        .select()
        .from(followers)
        .where(eq(followers.followingId, input.userId));

      // Get follower details
      const followerDetails = await db
        .select()
        .from(users)
        .where(eq(users.accountMode, "social"));

      return userFollowers.map((f) => {
        const user = followerDetails.find((u) => u.id === f.followerId);
        return {
          ...f,
          user,
        };
      });
    }),
});
