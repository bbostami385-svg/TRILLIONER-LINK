import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { playlists, playlistItems, videos } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const playlistsRouter = router({
  // Create playlist
  create: protectedProcedure
    .input(z.object({ name: z.string(), description: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [playlist] = await db
        .insert(playlists)
        .values({
          userId: ctx.user.id,
          name: input.name,
          description: input.description || "",
          isPublic: false,
        })
        .returning();
      return playlist;
    }),

  // Get user playlists
  getUserPlaylists: protectedProcedure.query(async ({ ctx }) => {
    return await db
      .select()
      .from(playlists)
      .where(eq(playlists.userId, ctx.user.id));
  }),

  // Add video to playlist
  addVideo: protectedProcedure
    .input(z.object({ playlistId: z.string(), videoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [item] = await db
        .insert(playlistItems)
        .values({
          playlistId: input.playlistId,
          videoId: input.videoId,
          order: 1,
        })
        .returning();
      return item;
    }),

  // Get playlist videos
  getVideos: publicProcedure
    .input(z.object({ playlistId: z.string() }))
    .query(async ({ input }) => {
      return await db
        .select()
        .from(playlistItems)
        .where(eq(playlistItems.playlistId, input.playlistId));
    }),

  // Delete playlist
  delete: protectedProcedure
    .input(z.object({ playlistId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(playlists)
        .where(
          and(
            eq(playlists.id, input.playlistId),
            eq(playlists.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});
