import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { persistVerificationMedia } from "../verificationMedia";
import { kycDocuments, kycVerificationRecords, users } from "../../drizzle/schema";

const documentTypeSchema = z.enum(["passport", "driver_license", "national_id", "other"]);
const metadataSchema = z.record(z.string(), z.unknown()).optional();
const documentInputSchema = z.object({
  documentType: documentTypeSchema,
  frontImageUrl: z.string().min(1).max(12_000_000),
  backImageUrl: z.string().min(1).max(12_000_000).optional(),
  selfieImageUrl: z.string().min(1).max(12_000_000),
  metadata: metadataSchema,
});

async function getLatestDocument(userId: number) {
  const db = await getRequiredDb();
  const [document] = await db
    .select()
    .from(kycDocuments)
    .where(eq(kycDocuments.userId, userId))
    .orderBy(desc(kycDocuments.createdAt))
    .limit(1);
  return document;
}

export const kycRouter = router({
  submitKYCDocument: protectedProcedure
    .input(documentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [pending] = await db
        .select({ id: kycDocuments.id })
        .from(kycDocuments)
        .where(and(eq(kycDocuments.userId, ctx.user.id), eq(kycDocuments.status, "pending")))
        .limit(1);

      if (pending) {
        throw new TRPCError({ code: "CONFLICT", message: "A KYC submission is already under review." });
      }

      const [frontImageUrl, backImageUrl, selfieImageUrl] = await Promise.all([
        persistVerificationMedia(input.frontImageUrl, `verification/kyc/${ctx.user.id}/front`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024),
        input.backImageUrl ? persistVerificationMedia(input.backImageUrl, `verification/kyc/${ctx.user.id}/back`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024) : Promise.resolve(undefined),
        persistVerificationMedia(input.selfieImageUrl, `verification/kyc/${ctx.user.id}/selfie`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024),
      ]);
      const result = await db.insert(kycDocuments).values({
        userId: ctx.user.id,
        documentType: input.documentType,
        frontImageUrl,
        backImageUrl,
        selfieImageUrl,
        status: "pending",
        metadata: input.metadata,
      });
      const documentId = Number(result[0].insertId);

      await db.insert(kycVerificationRecords).values({
        userId: ctx.user.id,
        documentId,
        status: "pending",
      });
      await db.update(users).set({
        kycStatus: "pending",
        kycDocumentType: input.documentType,
        kycVerified: false,
      }).where(eq(users.id, ctx.user.id));

      return { success: true, documentId, message: "KYC documents submitted for review." };
    }),

  getKYCStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return {
      isVerified: user.kycVerified,
      status: user.kycStatus,
      documentType: user.kycDocumentType,
      verifiedAt: user.kycVerificationAt,
      lastDocument: (await getLatestDocument(ctx.user.id)) ?? null,
    };
  }),

  getKYCHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(kycDocuments)
      .where(eq(kycDocuments.userId, ctx.user.id))
      .orderBy(desc(kycDocuments.createdAt));
  }),

  approveKYC: adminProcedure
    .input(z.object({ userId: z.number().int().positive(), notes: z.string().max(2000).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const document = await getLatestDocument(input.userId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "No KYC document found." });

      await db.update(kycDocuments).set({ status: "approved", rejectionReason: null }).where(eq(kycDocuments.id, document.id));
      await db.update(kycVerificationRecords).set({
        status: "approved",
        reviewedBy: ctx.user.id,
        rejectionReason: null,
        notes: input.notes,
      }).where(eq(kycVerificationRecords.documentId, document.id));
      await db.update(users).set({
        kycVerified: true,
        kycStatus: "approved",
        kycVerificationAt: new Date(),
      }).where(eq(users.id, input.userId));
      return { success: true, message: "KYC approved." };
    }),

  rejectKYC: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      rejectionReason: z.string().min(3).max(1000),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const document = await getLatestDocument(input.userId);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "No KYC document found." });

      await db.update(kycDocuments).set({ status: "rejected", rejectionReason: input.rejectionReason }).where(eq(kycDocuments.id, document.id));
      await db.update(kycVerificationRecords).set({
        status: "rejected",
        reviewedBy: ctx.user.id,
        rejectionReason: input.rejectionReason,
        notes: input.notes,
      }).where(eq(kycVerificationRecords.documentId, document.id));
      await db.update(users).set({ kycVerified: false, kycStatus: "rejected" }).where(eq(users.id, input.userId));
      return { success: true, message: "KYC rejected; the user may resubmit." };
    }),

  retryKYCSubmission: protectedProcedure
    .input(documentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (user.kycStatus !== "rejected") {
        throw new TRPCError({ code: "CONFLICT", message: "A retry is available only after rejection." });
      }

      const [frontImageUrl, backImageUrl, selfieImageUrl] = await Promise.all([
        persistVerificationMedia(input.frontImageUrl, `verification/kyc/${ctx.user.id}/front`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024),
        input.backImageUrl ? persistVerificationMedia(input.backImageUrl, `verification/kyc/${ctx.user.id}/back`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024) : Promise.resolve(undefined),
        persistVerificationMedia(input.selfieImageUrl, `verification/kyc/${ctx.user.id}/selfie`, ["image/jpeg", "image/png", "image/webp"], 8 * 1024 * 1024),
      ]);
      const result = await db.insert(kycDocuments).values({
        userId: ctx.user.id,
        documentType: input.documentType,
        frontImageUrl,
        backImageUrl,
        selfieImageUrl,
        status: "pending",
        metadata: input.metadata,
      });
      const documentId = Number(result[0].insertId);
      await db.insert(kycVerificationRecords).values({ userId: ctx.user.id, documentId, status: "pending" });
      await db.update(users).set({ kycStatus: "pending", kycDocumentType: input.documentType }).where(eq(users.id, ctx.user.id));
      return { success: true, documentId, message: "KYC resubmitted for review." };
    }),

  getPendingKYCSubmissions: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(10), offset: z.number().int().nonnegative().default(0) }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const documents = await db.select().from(kycDocuments)
        .where(eq(kycDocuments.status, "pending"))
        .orderBy(desc(kycDocuments.createdAt))
        .limit(input.limit)
        .offset(input.offset);
      const allPending = await db.select({ id: kycDocuments.id }).from(kycDocuments).where(eq(kycDocuments.status, "pending"));
      return { documents, total: allPending.length, limit: input.limit, offset: input.offset };
    }),

  canAccessMonetization: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db.select({ kycVerified: users.kycVerified, livenessVerified: users.livenessVerified })
      .from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return {
      canAccess: user.kycVerified && user.livenessVerified,
      kycVerified: user.kycVerified,
      livenessVerified: user.livenessVerified,
    };
  }),
});
