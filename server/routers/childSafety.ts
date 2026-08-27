import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import {
  childSafetySettings,
  safetyAuditLogs,
  safetyEnforcementActions,
  users,
} from "../../drizzle/schema";
import {
  deriveAgeCategory,
  ensureTeenSafetySettings,
  evaluateAndRecordContact,
  isTeen,
  recordSafetyAudit,
} from "../childSafety";

const settingsInput = z.object({
  profileVisibility: z.enum(["private", "followers", "public"]).optional(),
  followPermission: z.enum(["approved_only", "anyone"]).optional(),
  messagePermission: z.enum(["no_one", "followers", "approved_requests"]).optional(),
  commentPermission: z.enum(["no_one", "followers", "approved_requests"]).optional(),
  mentionPermission: z.enum(["no_one", "followers", "approved_requests"]).optional(),
  sharePermission: z.enum(["no_one", "followers", "public"]).optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  screenTimeLimitMinutes: z.number().int().min(15).max(24 * 60).nullable().optional(),
  screenTimeReminderMinutes: z.number().int().min(15).max(240).optional(),
});

function requireAdmin(ctx: { user: { role: string } }) {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
}

export const childSafetyRouter = router({
  getPolicy: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({
      age: users.age,
      ageCategory: users.ageCategory,
      ageVerified: users.ageVerified,
      safetyRestricted: users.safetyRestricted,
      safetyRestrictionReason: users.safetyRestrictionReason,
      safetyRestrictionUntil: users.safetyRestrictionUntil,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    const settings = isTeen(user.ageCategory) ? await ensureTeenSafetySettings(db, ctx.user.id) : null;
    return {
      age: user.age,
      ageCategory: user.ageCategory,
      ageVerified: user.ageVerified,
      isTeen: isTeen(user.ageCategory),
      safetyRestricted: user.safetyRestricted,
      safetyRestrictionReason: user.safetyRestrictionReason,
      safetyRestrictionUntil: user.safetyRestrictionUntil,
      settings,
    };
  }),

  classifyVerifiedAge: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({ id: users.id, age: users.age, ageVerified: users.ageVerified }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    if (!user.ageVerified || user.age === null) throw new TRPCError({ code: "BAD_REQUEST", message: "Complete age verification before classification." });
    const ageCategory = deriveAgeCategory(user.age);
    await db.update(users).set({ ageCategory, safetyRestricted: false, safetyRestrictionReason: null, safetyRestrictionUntil: null }).where(eq(users.id, ctx.user.id));
    const settings = ageCategory === "teen" ? await ensureTeenSafetySettings(db, ctx.user.id) : null;
    await recordSafetyAudit({ actorUserId: ctx.user.id, subjectUserId: ctx.user.id, action: "age_classified", category: "age_assurance", metadata: { ageCategory, source: "refresh" } });
    return { ageCategory, isTeen: ageCategory === "teen", settings };
  }),

  updateSettings: protectedProcedure.input(settingsInput).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({ ageCategory: users.ageCategory }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    if (!isTeen(user.ageCategory)) throw new TRPCError({ code: "FORBIDDEN", message: "Teen safety settings are only available for teen accounts." });
    await ensureTeenSafetySettings(db, ctx.user.id);
    const changes = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
    if (!Object.keys(changes).length) throw new TRPCError({ code: "BAD_REQUEST", message: "No safety setting changes were provided." });
    await db.update(childSafetySettings).set(changes).where(eq(childSafetySettings.userId, ctx.user.id));
    await recordSafetyAudit({ actorUserId: ctx.user.id, subjectUserId: ctx.user.id, action: "teen_settings_updated", category: "child_safety", metadata: { changedFields: Object.keys(changes) } });
    const [settings] = await db.select().from(childSafetySettings).where(eq(childSafetySettings.userId, ctx.user.id)).limit(1);
    return { success: true, settings };
  }),

  evaluateContact: protectedProcedure.input(z.object({ targetUserId: z.number().int().positive(), eventType: z.enum(["message_attempt", "follow_attempt", "comment_attempt", "mention_attempt", "share_attempt"]) })).mutation(async ({ ctx, input }) => {
    if (ctx.user.id === input.targetUserId) return { allowed: true, outcome: "allowed" as const, reason: "Self interaction does not require contact filtering." };
    try {
      return await evaluateAndRecordContact({ actorUserId: ctx.user.id, targetUserId: input.targetUserId, eventType: input.eventType });
    } catch (error) {
      throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Unable to evaluate this interaction." });
    }
  }),

  getMyEnforcements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select({ id: safetyEnforcementActions.id, level: safetyEnforcementActions.level, reason: safetyEnforcementActions.reason, startsAt: safetyEnforcementActions.startsAt, endsAt: safetyEnforcementActions.endsAt, createdAt: safetyEnforcementActions.createdAt })
      .from(safetyEnforcementActions).where(eq(safetyEnforcementActions.subjectUserId, ctx.user.id)).orderBy(desc(safetyEnforcementActions.createdAt)).limit(50);
  }),

  createEnforcement: protectedProcedure.input(z.object({ subjectUserId: z.number().int().positive(), reportId: z.number().int().positive().optional(), level: z.enum(["warning", "content_removal", "feature_restriction", "temporary_suspension", "permanent_removal"]), reason: z.string().trim().min(3).max(2_000), durationHours: z.number().int().min(1).max(24 * 365).optional() })).mutation(async ({ ctx, input }) => {
    requireAdmin(ctx);
    const db = await getRequiredDb();
    const [subject] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.subjectUserId)).limit(1);
    if (!subject) throw new TRPCError({ code: "NOT_FOUND", message: "Subject user not found." });
    const isRestrictive = input.level === "feature_restriction" || input.level === "temporary_suspension" || input.level === "permanent_removal";
    const endsAt = input.durationHours ? new Date(Date.now() + input.durationHours * 60 * 60 * 1000) : null;
    const result = await db.insert(safetyEnforcementActions).values({ subjectUserId: input.subjectUserId, reportId: input.reportId ?? null, level: input.level, reason: input.reason, endsAt, reviewerId: ctx.user.id });
    await db.update(users).set({ safetyRestricted: isRestrictive, safetyRestrictionReason: isRestrictive ? input.reason : null, safetyRestrictionUntil: isRestrictive ? endsAt : null }).where(eq(users.id, input.subjectUserId));
    await recordSafetyAudit({ actorUserId: ctx.user.id, subjectUserId: input.subjectUserId, reportId: input.reportId ?? null, action: "enforcement_applied", category: "child_safety", metadata: { level: input.level, durationHours: input.durationHours ?? null } });
    return { success: true, actionId: Number(result[0].insertId), level: input.level, endsAt };
  }),

  getAuditLogs: protectedProcedure.input(z.object({ subjectUserId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(100).default(50) })).query(async ({ ctx, input }) => {
    requireAdmin(ctx);
    const db = await getRequiredDb();
    const logs = await db.select().from(safetyAuditLogs)
      .where(input.subjectUserId ? eq(safetyAuditLogs.subjectUserId, input.subjectUserId) : undefined)
      .orderBy(desc(safetyAuditLogs.createdAt)).limit(input.limit);
    return logs;
  }),
});
