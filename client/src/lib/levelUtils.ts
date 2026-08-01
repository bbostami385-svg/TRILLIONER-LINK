/**
 * Level System Utilities
 * Defines the follower thresholds for each level (1-20)
 */

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 50,
  3: 100,
  4: 500,
  5: 1000,
  6: 10000,
  7: 50000,
  8: 100000,
  9: 500000,
  10: 1000000,
  11: 5000000,
  12: 10000000,
  13: 20000000,
  14: 50000000,
  15: 100000000,
  16: 200000000,
  17: 500000000,
  18: 1000000000,
  19: 2000000000,
  20: 5000000000,
};

export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: "Newcomer",
  2: "Rising Star",
  3: "Growing Creator",
  4: "Established",
  5: "Popular",
  6: "Viral",
  7: "Celebrity",
  8: "Mega Star",
  9: "Superstar",
  10: "Icon",
  11: "Legend",
  12: "Phenomenon",
  13: "Titan",
  14: "Colossus",
  15: "Immortal",
  16: "Cosmic",
  17: "Universal",
  18: "Galactic",
  19: "Omnipotent",
  20: "Supreme",
};

export const LEVEL_COLORS: Record<number, string> = {
  1: "gray",
  2: "blue",
  3: "cyan",
  4: "green",
  5: "emerald",
  6: "teal",
  7: "purple",
  8: "violet",
  9: "indigo",
  10: "pink",
  11: "rose",
  12: "red",
  13: "orange",
  14: "amber",
  15: "yellow",
  16: "lime",
  17: "fuchsia",
  18: "sky",
  19: "slate",
  20: "gold",
};

/**
 * Calculate the current level based on follower count
 */
export const calculateLevel = (followers: number): number => {
  for (let level = 20; level >= 1; level--) {
    if (followers >= LEVEL_THRESHOLDS[level]) {
      return level;
    }
  }
  return 1;
};

/**
 * Get the next level threshold
 */
export const getNextLevelThreshold = (currentLevel: number): number => {
  if (currentLevel >= 20) return LEVEL_THRESHOLDS[20];
  return LEVEL_THRESHOLDS[currentLevel + 1];
};

/**
 * Calculate progress percentage to next level
 */
export const getLevelProgress = (followers: number, currentLevel: number): number => {
  if (currentLevel >= 20) return 100;

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel + 1];

  if (followers < currentThreshold) return 0;

  const progress = ((followers - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  return Math.min(progress, 100);
};

/**
 * Format follower count with commas
 */
export const formatFollowers = (count: number): string => {
  return count.toLocaleString();
};

/**
 * Get level badge color class for Tailwind
 */
export const getLevelBadgeColor = (level: number): string => {
  const colorMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 border-gray-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    cyan: "bg-cyan-100 text-cyan-800 border-cyan-300",
    green: "bg-green-100 text-green-800 border-green-300",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-300",
    teal: "bg-teal-100 text-teal-800 border-teal-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    violet: "bg-violet-100 text-violet-800 border-violet-300",
    indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
    rose: "bg-rose-100 text-rose-800 border-rose-300",
    red: "bg-red-100 text-red-800 border-red-300",
    orange: "bg-orange-100 text-orange-800 border-orange-300",
    amber: "bg-amber-100 text-amber-800 border-amber-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    lime: "bg-lime-100 text-lime-800 border-lime-300",
    fuchsia: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
    sky: "bg-sky-100 text-sky-800 border-sky-300",
    slate: "bg-slate-100 text-slate-800 border-slate-300",
    gold: "bg-yellow-200 text-yellow-900 border-yellow-400",
  };

  const color = LEVEL_COLORS[level];
  return colorMap[color] || colorMap.gray;
};

/**
 * Get level icon emoji
 */
export const getLevelEmoji = (level: number): string => {
  const emojiMap: Record<number, string> = {
    1: "🌱",
    2: "⭐",
    3: "✨",
    4: "🎯",
    5: "🔥",
    6: "💫",
    7: "👑",
    8: "🌟",
    9: "💎",
    10: "🏆",
    11: "🦁",
    12: "🚀",
    13: "⚡",
    14: "🌈",
    15: "🎆",
    16: "🌠",
    17: "🌌",
    18: "🪐",
    19: "✨🔮",
    20: "👑💎🌟",
  };

  return emojiMap[level] || "⭐";
};
