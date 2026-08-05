import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users, follows } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const socialModeRouter = router({
  // Follow user
  follow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot follow yourself",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .insert(follows)
        .values({
          followerId: ctx.user.id,
          followingId: input.userId,
        });
      return { success: true };
    }),

  // Unfollow user
  unfollow: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.userId)
          )
        );
      return { success: true };
    }),

  // Get follower count
  getFollowerCount: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db
        .select({ count: follows.id })
        .from(follows)
        .where(eq(follows.followingId, input.userId));
      return result.length;
    }),

  // Check if following
  isFollowing: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const followList = await db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.user.id),
            eq(follows.followingId, input.userId)
          )
        );
      return followList.length > 0;
    }),

  // Get user's following list
  getFollowing: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const following = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, ctx.user.id));

    // Get user details
    const userDetails = await db
      .select()
      .from(users)
      .where(eq(users.accountMode, "social" as any));

    return following.map((f: any) => {
      const user = userDetails.find((u: any) => u.id === f.followingId);
      return {
        ...f,
        user,
      };
    });
  }),

  // Get user's followers
  getFollowers: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const userFollowers = await db
        .select()
        .from(follows)
        .where(eq(follows.followingId, input.userId));

      // Get follower details
      const followerDetails = await db
        .select()
        .from(users)
        .where(eq(users.accountMode, "social" as any));

      return userFollowers.map((f: any) => {
        const user = followerDetails.find((u: any) => u.id === f.followerId);
        return {
          ...f,
          user,
        };
      });
    }),
});
