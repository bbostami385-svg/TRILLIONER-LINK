import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { products, orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const shoppingRouter = router({
  // Get products
  getProducts: publicProcedure.query(async () => {
    return await db.select().from(products);
  }),

  // Get product by ID
  getProduct: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id));
      return product;
    }),

  // Create order
  createOrder: protectedProcedure
    .input(
      z.object({
        items: z.array(z.object({ productId: z.string(), quantity: z.number() })),
        totalAmount: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [order] = await db
        .insert(orders)
        .values({
          userId: ctx.user.id,
          items: input.items,
          totalAmount: input.totalAmount,
          status: "pending",
        })
        .returning();
      return order;
    }),

  // Get user orders
  getUserOrders: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(orders).where(eq(orders.userId, ctx.user.id));
  }),
});
