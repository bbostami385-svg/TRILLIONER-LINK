import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, kycDocuments, kycVerificationRecords } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const kycRouter = router({
  /**
   * Submit KYC documents
   * Required for monetization features
   */
  submitKYCDocument: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["passport", "driver_license", "national_id", "other"]),
        frontImageUrl: z.string().url(),
        backImageUrl: z.string().url().optional(),
        selfieImageUrl: z.string().url(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Check if user already has pending KYC
      const existingKYC = await db
        .select()
        .from(kycDocuments)
        .where(
          and(
            eq(kycDocuments.userId, ctx.user.id),
            eq(kycDocuments.status, "pending")
          )
        )
        .limit(1);

      if (existingKYC[0]) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already have a pending KYC submission. Please wait for review.",
        });
      }

      // Create KYC document record
      const document = await db
        .insert(kycDocuments)
        .values({
          userId: ctx.user.id,
          documentType: input.documentType,
          frontImageUrl: input.frontImageUrl,
          backImageUrl: input.backImageUrl,
          selfieImageUrl: input.selfieImageUrl,
          status: "pending",
          metadata: input.metadata,
        })
        .returning();

      // Create verification record
      await db
        .insert(kycVerificationRecords)
        .values({
          userId: ctx.user.id,
          documentId: document[0].id,
          status: "pending",
        });

      // Update user KYC status
      await db
        .update(users)
        .set({
          kycStatus: "pending",
          kycDocumentType: input.documentType,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        documentId: document[0].id,
        message: "KYC documents submitted successfully. Please wait for review (usually 24-48 hours).",
      };
    }),

  /**
   * Get KYC verification status
   */
  getKYCStatus: protectedProcedure.query(async ({ ctx }) => {
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

    // Get latest KYC document
    const latestDocument = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt])
      .limit(1);

    return {
      isVerified: userData.kycVerified,
      status: userData.kycStatus,
      documentType: userData.kycDocumentType,
      verifiedAt: userData.kycVerificationAt,
      lastDocument: latestDocument[0] || null,
      message:
        userData.kycStatus === "approved"
          ? "Your KYC is verified. You can now access monetization features."
          : userData.kycStatus === "pending"
            ? "Your KYC is under review. Please wait 24-48 hours."
            : userData.kycStatus === "rejected"
              ? "Your KYC was rejected. Please submit again with correct documents."
              : "KYC verification not started.",
    };
  }),

  /**
   * Get KYC verification history
   */
  getKYCHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const records = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt]);

    return records;
  }),

  /**
   * Admin: Approve KYC
   */
  approveKYC: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Get latest KYC document for user
      const document = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, input.userId))
        .orderBy((t) => [t.createdAt])
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No KYC document found for this user",
        });
      }

      // Update document status
      await db
        .update(kycDocuments)
        .set({ status: "approved" })
        .where(eq(kycDocuments.id, document[0].id));

      // Update verification record
      await db
        .update(kycVerificationRecords)
        .set({
          status: "approved",
          reviewedBy: ctx.user.id,
          notes: input.notes,
        })
        .where(eq(kycVerificationRecords.documentId, document[0].id));

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: true,
          kycStatus: "approved",
          kycVerificationAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: `KYC approved for user ${input.userId}`,
      };
    }),

  /**
   * Admin: Reject KYC
   */
  rejectKYC: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        rejectionReason: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Get latest KYC document for user
      const document = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, input.userId))
        .orderBy((t) => [t.createdAt])
        .limit(1);

      if (!document[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No KYC document found for this user",
        });
      }

      // Update document status
      await db
        .update(kycDocuments)
        .set({
          status: "rejected",
          rejectionReason: input.rejectionReason,
        })
        .where(eq(kycDocuments.id, document[0].id));

      // Update verification record
      await db
        .update(kycVerificationRecords)
        .set({
          status: "rejected",
          reviewedBy: ctx.user.id,
          rejectionReason: input.rejectionReason,
          notes: input.notes,
        })
        .where(eq(kycVerificationRecords.documentId, document[0].id));

      // Update user
      await db
        .update(users)
        .set({
          kycStatus: "rejected",
        })
        .where(eq(users.id, input.userId));

      return {
        success: true,
        message: `KYC rejected for user ${input.userId}. User can resubmit.`,
      };
    }),

  /**
   * Retry KYC submission after rejection
   */
  retryKYCSubmission: protectedProcedure
    .input(
      z.object({
        documentType: z.enum(["passport", "driver_license", "national_id", "other"]),
        frontImageUrl: z.string().url(),
        backImageUrl: z.string().url().optional(),
        selfieImageUrl: z.string().url(),
        metadata: z.record(z.any()).optional(),
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

      if (user[0].kycStatus !== "rejected") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You can only retry if your previous KYC was rejected.",
        });
      }

      // Create new KYC document
      const document = await db
        .insert(kycDocuments)
        .values({
          userId: ctx.user.id,
          documentType: input.documentType,
          frontImageUrl: input.frontImageUrl,
          backImageUrl: input.backImageUrl,
          selfieImageUrl: input.selfieImageUrl,
          status: "pending",
          metadata: input.metadata,
        })
        .returning();

      // Create verification record
      await db
        .insert(kycVerificationRecords)
        .values({
          userId: ctx.user.id,
          documentId: document[0].id,
          status: "pending",
        });

      // Update user status
      await db
        .update(users)
        .set({
          kycStatus: "pending",
          kycDocumentType: input.documentType,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        documentId: document[0].id,
        message: "KYC resubmitted successfully. Please wait for review.",
      };
    }),

  /**
   * Get pending KYC submissions for admin review
   */
  getPendingKYCSubmissions: adminProcedure
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const documents = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"))
        .orderBy((t) => [t.createdAt])
        .limit(input.limit)
        .offset(input.offset);

      const total = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"));

      return {
        documents,
        total: total.length,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Check if user can access monetization features
   */
  canAccessMonetization: protectedProcedure.query(async ({ ctx }) => {
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

    const canAccess = user[0].kycVerified && user[0].livenessVerified;

    return {
      canAccess,
      kycVerified: user[0].kycVerified,
      livenessVerified: user[0].livenessVerified,
      message: canAccess
        ? "You can access monetization features."
        : "You need to complete KYC and liveness verification to access monetization features.",
    };
  }),
});
