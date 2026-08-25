import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { stories } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import {
  createStory,
  getStoriesByUserId,
  getFollowingStories,
  incrementStoryViews,
} from "../db";

export const isValidStoryShareSource = (mediaType: "image" | "video", sourceType: "video" | "reel") => mediaType === "video" && (sourceType === "video" || sourceType === "reel");

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

  shareToStory: protectedProcedure
    .input(z.object({ mediaUrl: z.string().url(), mediaType: z.literal("video"), caption: z.string().max(500).optional(), sourceType: z.enum(["video", "reel"]), sourceId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (!isValidStoryShareSource(input.mediaType, input.sourceType)) throw new Error("Only supported video media can be shared to Stories");
      const story = await createStory(ctx.user.id, input.mediaUrl, input.mediaType, input.caption);
      if (!story) throw new Error("Failed to share this media to your Story");
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(stories).set({ sharedSourceType: input.sourceType, sharedSourceId: input.sourceId }).where(eq(stories.id, story.id));
      return { ...story, sharedSourceType: input.sourceType, sharedSourceId: input.sourceId };
    }),

  // View story (increment views)
  viewStory: publicProcedure
    .input(z.object({ storyId: z.number() }))
    .mutation(async ({ input }) => {
      await incrementStoryViews(input.storyId);
      return { success: true };
    }),
});
