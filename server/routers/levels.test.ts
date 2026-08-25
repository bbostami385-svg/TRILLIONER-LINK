import { describe, expect, it } from "vitest";
import { calculateLevel, LEVEL_THRESHOLDS } from "./levels";

describe("Levels router contracts", () => {
  it("keeps all twenty thresholds monotonic", () => {
    const thresholds = Object.values(LEVEL_THRESHOLDS);
    expect(thresholds).toHaveLength(20);
    expect(thresholds.every((value, index) => index === 0 || value >= thresholds[index - 1])).toBe(true);
  });

  it("returns the correct level at each threshold", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(2);
    expect(calculateLevel(100)).toBe(3);
    expect(calculateLevel(5000000000)).toBe(20);
  });

  it("does not level up before the next threshold", () => {
    expect(calculateLevel(49)).toBe(1);
    expect(calculateLevel(99)).toBe(2);
    expect(calculateLevel(499)).toBe(3);
    expect(calculateLevel(4999999999)).toBe(19);
  });
});
