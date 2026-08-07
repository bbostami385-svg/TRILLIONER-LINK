import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, faceLivenessRecords, livenessChallenge } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate random liveness challenges
 * Challenges: nod head, turn left, turn right, blink eyes
 */
function generateChallenges(): string[] {
  const challenges = ["nod", "turn_left", "turn_right", "blink"];
  const selected: string[] = [];
  const shuffled = challenges.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3); // Select 3 random challenges
}

/**
 * Simulate face liveness detection
 * In production, use AWS Rekognition or similar service
 */
function simulateLivenessDetection(metadata: any): {
  isLive: boolean;
  confidence: number;
  reason?: string;
} {
  // In production, integrate with AWS Rekognition or similar
  // For now, simulate with random confidence
  const confidence = Math.random() * 100;
  const isLive = confidence > 70; // 70% confidence threshold

  return {
    isLive,
    confidence: Math.round(confidence * 100) / 100,
    reason: !isLive ? "Low confidence score" : undefined,
  };
}

export const humanVerificationRouter = router({
  /**
   * Start liveness challenge
   * Generates random head movement challenges for the user
   */
  startLivenessChallenge: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();

    // Check if user already has active challenge
    const existingChallenge = await db
      .select()
      .from(livenessChallenge)
      .where(eq(livenessChallenge.userId, ctx.user.id))
      .limit(1);

    if (existingChallenge[0]?.status === "active") {
      return {
        challengeId: existingChallenge[0].id,
        challenges: existingChallenge[0].challenges,
        expiresAt: existingChallenge[0].expiresAt,
        message: "You already have an active challenge",
      };
    }

    // Generate new challenges
    const challenges = generateChallenges();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const challenge = await db
      .insert(livenessChallenge)
      .values({
        userId: ctx.user.id,
        challenges: challenges,
        status: "active",
        expiresAt,
      })
      .returning();

    return {
      challengeId: challenge[0].id,
      challenges,
      expiresAt,
      message: "Liveness challenge started. Please follow the instructions.",
    };
  }),

  /**
   * Submit liveness verification video
   */
  submitLivenessVideo: protectedProcedure
    .input(
      z.object({
        videoUrl: z.string().url(),
        challengeType: z.enum(["nod", "turn_left", "turn_right", "blink"]),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check user's liveness attempts
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Limit attempts to 5 per day
      if (user[0].livenessAttempts >= 5) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many liveness verification attempts. Try again tomorrow.",
        });
      }

      // Simulate liveness detection
      const detection = simulateLivenessDetection(input.metadata);

      // Create liveness record
      const record = await db
        .insert(faceLivenessRecords)
        .values({
          userId: ctx.user.id,
          videoUrl: input.videoUrl,
          challengeType: input.challengeType,
          status: detection.isLive ? "approved" : "rejected",
          confidence: detection.confidence,
          rejectionReason: detection.reason,
          metadata: {
            ...input.metadata,
            detectionResult: detection,
          },
        })
        .returning();

      // Update user if liveness verified
      if (detection.isLive) {
        await db
          .update(users)
          .set({
            livenessVerified: true,
            livenessVerificationAt: new Date(),
            livenessAttempts: 0,
          })
          .where(eq(users.id, ctx.user.id));

        // Mark challenge as completed
        await db
          .update(livenessChallenge)
          .set({ status: "completed" })
          .where(eq(livenessChallenge.userId, ctx.user.id));
      } else {
        // Increment attempts
        await db
          .update(users)
          .set({
            livenessAttempts: user[0].livenessAttempts + 1,
          })
          .where(eq(users.id, ctx.user.id));
      }

      return {
        success: detection.isLive,
        recordId: record[0].id,
        confidence: detection.confidence,
        message: detection.isLive
          ? "Liveness verification successful! Your account is now verified."
          : "Liveness verification failed. Please try again.",
        reason: detection.reason,
      };
    }),

  /**
   * Get liveness verification status
   */
  getLivenessStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const userData = user[0];

    // Get latest liveness record
    const latestRecord = await db
      .select()
      .from(faceLivenessRecords)
      .where(eq(faceLivenessRecords.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt])
      .limit(1);

    return {
      isVerified: userData.livenessVerified,
      verifiedAt: userData.livenessVerificationAt,
      attempts: userData.livenessAttempts,
      lastAttemptStatus: latestRecord[0]?.status,
      lastAttemptConfidence: latestRecord[0]?.confidence,
      message: userData.livenessVerified
        ? "Your account has been verified"
        : "Liveness verification required",
    };
  }),

  /**
   * Get liveness verification history
   */
  getLivenessHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const records = await db
      .select()
      .from(faceLivenessRecords)
      .where(eq(faceLivenessRecords.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt]);

    return records;
  }),

  /**
   * Retry liveness verification
   */
  retryLivenessVerification: protectedProcedure.mutation(async ({ ctx }) => {
    const db = getDb();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (user[0].livenessAttempts >= 5) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please try again tomorrow.",
      });
    }

    // Reset attempts and start new challenge
    await db
      .update(users)
      .set({ livenessAttempts: 0 })
      .where(eq(users.id, ctx.user.id));

    // Generate new challenge
    const challenges = generateChallenges();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const challenge = await db
      .insert(livenessChallenge)
      .values({
        userId: ctx.user.id,
        challenges,
        status: "active",
        expiresAt,
      })
      .returning();

    return {
      challengeId: challenge[0].id,
      challenges,
      expiresAt,
      message: "New liveness challenge created. Please try again.",
    };
  }),

  /**
   * Check if account is human verified
   */
  isHumanVerified: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return {
      isVerified: user[0].livenessVerified,
      verifiedAt: user[0].livenessVerificationAt,
      message: user[0].livenessVerified
        ? "Account is human verified"
        : "Human verification required",
    };
  }),
});
