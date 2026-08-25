import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { polls, pollOptions } from "../../drizzle/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
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

  getRecentPolls: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const recent = await db.select().from(polls).orderBy(desc(polls.createdAt)).limit(input.limit);
      if (!recent.length) return [];
      const options = await db.select().from(pollOptions).where(inArray(pollOptions.pollId, recent.map((poll) => poll.id)));
      return recent.map((poll) => ({ ...poll, options: options.filter((option) => option.pollId === poll.id) }));
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
      
      const [option] = await db.select({ id: pollOptions.id, votes: pollOptions.votes, expiresAt: polls.expiresAt })
        .from(pollOptions)
        .innerJoin(polls, eq(pollOptions.pollId, polls.id))
        .where(eq(pollOptions.id, input.optionId))
        .limit(1);
      if (!option) throw new TRPCError({ code: "NOT_FOUND", message: "Poll option not found." });
      if (option.expiresAt && option.expiresAt.getTime() <= Date.now()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This poll is closed." });
      await db.update(pollOptions).set({ votes: option.votes + 1 }).where(and(eq(pollOptions.id, input.optionId), eq(pollOptions.votes, option.votes)));
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
