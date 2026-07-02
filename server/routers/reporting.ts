import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { reports } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const reportingRouter = router({
  // Report content
  reportContent: protectedProcedure
    .input(
      z.object({
        contentId: z.string(),
        contentType: z.enum(["post", "comment", "video", "user"]),
        reason: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [report] = await db
        .insert(reports)
        .values({
          reporterId: ctx.user.id,
          contentId: input.contentId,
          contentType: input.contentType,
          reason: input.reason,
          description: input.description || "",
          status: "pending",
        })
        .returning();
      return report;
    }),

  // Get reports (admin only)
  getReports: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Unauthorized");
    return await db.select().from(reports);
  }),

  // Update report status
  updateReportStatus: protectedProcedure
    .input(
      z.object({
        reportId: z.string(),
        status: z.enum(["pending", "reviewing", "resolved", "dismissed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Unauthorized");
      const [updated] = await db
        .update(reports)
        .set({ status: input.status })
        .where(eq(reports.id, input.reportId))
        .returning();
      return updated;
    }),
});
