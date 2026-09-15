import { describe, expect, it } from "vitest";
import { getRewardConfettiStyle, REWARD_CONFETTI_COLORS, REWARD_CONFETTI_COUNT } from "./profileRewardCelebration";

describe("profile reward celebration", () => {
  it("keeps a stable celebration particle count and color palette", () => {
    expect(REWARD_CONFETTI_COUNT).toBe(28);
    expect(REWARD_CONFETTI_COLORS.length).toBe(5);
    expect(getRewardConfettiStyle(0).backgroundColor).toBe(REWARD_CONFETTI_COLORS[0]);
    expect(getRewardConfettiStyle(5).backgroundColor).toBe(REWARD_CONFETTI_COLORS[0]);
  });

  it("staggeres particle animation timing and position", () => {
    expect(getRewardConfettiStyle(1).animationDelay).toBe("45ms");
    expect(getRewardConfettiStyle(14).transform).toBe("translateX(0px)");
  });
});
