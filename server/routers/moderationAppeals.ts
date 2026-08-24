import { and, count, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { moderationAppeals, notifications } from "../../drizzle/schema";

export const moderationAppealAdminFilterSchema = z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"), sort: z.enum(["newest", "oldest"]).default("newest"), page: z.number().int().min(1).default(1), limit: z.number().int().min(1).max(100).default(25) });

export const moderationAppealBulkResolveInput = z.object({ appealIds: z.array(z.number().int().positive()).min(1).max(50), status: z.enum(["approved", "rejected"]), reviewerNote: z.string().trim().max(2_000).optional() }).superRefine((input, refinement) => { if (input.status === "rejected" && !input.reviewerNote) refinement.addIssue({ code: "custom", path: ["reviewerNote"], message: "A rejection reason is required." }); });

export const moderationAppealInput = z.object({
  contentType: z.enum(["post", "comment", "video"]),
  targetId: z.number().int().positive().optional(),
  content: z.string().trim().min(1).max(10_000),
  mediaUrl: z.string().url().max(2_000).optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  appealReason: z.string().trim().min(10, "Please explain why this moderation decision should be reviewed.").max(2_000),
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access required." });
  return next();
});

export const moderationAppealsRouter = router({
  submit: protectedProcedure.input(moderationAppealInput).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [existing] = await db.select({ id: moderationAppeals.id }).from(moderationAppeals).where(and(
      eq(moderationAppeals.userId, ctx.user.id),
      eq(moderationAppeals.contentType, input.contentType),
      input.targetId ? eq(moderationAppeals.targetId, input.targetId) : eq(moderationAppeals.content, input.content),
      eq(moderationAppeals.status, "pending"),
    )).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "An appeal for this content is already under review." });

    const result = await db.insert(moderationAppeals).values({
      userId: ctx.user.id,
      contentType: input.contentType,
      targetId: input.targetId ?? null,
      content: input.content,
      mediaUrl: input.mediaUrl ?? null,
      mediaType: input.mediaType ?? null,
      appealReason: input.appealReason,
      status: "pending",
    });
    return { success: true, appealId: Number(result[0].insertId), status: "pending" as const };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select({ id: moderationAppeals.id, contentType: moderationAppeals.contentType, targetId: moderationAppeals.targetId, appealReason: moderationAppeals.appealReason, status: moderationAppeals.status, reviewerNote: moderationAppeals.reviewerNote, createdAt: moderationAppeals.createdAt, updatedAt: moderationAppeals.updatedAt })
      .from(moderationAppeals).where(eq(moderationAppeals.userId, ctx.user.id)).orderBy(desc(moderationAppeals.createdAt)).limit(50);
  }),

  adminList: adminProcedure.input(moderationAppealAdminFilterSchema).query(async ({ input }) => {
    const db = await getRequiredDb();
    const where = input.status === "all" ? undefined : eq(moderationAppeals.status, input.status);
    const [rows, totalRows] = await Promise.all([
      db.select().from(moderationAppeals).where(where).orderBy(input.sort === "oldest" ? moderationAppeals.createdAt : desc(moderationAppeals.createdAt)).limit(input.limit).offset((input.page - 1) * input.limit),
      db.select({ total: count() }).from(moderationAppeals).where(where),
    ]);
    const total = Number(totalRows[0]?.total ?? 0);
    return { records: rows, page: input.page, pageSize: input.limit, total, hasNext: input.page * input.limit < total, hasPrevious: input.page > 1 };
  }),

  adminBulkResolve: adminProcedure.input(moderationAppealBulkResolveInput).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const appeals = await db.select({ id: moderationAppeals.id, userId: moderationAppeals.userId }).from(moderationAppeals).where(and(inArray(moderationAppeals.id, input.appealIds), eq(moderationAppeals.status, "pending")));
    if (appeals.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "No selected pending appeals are available." });
    await db.update(moderationAppeals).set({ status: input.status, reviewerId: ctx.user.id, reviewerNote: input.reviewerNote ?? null }).where(and(inArray(moderationAppeals.id, appeals.map((appeal) => appeal.id)), eq(moderationAppeals.status, "pending")));
    await Promise.all(appeals.map((appeal) => db.insert(notifications).values({ userId: appeal.userId, fromUserId: ctx.user.id, type: "appeal_result", message: `your moderation appeal was ${input.status}.`, isRead: false })));
    return { success: true, status: input.status, updated: appeals.length };
  }),

  adminResolve: adminProcedure.input(z.object({ appealId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewerNote: z.string().trim().max(2_000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [appeal] = await db.select({ id: moderationAppeals.id, userId: moderationAppeals.userId }).from(moderationAppeals).where(eq(moderationAppeals.id, input.appealId)).limit(1);
    if (!appeal) throw new TRPCError({ code: "NOT_FOUND", message: "Appeal not found." });
    await db.update(moderationAppeals).set({ status: input.status, reviewerId: ctx.user.id, reviewerNote: input.reviewerNote ?? null }).where(eq(moderationAppeals.id, input.appealId));
    await db.insert(notifications).values({
      userId: appeal.userId,
      fromUserId: ctx.user.id,
      type: "appeal_result",
      message: `your moderation appeal was ${input.status}.`,
      isRead: false,
    });
    return { success: true, status: input.status };
  }),
});
