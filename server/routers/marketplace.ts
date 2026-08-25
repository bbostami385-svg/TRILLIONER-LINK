import { z } from "zod";
import { and, desc, eq, like, or } from "drizzle-orm";
import { marketplaceProducts, users } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const productInput = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  category: z.string().trim().min(1).max(80),
  priceMinor: z.number().int().positive(),
  currency: z.string().trim().length(3).default("BDT"),
  imageUrl: z.string().url().max(2048).optional(),
  stock: z.number().int().min(0).max(1_000_000),
});

export const marketplaceRouter = router({
  listProducts: publicProcedure
    .input(z.object({
      category: z.string().trim().max(80).optional(),
      query: z.string().trim().max(100).optional(),
      limit: z.number().int().min(1).max(100).default(24),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const filters = [eq(marketplaceProducts.status, "active")];
      if (input.category && input.category !== "all") filters.push(eq(marketplaceProducts.category, input.category));
      if (input.query) {
        filters.push(or(
          like(marketplaceProducts.name, `%${input.query}%`),
          like(marketplaceProducts.description, `%${input.query}%`),
        )!);
      }
      return db.select({
        id: marketplaceProducts.id,
        name: marketplaceProducts.name,
        description: marketplaceProducts.description,
        category: marketplaceProducts.category,
        priceMinor: marketplaceProducts.priceMinor,
        currency: marketplaceProducts.currency,
        imageUrl: marketplaceProducts.imageUrl,
        stock: marketplaceProducts.stock,
        sellerId: marketplaceProducts.sellerId,
        sellerName: users.name,
        createdAt: marketplaceProducts.createdAt,
      }).from(marketplaceProducts)
        .innerJoin(users, eq(marketplaceProducts.sellerId, users.id))
        .where(and(...filters))
        .orderBy(desc(marketplaceProducts.createdAt))
        .limit(input.limit);
    }),

  listMyProducts: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(100) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select().from(marketplaceProducts)
        .where(eq(marketplaceProducts.sellerId, ctx.user.id))
        .orderBy(desc(marketplaceProducts.updatedAt))
        .limit(input.limit);
    }),

  getProduct: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select({
        id: marketplaceProducts.id,
        name: marketplaceProducts.name,
        description: marketplaceProducts.description,
        category: marketplaceProducts.category,
        priceMinor: marketplaceProducts.priceMinor,
        currency: marketplaceProducts.currency,
        imageUrl: marketplaceProducts.imageUrl,
        stock: marketplaceProducts.stock,
        sellerId: marketplaceProducts.sellerId,
        sellerName: users.name,
        createdAt: marketplaceProducts.createdAt,
      }).from(marketplaceProducts)
        .innerJoin(users, eq(marketplaceProducts.sellerId, users.id))
        .where(and(eq(marketplaceProducts.id, input.id), eq(marketplaceProducts.status, "active")))
        .limit(1);
      return rows[0] ?? null;
    }),

  createProduct: protectedProcedure
    .input(productInput)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.insert(marketplaceProducts).values({
        ...input,
        currency: input.currency.toUpperCase(),
        sellerId: ctx.user.id,
        status: "active",
      });
      const id = Number(result[0].insertId);
      const rows = await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.id, id)).limit(1);
      return rows[0] ?? null;
    }),

  updateProduct: protectedProcedure
    .input(productInput.extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...values } = input;
      const result = await db.update(marketplaceProducts).set({
        ...values,
        currency: values.currency.toUpperCase(),
      }).where(and(eq(marketplaceProducts.id, id), eq(marketplaceProducts.sellerId, ctx.user.id), eq(marketplaceProducts.status, "active")));
      if (!result[0]?.affectedRows) throw new Error("Product not found or not owned by you");
      const rows = await db.select().from(marketplaceProducts).where(eq(marketplaceProducts.id, id)).limit(1);
      return rows[0] ?? null;
    }),

  archiveProduct: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.update(marketplaceProducts).set({ status: "archived" }).where(and(
        eq(marketplaceProducts.id, input.id),
        eq(marketplaceProducts.sellerId, ctx.user.id),
        eq(marketplaceProducts.status, "active"),
      ));
      if (!result[0]?.affectedRows) throw new Error("Product not found or not owned by you");
      return { success: true } as const;
    }),
});
