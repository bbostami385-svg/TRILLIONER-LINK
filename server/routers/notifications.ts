import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { notifications, users } from "../../drizzle/schema";
import { getNotifications, getUnreadNotifications, markAllNotificationsAsRead } from "../db";

const notificationType = z.enum(["like", "comment", "follow", "subscribe", "share", "mention", "appeal_result"]);

export const notificationsRouter = router({
  getNotifications: protectedProcedure.input(z.object({ limit: z.number().min(1).max(100).default(50) })).query(async ({ input, ctx }) => getNotifications(ctx.user.id, input.limit)),
  getUnread: protectedProcedure.query(async ({ ctx }) => getUnreadNotifications(ctx.user.id)),
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => ({ count: (await getUnreadNotifications(ctx.user.id)).length })),

  getBellFeed: protectedProcedure.input(z.object({ limit: z.number().int().min(1).max(30).default(8) })).query(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    return db.select({ id: notifications.id, type: notifications.type, message: notifications.message, isRead: notifications.isRead, createdAt: notifications.createdAt, fromUserId: notifications.fromUserId, fromUserName: users.name, fromUserImage: users.profileImage, postId: notifications.postId, videoId: notifications.videoId, commentId: notifications.commentId })
      .from(notifications).leftJoin(users, eq(notifications.fromUserId, users.id))
      .where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(input.limit);
  }),

  markAsRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.id, input.notificationId), eq(notifications.userId, ctx.user.id)));
    return { success: true };
  }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => { await markAllNotificationsAsRead(ctx.user.id); return { success: true }; }),
});
