import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { messages } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const messageFeaturesRouter = router({
  // Edit message
  editMessage: protectedProcedure
    .input(z.object({ messageId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(messages)
        .set({ content: input.content, edited: true })
        .where(eq(messages.id, input.messageId))
        .returning();
      return updated;
    }),

  // Delete message
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(messages).where(eq(messages.id, input.messageId));
      return { success: true };
    }),

  // Pin message
  pinMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(messages)
        .set({ pinned: true })
        .where(eq(messages.id, input.messageId))
        .returning();
      return updated;
    }),

  // React to message
  reactToMessage: protectedProcedure
    .input(z.object({ messageId: z.string(), emoji: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await db
        .update(messages)
        .set({ reactions: [input.emoji] })
        .where(eq(messages.id, input.messageId))
        .returning();
      return updated;
    }),
});
