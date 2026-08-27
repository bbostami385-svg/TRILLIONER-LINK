import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getRequiredDb } from "../db";
import { moderateContent } from "../contentModeration";
import { blockedUsers, moderationReports, mutedUsers } from "../../drizzle/schema";
import { recordSafetyAudit } from "../childSafety";

const reportReason = z.enum(["spam", "inappropriate", "harassment", "violence", "hate_speech", "child_safety", "grooming", "sexual_exploitation", "threat", "dangerous_content", "other_safety", "other"]);
const safetyCategory = z.enum(["child_safety", "grooming", "sexual_exploitation", "harassment", "threat", "dangerous_content", "other_safety"]);
const contentType = z.enum(["post", "video", "comment", "user"]);
const positiveUserId = z.number().int().positive();

function requireAdmin(ctx: { user: { role: string } }) {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

export const moderationRouter = router({
  reportContent: protectedProcedure
    .input(z.object({ contentType, contentId: positiveUserId, reason: reportReason, safetyCategory: safetyCategory.optional(), description: z.string().trim().max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [existing] = await db.select({ id: moderationReports.id }).from(moderationReports)
        .where(and(eq(moderationReports.reporterId, ctx.user.id), eq(moderationReports.contentType, input.contentType), eq(moderationReports.contentId, input.contentId), eq(moderationReports.status, "pending"))).limit(1);
      if (existing) return { success: true, reportId: existing.id, duplicate: true, message: "Your report is already under review." };
      const derivedSafetyCategory = input.safetyCategory ?? (safetyCategory.options.includes(input.reason as typeof safetyCategory.options[number]) ? input.reason as typeof safetyCategory.options[number] : null);
      const priority = derivedSafetyCategory === "grooming" || derivedSafetyCategory === "sexual_exploitation" || derivedSafetyCategory === "child_safety" || derivedSafetyCategory === "threat" ? "urgent" : derivedSafetyCategory ? "high" : "standard";
      const result = await db.insert(moderationReports).values({ reporterId: ctx.user.id, contentType: input.contentType, contentId: input.contentId, reason: input.reason, safetyCategory: derivedSafetyCategory, priority, description: input.description || null });
      const reportId = Number(result[0].insertId);
      if (derivedSafetyCategory) await recordSafetyAudit({ actorUserId: ctx.user.id, reportId, action: "safety_report_submitted", category: derivedSafetyCategory, metadata: { priority, contentType: input.contentType, contentId: input.contentId } });
      return { success: true, reportId, duplicate: false, priority, message: "Content reported successfully." };
    }),

  blockUser: protectedProcedure
    .input(z.object({ userId: positiveUserId }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot block your own account." });
      const db = await getRequiredDb();
      const [existing] = await db.select({ id: blockedUsers.id }).from(blockedUsers).where(and(eq(blockedUsers.blockerId, ctx.user.id), eq(blockedUsers.blockedId, input.userId))).limit(1);
      if (!existing) await db.insert(blockedUsers).values({ blockerId: ctx.user.id, blockedId: input.userId });
      return { success: true, alreadyBlocked: Boolean(existing), message: "User blocked successfully." };
    }),

  unblockUser: protectedProcedure
    .input(z.object({ userId: positiveUserId }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      await db.delete(blockedUsers).where(and(eq(blockedUsers.blockerId, ctx.user.id), eq(blockedUsers.blockedId, input.userId)));
      return { success: true, message: "User unblocked successfully." };
    }),

  getBlockedUsers: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const users = await db.select({ userId: blockedUsers.blockedId, blockedAt: blockedUsers.createdAt }).from(blockedUsers)
        .where(eq(blockedUsers.blockerId, ctx.user.id)).orderBy(desc(blockedUsers.createdAt)).limit(input.limit).offset(input.offset);
      return { users, total: users.length === input.limit ? input.offset + users.length + 1 : input.offset + users.length };
    }),

  muteUser: protectedProcedure
    .input(z.object({ userId: positiveUserId, duration: z.number().int().min(1).max(24 * 365).optional() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot mute your own account." });
      const db = await getRequiredDb();
      const expiresAt = input.duration ? new Date(Date.now() + input.duration * 60 * 60 * 1000) : null;
      const [existing] = await db.select({ id: mutedUsers.id }).from(mutedUsers).where(and(eq(mutedUsers.muterId, ctx.user.id), eq(mutedUsers.mutedId, input.userId))).limit(1);
      if (existing) await db.update(mutedUsers).set({ expiresAt }).where(eq(mutedUsers.id, existing.id));
      else await db.insert(mutedUsers).values({ muterId: ctx.user.id, mutedId: input.userId, expiresAt });
      return { success: true, message: "User muted successfully.", expiresAt };
    }),

  unmuteUser: protectedProcedure
    .input(z.object({ userId: positiveUserId }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      await db.delete(mutedUsers).where(and(eq(mutedUsers.muterId, ctx.user.id), eq(mutedUsers.mutedId, input.userId)));
      return { success: true, message: "User unmuted successfully." };
    }),

  scanContent: publicProcedure
    .input(z.object({ content: z.string().trim().min(1).max(20_000) }))
    .query(async ({ input }) => {
      const result = await moderateContent({ text: input.content });
      return { isClean: result.decision === "allow", decision: result.decision, category: result.category, flaggedKeywords: result.decision === "allow" ? [] : [result.category], score: Math.round(result.confidence * 100), reason: result.reason } as const;
    }),

  getModerationReports: protectedProcedure
    .input(z.object({ status: z.enum(["pending", "resolved", "rejected"]).optional(), safetyCategory: safetyCategory.optional(), priority: z.enum(["standard", "high", "urgent"]).optional(), limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().min(0).default(0) }))
    .query(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const db = await getRequiredDb();
      const filters = [input.status ? eq(moderationReports.status, input.status) : undefined, input.safetyCategory ? eq(moderationReports.safetyCategory, input.safetyCategory) : undefined, input.priority ? eq(moderationReports.priority, input.priority) : undefined].filter(Boolean) as Array<ReturnType<typeof eq>>;
      const where = filters.length ? and(...filters) : undefined;
      const reports = await db.select().from(moderationReports).where(where).orderBy(sql`CASE ${moderationReports.priority} WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 ELSE 3 END`, desc(moderationReports.createdAt)).limit(input.limit).offset(input.offset);
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(moderationReports).where(where);
      return { reports, total: Number(total) };
    }),

  resolveReport: protectedProcedure
    .input(z.object({ reportId: positiveUserId, action: z.enum(["approve", "reject", "remove_content"]), reason: z.string().trim().min(3).max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      const db = await getRequiredDb();
      const [report] = await db.select({ id: moderationReports.id, status: moderationReports.status }).from(moderationReports).where(eq(moderationReports.id, input.reportId)).limit(1);
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Moderation report not found." });
      if (report.status !== "pending") throw new TRPCError({ code: "CONFLICT", message: "This report has already been resolved." });
      await db.update(moderationReports).set({ status: input.action === "reject" ? "rejected" : "resolved", reviewerId: ctx.user.id, resolutionReason: input.reason || input.action, resolvedAt: new Date() }).where(eq(moderationReports.id, input.reportId));
      await recordSafetyAudit({ actorUserId: ctx.user.id, reportId: input.reportId, action: "safety_report_reviewed", category: "moderation", metadata: { action: input.action } });
      return { success: true, message: "Report resolved successfully.", action: input.action, reviewedBy: ctx.user.id };
    }),

  banUser: protectedProcedure
    .input(z.object({ userId: positiveUserId, reason: z.string().trim().min(3).max(1000), duration: z.number().int().min(1).max(3650).optional() }))
    .mutation(async ({ input, ctx }) => {
      requireAdmin(ctx);
      return { success: false, message: "Account bans require a dedicated enforcement policy and are not enabled by this endpoint." } as const;
    }),
});
