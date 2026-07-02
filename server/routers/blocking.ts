import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { blockedUsers } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const blockingRouter = router({
  // Block user
  blockUser: protectedProcedure
    .input(z.object({ blockedUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [block] = await db
        .insert(blockedUsers)
        .values({
          userId: ctx.user.id,
          blockedUserId: input.blockedUserId,
        })
        .returning();
      return block;
    }),

  // Unblock user
  unblockUser: protectedProcedure
    .input(z.object({ blockedUserId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(blockedUsers)
        .where(
          and(
            eq(blockedUsers.userId, ctx.user.id),
            eq(blockedUsers.blockedUserId, input.blockedUserId)
          )
        );
      return { success: true };
    }),

  // Get blocked users
  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(blockedUsers)
      .where(eq(blockedUsers.userId, ctx.user.id));
  }),

  // Check if user is blocked
  isBlocked: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(blockedUsers)
        .where(
          and(
            eq(blockedUsers.userId, ctx.user.id),
            eq(blockedUsers.blockedUserId, input.userId)
          )
        );
      return { isBlocked: result.length > 0 };
    }),
});
