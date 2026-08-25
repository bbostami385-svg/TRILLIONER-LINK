import { describe, expect, it } from "vitest";
import { addCartItem, getCartCount, getCartTotal, removeCartItem, type CartItem } from "./marketplaceCart";

type Product = { id: number; name: string; price: number };
const headphones: Product = { id: 1, name: "Headphones", price: 4999 };
const mouse: Product = { id: 2, name: "Mouse", price: 1299 };

describe("marketplaceCart", () => {
  it("merges duplicate products into a quantity", () => {
    const once = addCartItem<Product>([], headphones);
    const twice = addCartItem(once, headphones);
    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe(2);
    expect(getCartCount(twice)).toBe(2);
  });

  it("removes one quantity and then removes the item", () => {
    const cart: CartItem<Product>[] = [{ id: 1, price: 4999, product: headphones, quantity: 2 }];
    const one = removeCartItem(cart, 1);
    expect(one[0].quantity).toBe(1);
    expect(removeCartItem(one, 1)).toEqual([]);
  });

  it("calculates totals across unique products and quantities", () => {
    const cart = addCartItem(addCartItem(addCartItem([], headphones), headphones), mouse);
    expect(getCartTotal(cart)).toBe(11297);
  });
});
