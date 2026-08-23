import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { moderationAppeals } from "../../drizzle/schema";

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

  adminList: adminProcedure.input(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"), limit: z.number().int().min(1).max(100).default(50) })).query(async ({ input }) => {
    const db = await getRequiredDb();
    const where = input.status === "all" ? undefined : eq(moderationAppeals.status, input.status);
    return db.select().from(moderationAppeals).where(where).orderBy(desc(moderationAppeals.createdAt)).limit(input.limit);
  }),

  adminResolve: adminProcedure.input(z.object({ appealId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewerNote: z.string().trim().max(2_000).optional() })).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [appeal] = await db.select({ id: moderationAppeals.id }).from(moderationAppeals).where(eq(moderationAppeals.id, input.appealId)).limit(1);
    if (!appeal) throw new TRPCError({ code: "NOT_FOUND", message: "Appeal not found." });
    await db.update(moderationAppeals).set({ status: input.status, reviewerId: ctx.user.id, reviewerNote: input.reviewerNote ?? null }).where(eq(moderationAppeals.id, input.appealId));
    return { success: true, status: input.status };
  }),
});
