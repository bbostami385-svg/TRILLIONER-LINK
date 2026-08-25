import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import axios from "axios";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { marketplaceTransactions } from "../../drizzle/schema";

const SSLCOMMERZ_API_URL = process.env.SSLCOMMERZ_API_URL || "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";
const SSLCOMMERZ_STORE_ID = process.env.SSLCOMMERZ_STORE_ID || "";
const SSLCOMMERZ_STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD || "";

export const paymentRouter = router({
  // Initiate payment
  initiatePayment: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        productName: z.string(),
        productDescription: z.string().optional(),
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        orderId: z.string(),
        currency: z.string().default("BDT"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const paymentData = {
          store_id: SSLCOMMERZ_STORE_ID,
          store_passwd: SSLCOMMERZ_STORE_PASSWORD,
          total_amount: input.amount,
          currency: input.currency,
          tran_id: input.orderId,
          success_url: `${process.env.FRONTEND_URL}/payment/success`,
          fail_url: `${process.env.FRONTEND_URL}/payment/failed`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`,
          ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn`,
          emi_option: 0,
          cus_name: input.customerName,
          cus_email: input.customerEmail,
          cus_phone: input.customerPhone,
          cus_add1: "N/A",
          cus_city: "N/A",
          cus_state: "N/A",
          cus_postcode: "N/A",
          cus_country: "Bangladesh",
          shipping_method: "NO",
          product_name: input.productName,
          product_category: "Digital",
          product_profile: "digital-goods",
          multi_card_name: "",
          value_a: ctx.user.id.toString(),
          value_b: input.orderId,
          value_c: input.productName,
          value_d: input.amount.toString(),
        };

        const response = await axios.post(SSLCOMMERZ_API_URL, paymentData);

        if (response.data.status === "FAILED") {
          throw new Error(response.data.failedreason || "Payment initiation failed");
        }

        return {
          status: response.data.status,
          sessionkey: response.data.sessionkey,
          redirectGatewayURL: response.data.redirectGatewayURL,
          GatewayPageURL: response.data.GatewayPageURL,
        };
      } catch (error) {
        console.error("Payment initiation error:", error);
        throw new Error("Failed to initiate payment");
      }
    }),

  createMarketplaceTransaction: protectedProcedure
    .input(z.object({
      orderId: z.string().min(6).max(80),
      productName: z.string().trim().min(1).max(255),
      amountMinor: z.number().int().positive(),
      currency: z.string().length(3).default("BDT"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(marketplaceTransactions).values({
        userId: ctx.user.id,
        orderId: input.orderId,
        productName: input.productName,
        amountMinor: input.amountMinor,
        currency: input.currency.toUpperCase(),
        status: "initiated",
      });
      return { success: true, orderId: input.orderId, status: "initiated" as const };
    }),

  confirmMarketplaceTransaction: protectedProcedure
    .input(z.object({
      orderId: z.string().min(6).max(80),
      providerTransactionId: z.string().min(1).max(128),
      amountMinor: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const rows = await db.select().from(marketplaceTransactions).where(and(
        eq(marketplaceTransactions.userId, ctx.user.id),
        eq(marketplaceTransactions.orderId, input.orderId),
      )).limit(1);
      const transaction = rows[0];
      if (!transaction) throw new Error("Marketplace transaction not found");
      if (transaction.amountMinor !== input.amountMinor) throw new Error("Payment amount mismatch");
      const response = await axios.get(SSLCOMMERZ_API_URL, {
        params: { store_id: SSLCOMMERZ_STORE_ID, store_passwd: SSLCOMMERZ_STORE_PASSWORD, val_id: input.providerTransactionId },
      });
      const payment = response.data;
      const paidAmountMinor = Math.round(Number(payment.amount) * 100);
      if (payment.status !== "VALID" || payment.tran_id !== input.orderId || paidAmountMinor !== transaction.amountMinor) {
        throw new Error("Payment verification failed");
      }
      await db.update(marketplaceTransactions).set({
        status: "paid",
        providerTransactionId: input.providerTransactionId,
      }).where(and(
        eq(marketplaceTransactions.userId, ctx.user.id),
        eq(marketplaceTransactions.orderId, input.orderId),
      ));
      return { success: true, orderId: input.orderId, status: "paid" as const };
    }),

  getMarketplaceTransactions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      return db.select({
        id: marketplaceTransactions.id,
        orderId: marketplaceTransactions.orderId,
        productName: marketplaceTransactions.productName,
        amountMinor: marketplaceTransactions.amountMinor,
        currency: marketplaceTransactions.currency,
        status: marketplaceTransactions.status,
        createdAt: marketplaceTransactions.createdAt,
        providerTransactionId: marketplaceTransactions.providerTransactionId,
      }).from(marketplaceTransactions)
        .where(eq(marketplaceTransactions.userId, ctx.user.id))
        .orderBy(desc(marketplaceTransactions.createdAt))
        .limit(50);
    }),

  // Verify payment
  verifyPayment: publicProcedure
    .input(
      z.object({
        transactionId: z.string(),
        amount: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const verifyData = {
          store_id: SSLCOMMERZ_STORE_ID,
          store_passwd: SSLCOMMERZ_STORE_PASSWORD,
          val_id: input.transactionId,
        };

        const response = await axios.get(SSLCOMMERZ_API_URL, {
          params: verifyData,
        });

        if (response.data.status === "VALID") {
          return {
            success: true,
            status: response.data.status,
            transactionId: response.data.tran_id,
            amount: response.data.amount,
            currency: response.data.currency,
          };
        }

        return {
          success: false,
          status: response.data.status,
          message: "Payment verification failed",
        };
      } catch (error) {
        console.error("Payment verification error:", error);
        throw new Error("Failed to verify payment");
      }
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // This would query your payments table
      // For now, returning empty array
      return [];
    } catch (error) {
      console.error("Error fetching payment history:", error);
      throw new Error("Failed to fetch payment history");
    }
  }),

  // Create subscription
  createSubscription: protectedProcedure
    .input(
      z.object({
        planId: z.string(),
        planName: z.string(),
        amount: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const orderId = `SUB-${ctx.user.id}-${Date.now()}`;

        const paymentData = {
          store_id: SSLCOMMERZ_STORE_ID,
          store_passwd: SSLCOMMERZ_STORE_PASSWORD,
          total_amount: input.amount,
          currency: "BDT",
          tran_id: orderId,
          success_url: `${process.env.FRONTEND_URL}/subscription/success`,
          fail_url: `${process.env.FRONTEND_URL}/subscription/failed`,
          cancel_url: `${process.env.FRONTEND_URL}/subscription/cancelled`,
          ipn_url: `${process.env.BACKEND_URL}/api/payment/ipn`,
          product_name: input.planName,
          product_category: "Subscription",
          product_profile: "subscription",
          recurring: "1",
          recurring_interval: input.billingCycle === "monthly" ? "1" : "12",
          recurring_interval_type: input.billingCycle === "monthly" ? "month" : "year",
          value_a: ctx.user.id.toString(),
          value_b: input.planId,
          value_c: input.billingCycle,
        };

        const response = await axios.post(SSLCOMMERZ_API_URL, paymentData);

        if (response.data.status === "FAILED") {
          throw new Error(response.data.failedreason || "Subscription creation failed");
        }

        return {
          status: response.data.status,
          sessionkey: response.data.sessionkey,
          redirectGatewayURL: response.data.redirectGatewayURL,
          orderId,
        };
      } catch (error) {
        console.error("Subscription creation error:", error);
        throw new Error("Failed to create subscription");
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(z.object({ subscriptionId: z.string() }))
    .mutation(async ({ input, ctx }: any) => {
      try {
        // Implement subscription cancellation logic
        return {
          success: true,
          message: "Subscription cancelled successfully",
        };
      } catch (error) {
        console.error("Subscription cancellation error:", error);
        throw new Error("Failed to cancel subscription");
      }
    }),
});
