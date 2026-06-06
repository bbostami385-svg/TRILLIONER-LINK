import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../db";

export const notificationsRouter = router({
  // Get all notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getNotifications(ctx.user.id, input.limit);
    }),

  // Get unread notifications
  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadNotifications(ctx.user.id);
  }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const unread = await getUnreadNotifications(ctx.user.id);
    return { count: unread.length };
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),
});
