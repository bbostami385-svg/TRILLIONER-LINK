import { beforeEach, describe, expect, it, vi } from "vitest";
import { marketplaceRouter } from "./marketplace";
import * as dbModule from "../db";

vi.mock("../db", () => ({ getDb: vi.fn() }));

const caller = () => marketplaceRouter.createCaller({ user: { id: 42 } } as any);

describe("Marketplace listing procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists active products with seller information and category filtering", async () => {
    const listings = [{ id: 1, name: "Headphones", category: "electronics", stock: 4, sellerName: "Creator Shop" }];
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({ orderBy: vi.fn(() => ({ limit: vi.fn().mockResolvedValue(listings) })) })),
          })),
        })),
      })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().listProducts({ category: "electronics", limit: 24 })).resolves.toEqual(listings);
  });

  it("creates a listing for the authenticated seller", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 9 }]);
    const db = {
      insert: vi.fn(() => ({ values })),
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ id: 9, sellerId: 42, currency: "BDT" }]) })) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().createProduct({ name: "Headphones", category: "electronics", priceMinor: 499900, stock: 4, currency: "bdt" })).resolves.toMatchObject({ id: 9, sellerId: 42 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ sellerId: 42, currency: "BDT", status: "active" }));
  });

  it("rejects an update when the listing is not owned by the current seller", async () => {
    const db = {
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ affectedRows: 0 }]) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().updateProduct({ id: 9, name: "Headphones", category: "electronics", priceMinor: 499900, stock: 4, currency: "BDT" })).rejects.toThrow("Product not found or not owned by you");
  });

  it("archives only an active listing owned by the current seller", async () => {
    const db = {
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]) })) })),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(db as never);
    await expect(caller().archiveProduct({ id: 9 })).resolves.toEqual({ success: true });
  });
});
