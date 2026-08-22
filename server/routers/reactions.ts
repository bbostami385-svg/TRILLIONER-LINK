import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getRequiredDb } from "../db";
import { reactions } from "../../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";

const reactionTypes = ["heart", "laugh", "sad", "angry", "wow"] as const;
type ReactionType = (typeof reactionTypes)[number];

const emojiToType: Record<string, ReactionType> = {
  "❤️": "heart",
  "😘": "heart",
  "🤔": "wow",
  "🤣": "laugh",
  "😂": "laugh",
  "😡": "angry",
  "😱": "wow",
  "🥵": "wow",
  "🥶": "sad",
  "🤢": "sad",
  "👍": "heart",
  "👎": "sad",
  "🔥": "heart",
  "💯": "heart",
  "😍": "heart",
  "🤩": "wow",
  "😎": "wow",
  "🥳": "laugh",
  "💪": "heart",
  "🙌": "heart",
  "👏": "heart",
  "🎉": "laugh",
  "✨": "wow",
  "🚀": "wow",
  "💖": "heart",
  "⭐": "wow",
  "🌟": "wow",
};

const typeToEmoji: Record<ReactionType, string> = {
  heart: "❤️",
  laugh: "😂",
  sad: "🥶",
  angry: "😡",
  wow: "🤩",
};

const reactionInput = z.object({
  postId: z.coerce.number().int().positive(),
  emoji: z.string().min(1).max(8),
});

function getReactionType(emoji: string): ReactionType {
  return emojiToType[emoji] ?? "heart";
}

export const reactionsRouter = router({
  addReaction: protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const type = getReactionType(input.emoji);

      await db
        .delete(reactions)
        .where(
          and(eq(reactions.userId, ctx.user.id), eq(reactions.postId, input.postId))
        );

      await db.insert(reactions).values({
        userId: ctx.user.id,
        postId: input.postId,
        type,
      });

      const [reaction] = await db
        .select()
        .from(reactions)
        .where(
          and(
            eq(reactions.userId, ctx.user.id),
            eq(reactions.postId, input.postId),
            eq(reactions.type, type)
          )
        )
        .orderBy(desc(reactions.createdAt))
        .limit(1);

      return reaction ? { ...reaction, emoji: typeToEmoji[reaction.type] } : null;
    }),

  removeReaction: protectedProcedure
    .input(reactionInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db
        .delete(reactions)
        .where(
          and(
            eq(reactions.userId, ctx.user.id),
            eq(reactions.postId, input.postId),
            eq(reactions.type, getReactionType(input.emoji))
          )
        );
      return { success: true };
    }),

  getPostReactions: protectedProcedure
    .input(z.object({ postId: z.coerce.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const postReactions = await db
        .select({ type: reactions.type })
        .from(reactions)
        .where(eq(reactions.postId, input.postId));

      const grouped = new Map<ReactionType, number>();
      postReactions.forEach((reaction) => {
        grouped.set(reaction.type, (grouped.get(reaction.type) ?? 0) + 1);
      });

      return Array.from(grouped.entries()).map(([type, count]) => ({
        emoji: typeToEmoji[type],
        count,
      }));
    }),

  getUserReaction: protectedProcedure
    .input(z.object({ postId: z.coerce.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [userReaction] = await db
        .select()
        .from(reactions)
        .where(
          and(eq(reactions.userId, ctx.user.id), eq(reactions.postId, input.postId))
        )
        .orderBy(desc(reactions.createdAt))
        .limit(1);

      return userReaction ? { ...userReaction, emoji: typeToEmoji[userReaction.type] } : null;
    }),
});
