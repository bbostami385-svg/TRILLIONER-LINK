import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { collections, savedItems, posts, videos, reels } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";

export const collectionsRouter = router({
  // Create collection
  createCollection: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        isPublic: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(collections).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        isPublic: input.isPublic,
      });

      const collectionId = Number(result[0].insertId);
      const collection = await db.select().from(collections).where(eq(collections.id, collectionId)).limit(1);
      return collection[0] || null;
    }),

  // Get collection
  getCollection: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(collections).where(eq(collections.id, input.collectionId)).limit(1);
      return result[0] || null;
    }),

  // Get user's collections
  getUserCollections: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(collections).where(eq(collections.userId, input.userId));
    }),

  // Save item to collection
  saveItem: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        postId: z.number().optional(),
        videoId: z.number().optional(),
        reelId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Verify collection belongs to user
      const collection = await db.select().from(collections).where(eq(collections.id, input.collectionId)).limit(1);
      if (!collection[0] || collection[0].userId !== ctx.user.id) {
        throw new Error("Collection not found or not owned by user");
      }

      await db.insert(savedItems).values({
        collectionId: input.collectionId,
        postId: input.postId,
        videoId: input.videoId,
        reelId: input.reelId,
      });

      return { success: true };
    }),

  // Remove item from collection
  removeItem: protectedProcedure
    .input(z.object({ itemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(savedItems).where(eq(savedItems.id, input.itemId));
      return { success: true };
    }),

  // Get collection items
  getCollectionItems: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(savedItems).where(eq(savedItems.collectionId, input.collectionId));
    }),

  // Update collection
  updateCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const collection = await db.select().from(collections).where(eq(collections.id, input.collectionId)).limit(1);
      if (!collection[0] || collection[0].userId !== ctx.user.id) {
        throw new Error("Collection not found or not owned by user");
      }

      await db
        .update(collections)
        .set({
          name: input.name,
          description: input.description,
          isPublic: input.isPublic,
        })
        .where(eq(collections.id, input.collectionId));

      const updated = await db.select().from(collections).where(eq(collections.id, input.collectionId)).limit(1);
      return updated[0] || null;
    }),

  // Delete collection
  deleteCollection: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const collection = await db.select().from(collections).where(eq(collections.id, input.collectionId)).limit(1);
      if (!collection[0] || collection[0].userId !== ctx.user.id) {
        throw new Error("Collection not found or not owned by user");
      }

      await db.delete(collections).where(eq(collections.id, input.collectionId));
      return { success: true };
    }),
});
