import { describe, expect, it } from "vitest";
import { createWatchLaterFolder, getWatchLaterFolders, getWatchLaterItems, isWatchLaterSaved, moveWatchLaterToFolder, removeWatchLater, reorderWatchLater, toggleWatchLater } from "./watchLater";

describe("Watch Later helpers", () => {
  it("creates folders, assigns items, and reorders the queue", () => {
    const originalWindow = globalThis.window; const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
    try { const first = toggleWatchLater({ id: 1, title: "One", mediaType: "long" }); toggleWatchLater({ id: 2, title: "Two", mediaType: "short" }); const folder = createWatchLaterFolder("Learning")[0]; moveWatchLaterToFolder(1, "long", folder.id); expect(getWatchLaterFolders()[0].name).toBe("Learning"); expect(reorderWatchLater(0, 1).map((item) => item.id)).toEqual([1, 2]); expect(first.items[0].id).toBe(1); } finally { Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow }); }
  });

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
