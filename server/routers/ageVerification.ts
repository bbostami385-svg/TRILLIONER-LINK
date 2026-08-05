import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, ageVerificationRecords, faceVerificationRecords } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Validate age restrictions
 */
function validateAge(age: number): { valid: boolean; reason?: string } {
  if (age < 13) {
    return { valid: false, reason: "You must be at least 13 years old to create an account" };
  }
  return { valid: true };
}

/**
 * Check if face verification is required (18+)
 */
function isFaceVerificationRequired(age: number): boolean {
  return age >= 18;
}

export const ageVerificationRouter = router({
  /**
   * Verify user's age during registration
   * Minimum age: 13 years
   * 18+ requires face verification
   */
  verifyAge: publicProcedure
    .input(
      z.object({
        dateOfBirth: z.string().datetime(),
        verificationMethod: z.enum(["manual_dob", "id_document", "email_verification"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const dateOfBirth = new Date(input.dateOfBirth);
      const age = calculateAge(dateOfBirth);

      // Validate age restriction
      const ageValidation = validateAge(age);
      if (!ageValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ageValidation.reason,
        });
      }

      // Check if face verification is required
      const faceVerificationRequired = isFaceVerificationRequired(age);

      return {
        age,
        ageVerified: true,
        faceVerificationRequired,
        message: faceVerificationRequired
          ? "Age verified. Face verification required for 18+ users."
          : "Age verified successfully.",
      };
    }),

  /**
   * Submit age verification for a user
   */
  submitAgeVerification: protectedProcedure
    .input(
      z.object({
        dateOfBirth: z.string().datetime(),
        verificationMethod: z.enum(["manual_dob", "id_document", "email_verification"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const dateOfBirth = new Date(input.dateOfBirth);
      const age = calculateAge(dateOfBirth);

      // Validate age
      const ageValidation = validateAge(age);
      if (!ageValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: ageValidation.reason,
        });
      }

      // Create age verification record
      const record = await db
        .insert(ageVerificationRecords)
        .values({
          userId: ctx.user.id,
          dateOfBirth,
          age,
          verificationMethod: input.verificationMethod,
          status: "approved",
        })
        .returning();

      // Update user record
      const faceVerificationRequired = isFaceVerificationRequired(age);
      await db
        .update(users)
        .set({
          dateOfBirth,
          age,
          ageVerified: true,
          ageVerificationAt: new Date(),
          faceVerificationRequired,
          faceVerificationStatus: faceVerificationRequired ? "pending" : "not_required",
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        age,
        ageVerified: true,
        faceVerificationRequired,
        message: faceVerificationRequired
          ? "Age verified. Please complete face verification to activate your account."
          : "Age verified successfully. Your account is now active.",
      };
    }),

  /**
   * Get age verification status for current user
   */
  getAgeVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
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
    const faceVerificationRequired = userData.faceVerificationRequired;

    return {
      userId: userData.id,
      age: userData.age,
      dateOfBirth: userData.dateOfBirth,
      ageVerified: userData.ageVerified,
      ageVerificationAt: userData.ageVerificationAt,
      faceVerificationRequired,
      faceVerified: userData.faceVerified,
      faceVerificationStatus: userData.faceVerificationStatus,
      accountActive: userData.ageVerified && (!faceVerificationRequired || userData.faceVerified),
    };
  }),

  /**
   * Get age verification history
   */
  getAgeVerificationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    
    const records = await db
      .select()
      .from(ageVerificationRecords)
      .where(eq(ageVerificationRecords.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt]);

    return records;
  }),

  /**
   * Submit face verification image (18+ only)
   */
  submitFaceVerification: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        verificationProvider: z.string().default("aws_rekognition"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if user is 18+
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

      if (!userData.faceVerificationRequired) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Face verification is not required for your account",
        });
      }

      if (!userData.ageVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please verify your age first",
        });
      }

      // Create face verification record
      const record = await db
        .insert(faceVerificationRecords)
        .values({
          userId: ctx.user.id,
          imageUrl: input.imageUrl,
          verificationProvider: input.verificationProvider,
          status: "pending",
          confidence: null,
          metadata: null,
        })
        .returning();

      // Update user status
      await db
        .update(users)
        .set({
          faceVerificationImageUrl: input.imageUrl,
          faceVerificationStatus: "pending",
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        recordId: record[0].id,
        status: "pending",
        message: "Face verification submitted. Please wait for approval.",
      };
    }),

  /**
   * Get face verification status
   */
  getFaceVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
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

    if (!userData.faceVerificationRequired) {
      return {
        required: false,
        message: "Face verification is not required for your account",
      };
    }

    const latestRecord = await db
      .select()
      .from(faceVerificationRecords)
      .where(eq(faceVerificationRecords.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt])
      .limit(1);

    return {
      required: true,
      verified: userData.faceVerified,
      status: userData.faceVerificationStatus,
      lastSubmittedAt: latestRecord[0]?.createdAt,
      rejectionReason: latestRecord[0]?.rejectionReason,
      message: userData.faceVerified
        ? "Face verification completed"
        : "Face verification pending",
    };
  }),

  /**
   * Get face verification history
   */
  getFaceVerificationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const records = await db
      .select()
      .from(faceVerificationRecords)
      .where(eq(faceVerificationRecords.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt]);

    return records;
  }),

  /**
   * Check if account is fully active
   * (Age verified AND face verification completed if required)
   */
  isAccountActive: protectedProcedure.query(async ({ ctx }) => {
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
    const isActive =
      userData.ageVerified &&
      (!userData.faceVerificationRequired || userData.faceVerified);

    return {
      isActive,
      age: userData.age,
      ageVerified: userData.ageVerified,
      faceVerificationRequired: userData.faceVerificationRequired,
      faceVerified: userData.faceVerified,
      reason: !isActive
        ? userData.ageVerified
          ? "Face verification required"
          : "Age verification required"
        : "Account is active",
    };
  }),

  /**
   * Resend face verification (for retry after rejection)
   */
  retryFaceVerification: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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

      if (userData.faceVerificationStatus !== "rejected") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only retry after rejection",
        });
      }

      // Create new verification record
      const record = await db
        .insert(faceVerificationRecords)
        .values({
          userId: ctx.user.id,
          imageUrl: input.imageUrl,
          verificationProvider: "aws_rekognition",
          status: "pending",
        })
        .returning();

      // Update user status
      await db
        .update(users)
        .set({
          faceVerificationImageUrl: input.imageUrl,
          faceVerificationStatus: "pending",
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        recordId: record[0].id,
        status: "pending",
        message: "Face verification resubmitted. Please wait for approval.",
      };
    }),
});
