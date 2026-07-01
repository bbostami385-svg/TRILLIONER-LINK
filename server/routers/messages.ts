import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createMessage,
  getMessagesByConversation,
  getOrCreateConversation,
  getUserConversations,
  getDb,
} from "../db";
import { conversations } from "../../drizzle/schema";

export const messagesRouter = router({
  // Get all conversations for the current user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await getUserConversations(ctx.user.id);
    return conversations;
  }),

  // Get or create a conversation with another user
  getOrCreateConversation: protectedProcedure
    .input(z.object({ otherUserId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.otherUserId === ctx.user.id) {
        throw new Error("Cannot create conversation with yourself");
      }

      const conversation = await getOrCreateConversation(
        ctx.user.id,
        input.otherUserId
      );

      if (!conversation) {
        throw new Error("Failed to create conversation");
      }

      return conversation;
    }),

  // Get messages in a conversation
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Verify user is part of the conversation
      const convo = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!convo.length) {
        throw new Error("Conversation not found");
      }

      const conv = convo[0];
      if (
        ctx.user.id !== conv.participant1Id &&
        ctx.user.id !== conv.participant2Id
      ) {
        throw new Error("Unauthorized: You are not part of this conversation");
      }

      const messages = await getMessagesByConversation(
        input.conversationId,
        input.limit
      );
      return messages;
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(5000),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Verify user is part of the conversation
      const convo = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!convo.length) {
        throw new Error("Conversation not found");
      }

      const conv = convo[0];
      if (
        ctx.user.id !== conv.participant1Id &&
        ctx.user.id !== conv.participant2Id
      ) {
        throw new Error("Unauthorized: You are not part of this conversation");
      }

      const message = await createMessage(
        input.conversationId,
        ctx.user.id,
        input.content,
        input.imageUrl
      );

      if (!message) {
        throw new Error("Failed to send message");
      }

      return message;
    }),
});
