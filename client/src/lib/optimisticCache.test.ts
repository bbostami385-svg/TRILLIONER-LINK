import { describe, expect, it } from "vitest";
import { appendListItem, patchListItem, removeListItem, restoreSnapshot } from "./optimisticCache";

type Row = { id: number; isRead: boolean; count: number };

const rows: Row[] = [
  { id: 1, isRead: false, count: 2 },
  { id: 2, isRead: true, count: 4 },
];

describe("optimistic list cache helpers", () => {
  it("patches a visible item without mutating the previous snapshot", () => {
    const next = patchListItem(rows, 1, { isRead: true, count: 3 });
    expect(next).toEqual([{ id: 1, isRead: true, count: 3 }, rows[1]]);
    expect(rows[0]).toEqual({ id: 1, isRead: false, count: 2 });
  });

  it("supports optimistic append and removal for save lists", () => {
    const optimistic = appendListItem(rows, { id: 3, isRead: false, count: 0 });
    expect(optimistic).toHaveLength(3);
    expect(removeListItem(optimistic, 3)).toEqual(rows);
  });

  it("restores the captured snapshot after a rejected mutation", () => {
    const snapshot = rows.map((row) => ({ ...row }));
    const optimistic = patchListItem(rows, 1, { isRead: true });
    expect(restoreSnapshot(snapshot)).toEqual(snapshot);
    expect(optimistic?.[0].isRead).toBe(true);
  });
});
