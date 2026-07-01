import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { polls, pollOptions } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

export const pollsRouter = router({
  // Create a poll
  createPoll: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        question: z.string().min(1).max(255),
        options: z.array(z.string()).min(2).max(4),
        expiresAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(polls).values({
        postId: input.postId,
        userId: ctx.user.id,
        question: input.question,
        expiresAt: input.expiresAt,
      });

      const pollId = Number(result[0].insertId);
      
      // Create poll options
      for (const option of input.options) {
        await db.insert(pollOptions).values({
          pollId,
          text: option,
          votes: 0,
        });
      }

      const poll = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
      return poll[0] || null;
    }),

  // Get poll details
  getPoll: publicProcedure
    .input(z.object({ pollId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(polls).where(eq(polls.id, input.pollId)).limit(1);
      return result[0] || null;
    }),

  // Get poll options
  getPollOptions: publicProcedure
    .input(z.object({ pollId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(pollOptions).where(eq(pollOptions.pollId, input.pollId));
    }),

  // Vote on poll
  votePoll: protectedProcedure
    .input(z.object({ optionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const option = await db.select().from(pollOptions).where(eq(pollOptions.id, input.optionId)).limit(1);
      if (option[0]) {
        await db.update(pollOptions).set({ votes: option[0].votes + 1 }).where(eq(pollOptions.id, input.optionId));
      }

      return { success: true };
    }),

  // Get polls by post
  getPollsByPost: publicProcedure
    .input(z.object({ postId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(polls).where(eq(polls.postId, input.postId));
    }),
});
