export const REWARD_CONFETTI_COUNT = 28;
export const REWARD_CONFETTI_COLORS = ["#22d3ee", "#818cf8", "#fbbf24", "#fb7185", "#34d399"] as const;

export function getRewardConfettiStyle(index: number) {
  return {
    backgroundColor: REWARD_CONFETTI_COLORS[index % REWARD_CONFETTI_COLORS.length],
    animationDelay: `${(index % 7) * 45}ms`,
    transform: `translateX(${(index - 14) * 18}px)`,
  };
}
