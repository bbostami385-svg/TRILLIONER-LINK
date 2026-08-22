import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { ageVerificationRecords, faceVerificationRecords, users } from "../../drizzle/schema";

export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

export function validateDateOfBirth(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date > new Date()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Please provide a valid date of birth." });
  }
  return date;
}

const ageInput = z.object({
  dateOfBirth: z.string().datetime(),
  verificationMethod: z.enum(["manual_dob", "id_document", "email_verification"]),
});

export const ageVerificationRouter = router({
  verifyAge: publicProcedure.input(ageInput).mutation(({ input }) => {
    const dateOfBirth = validateDateOfBirth(input.dateOfBirth);
    const age = calculateAge(dateOfBirth);
    if (age < 13) throw new TRPCError({ code: "BAD_REQUEST", message: "You must be at least 13 years old to create an account." });
    // Universal human-liveness verification is handled by humanVerificationRouter.
    // Keep the legacy field false so adult users are not sent into identity-face verification.
    const faceVerificationRequired = false;
    return {
      age,
      ageVerified: true,
      faceVerificationRequired,
      message: faceVerificationRequired ? "Age verified. Human face verification is required for adults." : "Age verified successfully.",
    };
  }),

  submitAgeVerification: protectedProcedure.input(ageInput).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const dateOfBirth = validateDateOfBirth(input.dateOfBirth);
    const age = calculateAge(dateOfBirth);
    if (age < 13) throw new TRPCError({ code: "BAD_REQUEST", message: "You must be at least 13 years old to create an account." });
    // Universal human-liveness verification is handled by humanVerificationRouter.
    // Keep the legacy field false so adult users are not sent into identity-face verification.
    const faceVerificationRequired = false;

    const result = await db.insert(ageVerificationRecords).values({
      userId: ctx.user.id,
      dateOfBirth,
      age,
      verificationMethod: input.verificationMethod,
      status: "approved",
    });
    await db.update(users).set({
      dateOfBirth,
      age,
      ageVerified: true,
      ageVerificationAt: new Date(),
      faceVerificationRequired,
      faceVerificationStatus: faceVerificationRequired ? "pending" : "not_required",
    }).where(eq(users.id, ctx.user.id));

    return {
      success: true,
      recordId: Number(result[0].insertId),
      age,
      ageVerified: true,
      faceVerificationRequired,
      message: "Age verified. Complete human-liveness verification to activate your account.",
    };
  }),

  getAgeVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    return {
      userId: user.id,
      age: user.age,
      dateOfBirth: user.dateOfBirth,
      ageVerified: user.ageVerified,
      ageVerificationAt: user.ageVerificationAt,
      faceVerificationRequired: user.faceVerificationRequired,
      faceVerified: user.faceVerified,
      faceVerificationStatus: user.faceVerificationStatus,
      accountActive: user.ageVerified && user.livenessVerified,
      livenessVerified: user.livenessVerified,
    };
  }),

  getAgeVerificationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(ageVerificationRecords)
      .where(eq(ageVerificationRecords.userId, ctx.user.id))
      .orderBy(desc(ageVerificationRecords.createdAt));
  }),

  submitFaceVerification: protectedProcedure
    .input(z.object({ imageUrl: z.string().url(), verificationProvider: z.string().min(1).max(50).default("manual_review") }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      if (!user.faceVerificationRequired) throw new TRPCError({ code: "BAD_REQUEST", message: "Face verification is not required for this account." });
      if (!user.ageVerified) throw new TRPCError({ code: "BAD_REQUEST", message: "Please verify your age first." });

      const result = await db.insert(faceVerificationRecords).values({
        userId: ctx.user.id,
        imageUrl: input.imageUrl,
        verificationProvider: input.verificationProvider,
        status: "pending",
        metadata: { submittedAt: new Date().toISOString() },
      });
      await db.update(users).set({ faceVerificationImageUrl: input.imageUrl, faceVerificationStatus: "pending" })
        .where(eq(users.id, ctx.user.id));
      return { success: true, recordId: Number(result[0].insertId), status: "pending", message: "Face verification submitted for review." };
    }),

  getFaceVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    if (!user.faceVerificationRequired) return { required: false, message: "Face verification is not required for this account." };
    const [latest] = await db.select().from(faceVerificationRecords)
      .where(eq(faceVerificationRecords.userId, ctx.user.id))
      .orderBy(desc(faceVerificationRecords.createdAt)).limit(1);
    return {
      required: true,
      verified: user.faceVerified,
      status: user.faceVerificationStatus,
      lastSubmittedAt: latest?.createdAt ?? null,
      rejectionReason: latest?.rejectionReason ?? null,
      message: user.faceVerified ? "Face verification completed." : "Face verification is pending review.",
    };
  }),

  getFaceVerificationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(faceVerificationRecords)
      .where(eq(faceVerificationRecords.userId, ctx.user.id))
      .orderBy(desc(faceVerificationRecords.createdAt));
  }),

  isAccountActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    const isActive = user.ageVerified && (!user.faceVerificationRequired || user.faceVerified);
    return {
      isActive,
      age: user.age,
      ageVerified: user.ageVerified,
      faceVerificationRequired: user.faceVerificationRequired,
      faceVerified: user.faceVerified,
      reason: isActive ? "Account is active." : user.ageVerified ? "Human face verification is required." : "Age verification is required.",
    };
  }),

  retryFaceVerification: protectedProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
      if (user.faceVerificationStatus !== "rejected") throw new TRPCError({ code: "BAD_REQUEST", message: "Retry is available only after rejection." });
      const result = await db.insert(faceVerificationRecords).values({
        userId: ctx.user.id,
        imageUrl: input.imageUrl,
        verificationProvider: "manual_review",
        status: "pending",
      });
      await db.update(users).set({ faceVerificationImageUrl: input.imageUrl, faceVerificationStatus: "pending" })
        .where(eq(users.id, ctx.user.id));
      return { success: true, recordId: Number(result[0].insertId), status: "pending", message: "Face verification resubmitted for review." };
    }),
});
