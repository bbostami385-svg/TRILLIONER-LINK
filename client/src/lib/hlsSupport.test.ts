import { describe, expect, it } from "vitest";
import { canPlayHls } from "./hlsSupport";

describe("native HLS support detection", () => {
  it("accepts browsers that advertise the HLS MIME type", () => {
    expect(canPlayHls({ canPlayType: (type: string) => type === "application/vnd.apple.mpegurl" ? "probably" : "" })).toBe(true);
  });

  it("rejects browsers without native HLS support", () => {
    expect(canPlayHls({ canPlayType: () => "" })).toBe(false);
    expect(canPlayHls(null)).toBe(false);
  });
});
