import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { monetization, tips } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const monetizationRouter = router({
  // Enable monetization
  enableMonetization: protectedProcedure
    .input(z.object({ bankAccount: z.string(), taxId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [monetization_record] = await db
        .insert(monetization)
        .values({
          userId: ctx.user.id,
          bankAccount: input.bankAccount,
          taxId: input.taxId,
          status: "pending",
        })
        .returning();
      return monetization_record;
    }),

  // Get monetization status
  getMonetizationStatus: protectedProcedure.query(async ({ ctx }) => {
    const [status] = await db
      .select()
      .from(monetization)
      .where(eq(monetization.userId, ctx.user.id));
    return status;
  }),

  // Send tip
  sendTip: protectedProcedure
    .input(z.object({ creatorId: z.string(), amount: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [tip] = await db
        .insert(tips)
        .values({
          senderId: ctx.user.id,
          creatorId: input.creatorId,
          amount: input.amount,
          status: "completed",
        })
        .returning();
      return tip;
    }),

  // Get tips received
  getTipsReceived: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(tips)
      .where(eq(tips.creatorId, ctx.user.id));
  }),
});
