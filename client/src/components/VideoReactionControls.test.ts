import { describe, expect, it } from "vitest";
import { VIDEO_REACTIONS } from "./VideoReactionControls";

describe("video reaction choices", () => {
  it("includes the complete requested reaction set without duplicate entries", () => {
    expect(VIDEO_REACTIONS).toContain("👍");
    expect(VIDEO_REACTIONS).toContain("😍");
    expect(VIDEO_REACTIONS).toContain("🤬");
    expect(new Set(VIDEO_REACTIONS).size).toBe(VIDEO_REACTIONS.length);
  });
});
