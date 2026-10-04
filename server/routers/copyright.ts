import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { copyrightClaims, videoProtectionSettings, videos } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";

const claimType = z.enum(["copyright", "unauthorized_reupload", "privacy_screenshot", "privacy_recording", "privacy_call_capture"]);
const claimStatus = z.enum(["pending", "under_review", "actioned", "rejected"]);

async function getVideo(videoId: number) {
  const db = await getRequiredDb();
  const [video] = await db.select({ id: videos.id, userId: videos.userId, isPublic: videos.isPublic }).from(videos).where(eq(videos.id, videoId)).limit(1);
  return video;
}

export const copyrightRouter = router({
  getProtection: publicProcedure
    .input(z.object({ videoId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const [settings] = await db.select().from(videoProtectionSettings).where(eq(videoProtectionSettings.videoId, input.videoId)).limit(1);
      return settings ?? { videoId: input.videoId, ownerId: null, allowDownload: false, watermarkEnabled: true, watermarkText: null, screenshotRecordingNotice: true };
    }),

  updateProtection: protectedProcedure
    .input(z.object({
      videoId: z.number().int().positive(),
      allowDownload: z.boolean().default(false),
      watermarkEnabled: z.boolean().default(true),
      watermarkText: z.string().trim().max(160).optional(),
      screenshotRecordingNotice: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const video = await getVideo(input.videoId);
      if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found." });
      if (video.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the original uploader can change video protection." });
      const db = await getRequiredDb();
      const [existing] = await db.select({ id: videoProtectionSettings.id }).from(videoProtectionSettings).where(eq(videoProtectionSettings.videoId, input.videoId)).limit(1);
      const values = { videoId: input.videoId, ownerId: ctx.user.id, allowDownload: input.allowDownload, watermarkEnabled: input.watermarkEnabled, watermarkText: input.watermarkText || null, screenshotRecordingNotice: input.screenshotRecordingNotice };
      if (existing) await db.update(videoProtectionSettings).set(values).where(eq(videoProtectionSettings.id, existing.id));
      else await db.insert(videoProtectionSettings).values(values);
      return { success: true, ...values };
    }),

  submitClaim: protectedProcedure
    .input(z.object({
      targetVideoId: z.number().int().positive().optional(),
      claimType,
      originalWorkUrl: z.string().url().optional(),
      evidenceUrl: z.string().url().optional(),
      description: z.string().trim().min(20).max(4000),
      contactEmail: z.string().email(),
      attestedOwnership: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      if ((input.claimType === "copyright" || input.claimType === "unauthorized_reupload") && !input.attestedOwnership) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Copyright claims require an ownership attestation." });
      }
      if (input.targetVideoId) {
        const video = await getVideo(input.targetVideoId);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "The reported video was not found." });
        if (video.userId === ctx.user.id && input.claimType !== "privacy_screenshot" && input.claimType !== "privacy_recording" && input.claimType !== "privacy_call_capture") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot submit a copyright re-upload claim against your own video." });
        }
      }
      const db = await getRequiredDb();
      const [duplicate] = await db.select({ id: copyrightClaims.id }).from(copyrightClaims).where(and(eq(copyrightClaims.claimantId, ctx.user.id), input.targetVideoId ? eq(copyrightClaims.targetVideoId, input.targetVideoId) : eq(copyrightClaims.claimantId, ctx.user.id), eq(copyrightClaims.claimType, input.claimType), eq(copyrightClaims.status, "pending"))).limit(1);
      if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "You already have a pending claim of this type for this video." });
      const [created] = await db.insert(copyrightClaims).values({ ...input, claimantId: ctx.user.id, targetVideoId: input.targetVideoId ?? null, originalWorkUrl: input.originalWorkUrl ?? null, evidenceUrl: input.evidenceUrl ?? null }).$returningId();
      return { success: true, claimId: created.id, status: "pending" as const };
    }),

  listMyClaims: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(copyrightClaims).where(eq(copyrightClaims.claimantId, ctx.user.id)).orderBy(desc(copyrightClaims.createdAt)).limit(50);
  }),

  admin: router({
    listClaims: adminProcedure.input(z.object({ status: claimStatus.optional(), limit: z.number().int().min(1).max(100).default(50) })).query(async ({ input }) => {
      const db = await getRequiredDb();
      return db.select().from(copyrightClaims).where(input.status ? eq(copyrightClaims.status, input.status) : undefined).orderBy(desc(copyrightClaims.createdAt)).limit(input.limit);
    }),
    resolveClaim: adminProcedure.input(z.object({ claimId: z.number().int().positive(), status: z.enum(["actioned", "rejected"]), resolutionNote: z.string().trim().min(5).max(2000) })).mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [claim] = await db.select().from(copyrightClaims).where(eq(copyrightClaims.id, input.claimId)).limit(1);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND", message: "Copyright claim not found." });
      await db.update(copyrightClaims).set({ status: input.status, reviewerId: ctx.user.id, resolutionNote: input.resolutionNote, resolvedAt: new Date() }).where(eq(copyrightClaims.id, input.claimId));
      if (input.status === "actioned" && claim.targetVideoId) await db.update(videos).set({ isPublic: false }).where(eq(videos.id, claim.targetVideoId));
      return { success: true, status: input.status, hiddenTargetVideo: input.status === "actioned" && Boolean(claim.targetVideoId) };
    }),
  }),
});
