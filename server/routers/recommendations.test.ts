import { describe, expect, it } from "vitest";
import { scoreFreshness } from "./recommendations";

describe("recommendation scoring", () => {
  it("prioritizes stronger engagement when content age is equal", () => {
    const now = new Date();
    expect(scoreFreshness(now, 100)).toBeGreaterThan(scoreFreshness(now, 10));
  });

  it("decays older content while keeping its engagement signal positive", () => {
    const now = Date.now();
    const recent = scoreFreshness(new Date(now), 100);
    const older = scoreFreshness(new Date(now - 7 * 24 * 60 * 60 * 1000), 100);
    expect(recent).toBeGreaterThan(older);
    expect(older).toBeGreaterThan(0);
  });
});
