import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { videoCalls, videoCallParticipants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const videoCallsRouter = router({
  // Initiate call
  initiateCall: protectedProcedure
    .input(z.object({ recipientId: z.string(), isGroupCall: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [call] = await db
        .insert(videoCalls)
        .values({
          initiatorId: ctx.user.id,
          isGroupCall: input.isGroupCall || false,
          status: "ringing",
        })
        .returning();
      
      await db.insert(videoCallParticipants).values({
        callId: call.id,
        userId: input.recipientId,
      });
      
      return call;
    }),

  // Answer call
  answerCall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(videoCalls)
        .set({ status: "active" })
        .where(eq(videoCalls.id, input.callId))
        .returning();
      return updated;
    }),

  // End call
  endCall: protectedProcedure
    .input(z.object({ callId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(videoCalls)
        .set({ status: "ended" })
        .where(eq(videoCalls.id, input.callId))
        .returning();
      return updated;
    }),

  // Get active calls
  getActiveCalls: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(videoCalls)
      .where(eq(videoCalls.status, "active"));
  }),
});
