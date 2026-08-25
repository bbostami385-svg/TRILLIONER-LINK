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
