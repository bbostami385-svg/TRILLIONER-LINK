import { describe, expect, it } from "vitest";
import { getWatchLaterItems, isWatchLaterSaved, removeWatchLater, toggleWatchLater } from "./watchLater";

describe("Watch Later helpers", () => {
  it("toggles a long-form item without duplicating it", () => {
    const originalWindow = globalThis.window;
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
    const item = { id: 11, title: "Deep dive", mediaType: "long" as const };
    try {
      expect(toggleWatchLater(item).saved).toBe(true);
      expect(isWatchLaterSaved(11, "long")).toBe(true);
      expect(toggleWatchLater(item).saved).toBe(false);
      expect(getWatchLaterItems()).toEqual([]);
      expect(removeWatchLater(11, "long")).toEqual([]);
    } finally {
      Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    }
  });
});
