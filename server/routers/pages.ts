import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { pages, pageFollowers, users } from "../../drizzle/schema";
import { and, desc, eq, like } from "drizzle-orm";
import { getDb } from "../db";

export const pagesRouter = router({
  // Create a page
  createPage: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(pages).values({
        name: input.name,
        description: input.description,
        ownerId: ctx.user.id,
        followers: 1,
      });

      const pageId = Number(result[0].insertId);
      await db.insert(pageFollowers).values({ pageId, userId: ctx.user.id });
      const page = await db.select().from(pages).where(eq(pages.id, pageId)).limit(1);
      return page[0] || null;
    }),

  // Get page details
  getPage: publicProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1);
      return result[0] || null;
    }),

  // Get popular pages
  getPopularPages: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(pages).limit(input.limit);
    }),

  // Follow page with a durable, duplicate-safe user/page relationship.
  followPage: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const page = (await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1))[0];
      if (!page) throw new Error("Page not found");
      const existing = await db.select({ id: pageFollowers.id }).from(pageFollowers).where(and(
        eq(pageFollowers.pageId, input.pageId),
        eq(pageFollowers.userId, ctx.user.id),
      )).limit(1);
      if (existing[0]) return { success: false, alreadyFollowing: true };
      await db.insert(pageFollowers).values({ pageId: input.pageId, userId: ctx.user.id });
      await db.update(pages).set({ followers: page.followers + 1 }).where(eq(pages.id, input.pageId));
      return { success: true, alreadyFollowing: false };
    }),

  // Unfollow page only when the authenticated user owns the relationship.
  unfollowPage: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select({ id: pageFollowers.id }).from(pageFollowers).where(and(
        eq(pageFollowers.pageId, input.pageId),
        eq(pageFollowers.userId, ctx.user.id),
      )).limit(1);
      if (!existing[0]) return { success: false, wasFollowing: false };
      await db.delete(pageFollowers).where(and(
        eq(pageFollowers.pageId, input.pageId),
        eq(pageFollowers.userId, ctx.user.id),
      ));
      const page = (await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1))[0];
      if (page && page.followers > 0) {
        await db.update(pages).set({ followers: page.followers - 1 }).where(eq(pages.id, input.pageId));
      }
      return { success: true, wasFollowing: true };
    }),

  isFollowingPage: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select({ id: pageFollowers.id }).from(pageFollowers).where(and(
        eq(pageFollowers.pageId, input.pageId),
        eq(pageFollowers.userId, ctx.user.id),
      )).limit(1);
      return { isFollowing: Boolean(rows[0]) };
    }),

  getPageFollowers: publicProcedure
    .input(z.object({ pageId: z.number(), limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select({ id: users.id, name: users.name, profileImage: users.profileImage, followedAt: pageFollowers.createdAt })
        .from(pageFollowers)
        .innerJoin(users, eq(pageFollowers.userId, users.id))
        .where(eq(pageFollowers.pageId, input.pageId))
        .orderBy(desc(pageFollowers.createdAt))
        .limit(input.limit);
    }),

  // Search pages
  searchPages: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return db
        .select()
        .from(pages)
        .where(like(pages.name, `%${input.query}%`))
        .limit(20);
    }),

  // Update page
  updatePage: protectedProcedure
    .input(
      z.object({
        pageId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        profileImage: z.string().optional(),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const pageResult = await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1);
      const page = pageResult[0];

      if (!page || page.ownerId !== ctx.user.id) {
        throw new Error("Only page owner can update");
      }

      await db
        .update(pages)
        .set({
          name: input.name,
          description: input.description,
          profileImage: input.profileImage,
          coverImage: input.coverImage,
        })
        .where(eq(pages.id, input.pageId));

      const updated = await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1);
      return updated[0] || null;
    }),

  // Delete page
  deletePage: protectedProcedure
    .input(z.object({ pageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const pageResult = await db.select().from(pages).where(eq(pages.id, input.pageId)).limit(1);
      const page = pageResult[0];

      if (!page || page.ownerId !== ctx.user.id) {
        throw new Error("Only page owner can delete");
      }

      await db.delete(pages).where(eq(pages.id, input.pageId));
      return { success: true };
    }),
});
