import { beforeEach, describe, expect, it, vi } from "vitest";
import { paymentRouter } from "./payment";
import * as dbModule from "../db";
import axios from "axios";

vi.mock("../db", () => ({ getDb: vi.fn() }));
vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

const caller = () => paymentRouter.createCaller({ user: { id: 42 } } as any);

describe("Marketplace transaction procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an authenticated transaction intent with normalized currency", async () => {
    const values = vi.fn().mockResolvedValue({});
    vi.mocked(dbModule.getDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);
    const result = await caller().createMarketplaceTransaction({
      orderId: "ORD-42-001",
      productName: "Headphones",
      amountMinor: 499900,
      currency: "bdt",
    });
    expect(result).toMatchObject({ success: true, status: "initiated", orderId: "ORD-42-001" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, currency: "BDT", amountMinor: 499900 }));
  });

  it("rejects a client amount that does not match live listing prices", async () => {
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ id: 7, name: "Headphones", priceMinor: 1000, stock: 5, status: "active" }]) })) })),
      insert: vi.fn(),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().createMarketplaceTransaction({
      orderId: "ORD-42-002",
      productName: "Headphones",
      amountMinor: 999,
      currency: "BDT",
      items: [{ productId: 7, quantity: 1 }],
    })).rejects.toThrow("Marketplace amount mismatch");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns only the authenticated user's transaction history", async () => {
    const transactions = [{ id: 1, orderId: "ORD-42-001", status: "initiated" }];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(transactions) })) })),
        })),
      })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    expect(await caller().getMarketplaceTransactions()).toEqual(transactions);
  });

  it("rejects confirmation when the client amount differs from the stored order", async () => {
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ amountMinor: 1000 }]) })) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().confirmMarketplaceTransaction({ orderId: "ORD-42-001", providerTransactionId: "VAL-1", amountMinor: 999 })).rejects.toThrow("Payment amount mismatch");
    expect(vi.mocked(axios.get)).not.toHaveBeenCalled();
  });

  it("rejects an unverified provider response without marking the order paid", async () => {
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ amountMinor: 1000 }]) })) })) })),
      update: vi.fn(),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    vi.mocked(axios.get).mockResolvedValue({ data: { status: "INVALID", tran_id: "ORD-42-001", amount: "10" } } as never);
    await expect(caller().confirmMarketplaceTransaction({ orderId: "ORD-42-001", providerTransactionId: "VAL-1", amountMinor: 1000 })).rejects.toThrow("Payment verification failed");
    expect(db.update).not.toHaveBeenCalled();
  });
});


describe("Payment history and subscriptions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns persisted payment history scoped to the authenticated user", async () => {
    const history = [{ id: 3, orderId: "ORD-42-003", amountMinor: 2500, status: "paid" }];
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(history) })) })) })) })) };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().getPaymentHistory()).resolves.toEqual(history);
    expect(db.select).toHaveBeenCalled();
  });

  it("cancels only a subscription owned by the authenticated user", async () => {
    const deleteWhere = vi.fn().mockResolvedValue({});
    const db = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 12 }]) })) })) })),
      delete: vi.fn(() => ({ where: deleteWhere })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().cancelSubscription({ subscriptionId: 12 })).resolves.toMatchObject({ success: true, subscriptionId: 12 });
    expect(deleteWhere).toHaveBeenCalled();
  });

  it("rejects cancellation when the subscription is not owned by the caller", async () => {
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })) })) })), delete: vi.fn() };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().cancelSubscription({ subscriptionId: 99 })).rejects.toThrow("Subscription not found");
    expect(db.delete).not.toHaveBeenCalled();
  });
});


describe("Creator subscription management", () => {
  it("returns persisted subscriptions for the authenticated subscriber", async () => {
    const subscriptions = [{ id: 21, creatorId: 88, subscriptionTier: "basic" }];
    const db = { select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(subscriptions) })) })) })) })) };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().getMySubscriptions()).resolves.toEqual(subscriptions);
    expect(db.select).toHaveBeenCalled();
  });
});
