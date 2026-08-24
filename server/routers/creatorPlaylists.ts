import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { collections, savedItems, users, videos } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

async function assertCreator(db: Awaited<ReturnType<typeof getRequiredDb>>, userId: number) {
  const [user] = await db.select({ accountMode: users.accountMode }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.accountMode !== "creator") throw new Error("Creator mode is required to manage playlists.");
}

export const creatorPlaylistsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    await assertCreator(db, ctx.user.id);
    return db.select().from(collections).where(eq(collections.userId, ctx.user.id)).orderBy(desc(collections.updatedAt));
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(255), description: z.string().trim().max(2000).optional(), isPublic: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [created] = await db.insert(collections).values({ userId: ctx.user.id, name: input.name, description: input.description || null, isPublic: input.isPublic }).$returningId();
      const [playlist] = await db.select().from(collections).where(eq(collections.id, created.id)).limit(1);
      return playlist;
    }),

  update: protectedProcedure
    .input(z.object({ playlistId: z.number().int().positive(), name: z.string().trim().min(1).max(255).optional(), description: z.string().trim().max(2000).optional(), isPublic: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [playlist] = await db.select().from(collections).where(and(eq(collections.id, input.playlistId), eq(collections.userId, ctx.user.id))).limit(1);
      if (!playlist) throw new Error("Playlist not found.");
      await db.update(collections).set({ name: input.name ?? playlist.name, description: input.description ?? playlist.description, isPublic: input.isPublic ?? playlist.isPublic }).where(eq(collections.id, input.playlistId));
      const [updated] = await db.select().from(collections).where(eq(collections.id, input.playlistId)).limit(1);
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ playlistId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [playlist] = await db.select({ id: collections.id }).from(collections).where(and(eq(collections.id, input.playlistId), eq(collections.userId, ctx.user.id))).limit(1);
      if (!playlist) throw new Error("Playlist not found.");
      await db.delete(savedItems).where(eq(savedItems.collectionId, input.playlistId));
      await db.delete(collections).where(eq(collections.id, input.playlistId));
      return { success: true } as const;
    }),

  items: protectedProcedure
    .input(z.object({ playlistId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [playlist] = await db.select({ id: collections.id, isPublic: collections.isPublic, userId: collections.userId }).from(collections).where(eq(collections.id, input.playlistId)).limit(1);
      if (!playlist || (playlist.userId !== ctx.user.id && !playlist.isPublic)) throw new Error("Playlist not found.");
      return db.select({ itemId: savedItems.id, videoId: videos.id, title: videos.title, description: videos.description, thumbnailUrl: videos.thumbnailUrl, views: videos.views, duration: videos.duration, savedAt: savedItems.savedAt }).from(savedItems).innerJoin(videos, eq(videos.id, savedItems.videoId)).where(and(eq(savedItems.collectionId, input.playlistId), eq(videos.isPublic, true))).orderBy(desc(savedItems.savedAt));
    }),

  publicItems: publicProcedure
    .input(z.object({ playlistId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getRequiredDb();
      const [playlist] = await db.select({ id: collections.id, name: collections.name, description: collections.description, isPublic: collections.isPublic }).from(collections).where(and(eq(collections.id, input.playlistId), eq(collections.isPublic, true))).limit(1);
      if (!playlist) throw new Error("Public playlist not found.");
      const playlistItems = await db.select({ itemId: savedItems.id, videoId: videos.id, title: videos.title, description: videos.description, thumbnailUrl: videos.thumbnailUrl, views: videos.views, duration: videos.duration, savedAt: savedItems.savedAt }).from(savedItems).innerJoin(videos, eq(videos.id, savedItems.videoId)).where(and(eq(savedItems.collectionId, input.playlistId), eq(videos.isPublic, true))).orderBy(desc(savedItems.savedAt));
      return { ...playlist, items: playlistItems };
    }),

  addVideo: protectedProcedure
    .input(z.object({ playlistId: z.number().int().positive(), videoId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [playlist] = await db.select({ id: collections.id }).from(collections).where(and(eq(collections.id, input.playlistId), eq(collections.userId, ctx.user.id))).limit(1);
      if (!playlist) throw new Error("Playlist not found.");
      const [video] = await db.select({ id: videos.id, isPublic: videos.isPublic, userId: videos.userId }).from(videos).where(eq(videos.id, input.videoId)).limit(1);
      if (!video || (!video.isPublic && video.userId !== ctx.user.id)) throw new Error("Only a public video or your own draft can be added.");
      const [existing] = await db.select({ id: savedItems.id }).from(savedItems).where(and(eq(savedItems.collectionId, input.playlistId), eq(savedItems.videoId, input.videoId))).limit(1);
      if (existing) return { success: true, alreadyAdded: true } as const;
      await db.insert(savedItems).values({ collectionId: input.playlistId, videoId: input.videoId });
      return { success: true, alreadyAdded: false } as const;
    }),

  removeItem: protectedProcedure
    .input(z.object({ itemId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await assertCreator(db, ctx.user.id);
      const [item] = await db.select({ id: savedItems.id }).from(savedItems).innerJoin(collections, eq(collections.id, savedItems.collectionId)).where(and(eq(savedItems.id, input.itemId), eq(collections.userId, ctx.user.id))).limit(1);
      if (!item) throw new Error("Playlist item not found.");
      await db.delete(savedItems).where(eq(savedItems.id, input.itemId));
      return { success: true } as const;
    }),
});
