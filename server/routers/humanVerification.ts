import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { persistVerificationMedia } from "../verificationMedia";
import { faceLivenessRecords, livenessChallenge, users } from "../../drizzle/schema";

const challengeSchema = z.enum(["nod", "turn_left", "turn_right", "blink"]);
const metadataSchema = z.record(z.string(), z.unknown()).optional();

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
    }

    const challenges = generateChallenges();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const result = await db.insert(livenessChallenge).values({
      userId: ctx.user.id,
      challenges,
      status: "active",
      expiresAt,
    });

    return {
      challengeId: Number(result[0].insertId),
      challenges,
      expiresAt,
      message: "Challenge started. Follow each movement instruction in order.",
    };
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
        metadata: input.metadata,
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
    .input(z.object({ limit: z.number().int().min(1).max(100).default(25), offset: z.number().int().nonnegative().default(0) }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
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
        .where(eq(faceLivenessRecords.status, "pending"))
        .orderBy(desc(faceLivenessRecords.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const totalRows = await db.select({ id: faceLivenessRecords.id }).from(faceLivenessRecords)
        .where(eq(faceLivenessRecords.status, "pending"));
      return { records, total: totalRows.length, limit: input.limit, offset: input.offset };
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
      return { success: true, reviewedBy: ctx.user.id, message: "Human verification rejected." };
    }),
});
