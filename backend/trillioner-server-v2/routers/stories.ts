import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createStory,
  getStoriesByUserId,
  getFollowingStories,
  incrementStoryViews,
} from "../db";

export const storiesRouter = router({
  // Get stories by user
  getUserStories: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return await getStoriesByUserId(input.userId);
    }),

  // Get stories from following users
  getFollowingStories: protectedProcedure.query(async ({ ctx }) => {
    return await getFollowingStories(ctx.user.id);
  }),

  // Create story (protected)
  createStory: protectedProcedure
    .input(
      z.object({
        mediaUrl: z.string().url(),
        mediaType: z.enum(["image", "video"]),
        caption: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const story = await createStory(
        ctx.user.id,
        input.mediaUrl,
        input.mediaType,
        input.caption
      );

      if (!story) {
        throw new Error("Failed to create story");
      }

      return story;
    }),

  // View story (increment views)
  viewStory: publicProcedure
    .input(z.object({ storyId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementStoryViews(input.storyId);
      return { success: true };
    }),
});
