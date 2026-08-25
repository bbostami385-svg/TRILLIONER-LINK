import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { persistVerificationMedia } from "../verificationMedia";
import { assessLivenessRisk } from "../livenessSignals";
import { faceLivenessRecords, livenessChallenge, notifications, users, verificationAuditLogs } from "../../drizzle/schema";

export const challengeSchema = z.enum(["nod", "turn_left", "turn_right", "blink"]);
const metadataSchema = z.record(z.string(), z.unknown()).optional();
export const reviewStatusSchema = z.enum(["all", "pending", "approved", "rejected"]);
export const reviewSortSchema = z.enum(["newest", "oldest"]);

function generateChallenges(): Array<z.infer<typeof challengeSchema>> {
  const challenges: Array<z.infer<typeof challengeSchema>> = ["nod", "turn_left", "turn_right", "blink"];
  return challenges.sort(() => Math.random() - 0.5).slice(0, 3);
}

export const humanVerificationRouter = router({
  startLivenessChallenge: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getRequiredDb();
    const now = new Date();
    const [active] = await db
      .select()
      .from(livenessChallenge)
      .where(eq(livenessChallenge.userId, ctx.user.id))
      .orderBy(desc(livenessChallenge.createdAt))
      .limit(1);

    if (active && active.status === "active" && active.expiresAt > now) {
      return {
        challengeId: active.id,
        challenges: active.challenges as Array<z.infer<typeof challengeSchema>>,
        expiresAt: active.expiresAt,
        message: "An active challenge is already available.",
      };
    }

    if (active && active.status === "active" && active.expiresAt <= now) {
      await db.update(livenessChallenge).set({ status: "expired" }).where(eq(livenessChallenge.id, active.id));
      await db.insert(verificationAuditLogs).values({ userId: ctx.user.id, event: "challenge_expired", details: { challengeId: active.id } });
    }

    const challenges = generateChallenges();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const result = await db.insert(livenessChallenge).values({
      userId: ctx.user.id,
      challenges,
      status: "active",
      expiresAt,
    });
    await db.insert(verificationAuditLogs).values({ userId: ctx.user.id, event: "challenge_started", details: { challengeId: Number(result[0].insertId), challenges } });

    return {
      challengeId: Number(result[0].insertId),
      challenges,
      expiresAt,
      message: "Challenge started. Follow each movement instruction in order.",
    };
  }),

  verifyLiveness: protectedProcedure
    .input(z.object({
      challengeId: z.number().int().positive(),
      steps: z.array(z.object({ challengeType: challengeSchema, videoUrl: z.string().min(1).max(15_000_000), metadata: metadataSchema })).min(1).max(4),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [user] = await db.select({ livenessVerified: users.livenessVerified, livenessAttempts: users.livenessAttempts }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      if (user.livenessVerified) return { success: true, status: "approved" as const, challengeId: input.challengeId, message: "Account is already human verified." };
      if (user.livenessAttempts >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
      const [challenge] = await db.select().from(livenessChallenge).where(and(
        eq(livenessChallenge.id, input.challengeId),
        eq(livenessChallenge.userId, ctx.user.id),
      )).limit(1);
      if (!challenge) throw new TRPCError({ code: "NOT_FOUND", message: "Liveness challenge not found." });
      if (challenge.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "This liveness challenge is no longer active." });
      if (challenge.expiresAt <= new Date()) {
        await db.update(livenessChallenge).set({ status: "expired" }).where(eq(livenessChallenge.id, challenge.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "This liveness challenge has expired. Start a new challenge." });
      }
      const expected = challenge.challenges as Array<z.infer<typeof challengeSchema>>;
      const matches = input.steps.length === expected.length && input.steps.every((step, index) => step.challengeType === expected[index]);
      if (!matches) throw new TRPCError({ code: "BAD_REQUEST", message: "Complete each movement in the requested order." });
      const records = await Promise.all(input.steps.map(async (step) => ({
        userId: ctx.user.id,
        videoUrl: await persistVerificationMedia(step.videoUrl, `verification/liveness/${ctx.user.id}`, ["video/webm", "video/mp4"], 12 * 1024 * 1024),
        challengeType: step.challengeType,
        status: "pending" as const,
        metadata: { ...(step.metadata ?? {}), riskSignals: assessLivenessRisk(step.metadata) },
      })));
      await db.transaction(async (tx) => {
        await tx.insert(faceLivenessRecords).values(records);
        await tx.update(livenessChallenge).set({ status: "completed" }).where(eq(livenessChallenge.id, challenge.id));
        await tx.update(users).set({ livenessAttempts: user.livenessAttempts + 1 }).where(eq(users.id, ctx.user.id));
        await tx.insert(verificationAuditLogs).values({ userId: ctx.user.id, event: "submission_pending", details: { challengeId: challenge.id, stepCount: records.length } });
      });
      return { success: false, status: "pending" as const, challengeId: challenge.id, message: "All liveness steps were submitted for secure human review." };
    }),

  submitLivenessVideo: protectedProcedure
    .input(z.object({
      videoUrl: z.string().min(1).max(15_000_000),
      challengeType: challengeSchema,
      metadata: metadataSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [user] = await db.select({
        livenessVerified: users.livenessVerified,
        livenessAttempts: users.livenessAttempts,
      }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.livenessVerified) return { success: true, status: "approved" as const, message: "Account is already human verified." };
      if (user.livenessAttempts >= 5) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
      }

      const videoUrl = await persistVerificationMedia(
        input.videoUrl,
        `verification/liveness/${ctx.user.id}`,
        ["video/webm", "video/mp4"],
        12 * 1024 * 1024,
      );
      // A real liveness provider must review the recording before approval.
      // Never mark an account verified from a client-side boolean or random score.
      const result = await db.insert(faceLivenessRecords).values({
        userId: ctx.user.id,
        videoUrl,
        challengeType: input.challengeType,
        status: "pending",
        metadata: { ...(input.metadata ?? {}), riskSignals: assessLivenessRisk(input.metadata) },
      });
      await db.update(users).set({ livenessAttempts: user.livenessAttempts + 1 }).where(eq(users.id, ctx.user.id));

      return {
        success: false,
        status: "pending" as const,
        recordId: Number(result[0].insertId),
        message: "Your liveness recording was submitted for secure review.",
      };
    }),

  getLivenessStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    const [latestRecord] = await db.select().from(faceLivenessRecords)
      .where(eq(faceLivenessRecords.userId, ctx.user.id))
      .orderBy(desc(faceLivenessRecords.createdAt))
      .limit(1);
    return {
      isVerified: user.livenessVerified,
      verifiedAt: user.livenessVerificationAt,
      attempts: user.livenessAttempts,
      lastAttemptStatus: latestRecord?.status ?? null,
      lastAttemptConfidence: latestRecord?.confidence ?? null,
      message: user.livenessVerified ? "Your account has been verified." : "Liveness verification is required.",
    };
  }),

  getLivenessHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(faceLivenessRecords)
      .where(eq(faceLivenessRecords.userId, ctx.user.id))
      .orderBy(desc(faceLivenessRecords.createdAt));
  }),

  retryLivenessVerification: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({
      livenessVerified: users.livenessVerified,
      livenessAttempts: users.livenessAttempts,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    if (user.livenessVerified) return { alreadyVerified: true, message: "Account is already verified." };
    if (user.livenessAttempts >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });

    await db.update(livenessChallenge).set({ status: "expired" })
      .where(eq(livenessChallenge.userId, ctx.user.id));
    const challenges = generateChallenges();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const result = await db.insert(livenessChallenge).values({
      userId: ctx.user.id,
      challenges,
      status: "active",
      expiresAt,
    });
    return { alreadyVerified: false, challengeId: Number(result[0].insertId), challenges, expiresAt, message: "A new liveness challenge is ready." };
  }),

  isHumanVerified: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({
      livenessVerified: users.livenessVerified,
      livenessVerificationAt: users.livenessVerificationAt,
    }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return {
      isVerified: user.livenessVerified,
      verifiedAt: user.livenessVerificationAt,
      message: user.livenessVerified ? "Account is human verified." : "Human verification required.",
    };
  }),

  getPendingLiveness: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(25),
      offset: z.number().int().nonnegative().default(0),
      status: reviewStatusSchema.default("pending"),
      search: z.string().trim().max(120).optional(),
      challengeType: challengeSchema.optional(),
      sort: reviewSortSchema.default("newest"),
    }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const filters = [
        input.status === "all" ? undefined : eq(faceLivenessRecords.status, input.status),
        input.challengeType ? eq(faceLivenessRecords.challengeType, input.challengeType) : undefined,
        input.search ? or(like(users.name, `%${input.search}%`), like(users.email, `%${input.search}%`)) : undefined,
      ].filter(Boolean);
      const whereClause = filters.length ? and(...filters) : undefined;
      const order = input.sort === "oldest" ? asc(faceLivenessRecords.createdAt) : desc(faceLivenessRecords.createdAt);
      const records = await db.select({
        id: faceLivenessRecords.id,
        userId: faceLivenessRecords.userId,
        videoUrl: faceLivenessRecords.videoUrl,
        challengeType: faceLivenessRecords.challengeType,
        status: faceLivenessRecords.status,
        createdAt: faceLivenessRecords.createdAt,
        userName: users.name,
        userEmail: users.email,
      }).from(faceLivenessRecords)
        .innerJoin(users, eq(faceLivenessRecords.userId, users.id))
        .where(whereClause)
        .orderBy(order)
        .limit(input.limit)
        .offset(input.offset);
      const totalRows = await db.select({ id: faceLivenessRecords.id }).from(faceLivenessRecords)
        .innerJoin(users, eq(faceLivenessRecords.userId, users.id))
        .where(whereClause);
      return { records, total: totalRows.length, limit: input.limit, offset: input.offset };
    }),

  bulkReviewLiveness: adminProcedure
    .input(z.object({
      recordIds: z.array(z.number().int().positive()).min(1).max(100),
      action: z.enum(["approve", "reject"]),
      reason: z.string().min(3).max(1000).optional(),
    }).superRefine((input, ctx) => {
      if (input.action === "reject" && !input.reason?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "A rejection reason is required." });
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const records = await db.select({ id: faceLivenessRecords.id, userId: faceLivenessRecords.userId, status: faceLivenessRecords.status })
        .from(faceLivenessRecords).where(inArray(faceLivenessRecords.id, input.recordIds));
      const pending = records.filter((record) => record.status === "pending");
      if (!pending.length) return { success: true, updated: 0, skipped: records.length, reviewedBy: ctx.user.id };
      await db.transaction(async (tx) => {
        await Promise.all(pending.map((record) => tx.update(faceLivenessRecords).set(input.action === "approve"
          ? { status: "approved", confidence: "100.00", rejectionReason: null }
          : { status: "rejected", rejectionReason: input.reason!.trim() }).where(eq(faceLivenessRecords.id, record.id))));
        await Promise.all(pending.map((record) => tx.update(users).set(input.action === "approve"
          ? { livenessVerified: true, livenessVerificationAt: new Date(), livenessAttempts: 0 }
          : { livenessVerified: false }).where(eq(users.id, record.userId))));
        await Promise.all(pending.map((record) => tx.insert(verificationAuditLogs).values({ userId: record.userId, livenessRecordId: record.id, actorUserId: ctx.user.id, event: input.action === "approve" ? "review_approved" : "review_rejected", details: input.reason ? { reason: input.reason.trim() } : null })));
      });
      await Promise.all(pending.map((record) => db.insert(notifications).values({ userId: record.userId, fromUserId: ctx.user.id, type: "verification_reminder", message: input.action === "approve" ? "Human verification approved. Your account is now protected." : `Human verification needs another attempt: ${input.reason!.trim()}`, isRead: false })));
      return { success: true, updated: pending.length, skipped: records.length - pending.length, reviewedBy: ctx.user.id };
    }),

  approveLiveness: adminProcedure
    .input(z.object({ recordId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [record] = await db.select().from(faceLivenessRecords)
        .where(eq(faceLivenessRecords.id, input.recordId)).limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Liveness record not found." });
      await db.update(faceLivenessRecords).set({ status: "approved", confidence: "100.00", rejectionReason: null })
        .where(eq(faceLivenessRecords.id, input.recordId));
      await db.update(users).set({ livenessVerified: true, livenessVerificationAt: new Date(), livenessAttempts: 0 })
        .where(eq(users.id, record.userId));
      await db.insert(verificationAuditLogs).values({ userId: record.userId, livenessRecordId: record.id, actorUserId: ctx.user.id, event: "review_approved", details: null });
      await db.insert(notifications).values({ userId: record.userId, fromUserId: ctx.user.id, type: "verification_reminder", message: "Human verification approved. Your account is now protected.", isRead: false });
      return { success: true, reviewedBy: ctx.user.id, message: "Human verification approved." };
    }),

  rejectLiveness: adminProcedure
    .input(z.object({ recordId: z.number().int().positive(), reason: z.string().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [record] = await db.select().from(faceLivenessRecords)
        .where(eq(faceLivenessRecords.id, input.recordId)).limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Liveness record not found." });
      await db.update(faceLivenessRecords).set({ status: "rejected", rejectionReason: input.reason })
        .where(eq(faceLivenessRecords.id, input.recordId));
      await db.update(users).set({ livenessVerified: false })
        .where(eq(users.id, record.userId));
      await db.insert(verificationAuditLogs).values({ userId: record.userId, livenessRecordId: record.id, actorUserId: ctx.user.id, event: "review_rejected", details: { reason: input.reason } });
      await db.insert(notifications).values({ userId: record.userId, fromUserId: ctx.user.id, type: "verification_reminder", message: `Human verification needs another attempt: ${input.reason}`, isRead: false });
      return { success: true, reviewedBy: ctx.user.id, message: "Human verification rejected." };
    }),
});
