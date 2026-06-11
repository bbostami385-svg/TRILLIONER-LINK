import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { arFilters } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";

export const arFiltersRouter = router({
  // Create AR filter
  createARFilter: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        filterUrl: z.string(),
        thumbnail: z.string().optional(),
        isPublic: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(arFilters).values({
        name: input.name,
        creatorId: ctx.user.id,
        filterUrl: input.filterUrl,
        thumbnail: input.thumbnail,
        uses: 0,
        likes: 0,
        isPublic: input.isPublic,
      });

      const filterId = Number(result[0].insertId);
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, filterId)).limit(1);
      return filter[0] || null;
    }),

  // Get AR filter
  getARFilter: publicProcedure
    .input(z.object({ filterId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      return result[0] || null;
    }),

  // Get trending AR filters
  getTrendingARFilters: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(arFilters).where(eq(arFilters.isPublic, true)).orderBy(desc(arFilters.uses)).limit(input.limit);
    }),

  // Get creator's filters
  getCreatorFilters: publicProcedure
    .input(z.object({ creatorId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(arFilters).where(eq(arFilters.creatorId, input.creatorId));
    }),

  // Like AR filter
  likeARFilter: protectedProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      if (filter[0]) {
        await db.update(arFilters).set({ likes: filter[0].likes + 1 }).where(eq(arFilters.id, input.filterId));
      }

      return { success: true };
    }),

  // Unlike AR filter
  unlikeARFilter: protectedProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      if (filter[0] && filter[0].likes > 0) {
        await db.update(arFilters).set({ likes: filter[0].likes - 1 }).where(eq(arFilters.id, input.filterId));
      }

      return { success: true };
    }),

  // Increment uses
  incrementUses: publicProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      if (filter[0]) {
        await db.update(arFilters).set({ uses: filter[0].uses + 1 }).where(eq(arFilters.id, input.filterId));
      }

      return { success: true };
    }),

  // Update AR filter
  updateARFilter: protectedProcedure
    .input(
      z.object({
        filterId: z.number(),
        name: z.string().optional(),
        thumbnail: z.string().optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      if (!filter[0] || filter[0].creatorId !== ctx.user.id) {
        throw new Error("Filter not found or not owned by user");
      }

      await db
        .update(arFilters)
        .set({
          name: input.name,
          thumbnail: input.thumbnail,
          isPublic: input.isPublic,
        })
        .where(eq(arFilters.id, input.filterId));

      const updated = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      return updated[0] || null;
    }),

  // Delete AR filter
  deleteARFilter: protectedProcedure
    .input(z.object({ filterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const filter = await db.select().from(arFilters).where(eq(arFilters.id, input.filterId)).limit(1);
      if (!filter[0] || filter[0].creatorId !== ctx.user.id) {
        throw new Error("Filter not found or not owned by user");
      }

      await db.delete(arFilters).where(eq(arFilters.id, input.filterId));
      return { success: true };
    }),
});
