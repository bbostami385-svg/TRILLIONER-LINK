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


/** Compatibility helpers for level presentation components. */
export const getLevelDescription = (level: number): string => LEVEL_DESCRIPTIONS[level] ?? LEVEL_DESCRIPTIONS[1];
export const getLevelColor = (level: number): {
  border: string;
  gradient: string;
  bg: string;
  text: string;
  button: string;
} => {
  const color = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];
  const styles: Record<string, { border: string; gradient: string; bg: string; text: string; button: string }> = {
    gray: { border: "border-gray-300", gradient: "bg-gradient-to-r from-gray-500 to-gray-700", bg: "bg-gray-100", text: "text-gray-800", button: "bg-gray-600 hover:bg-gray-700" },
    blue: { border: "border-blue-300", gradient: "bg-gradient-to-r from-blue-500 to-blue-700", bg: "bg-blue-100", text: "text-blue-800", button: "bg-blue-600 hover:bg-blue-700" },
    cyan: { border: "border-cyan-300", gradient: "bg-gradient-to-r from-cyan-500 to-cyan-700", bg: "bg-cyan-100", text: "text-cyan-800", button: "bg-cyan-600 hover:bg-cyan-700" },
    green: { border: "border-green-300", gradient: "bg-gradient-to-r from-green-500 to-green-700", bg: "bg-green-100", text: "text-green-800", button: "bg-green-600 hover:bg-green-700" },
    emerald: { border: "border-emerald-300", gradient: "bg-gradient-to-r from-emerald-500 to-emerald-700", bg: "bg-emerald-100", text: "text-emerald-800", button: "bg-emerald-600 hover:bg-emerald-700" },
    teal: { border: "border-teal-300", gradient: "bg-gradient-to-r from-teal-500 to-teal-700", bg: "bg-teal-100", text: "text-teal-800", button: "bg-teal-600 hover:bg-teal-700" },
    purple: { border: "border-purple-300", gradient: "bg-gradient-to-r from-purple-500 to-purple-700", bg: "bg-purple-100", text: "text-purple-800", button: "bg-purple-600 hover:bg-purple-700" },
    violet: { border: "border-violet-300", gradient: "bg-gradient-to-r from-violet-500 to-violet-700", bg: "bg-violet-100", text: "text-violet-800", button: "bg-violet-600 hover:bg-violet-700" },
    indigo: { border: "border-indigo-300", gradient: "bg-gradient-to-r from-indigo-500 to-indigo-700", bg: "bg-indigo-100", text: "text-indigo-800", button: "bg-indigo-600 hover:bg-indigo-700" },
    pink: { border: "border-pink-300", gradient: "bg-gradient-to-r from-pink-500 to-pink-700", bg: "bg-pink-100", text: "text-pink-800", button: "bg-pink-600 hover:bg-pink-700" },
    rose: { border: "border-rose-300", gradient: "bg-gradient-to-r from-rose-500 to-rose-700", bg: "bg-rose-100", text: "text-rose-800", button: "bg-rose-600 hover:bg-rose-700" },
    red: { border: "border-red-300", gradient: "bg-gradient-to-r from-red-500 to-red-700", bg: "bg-red-100", text: "text-red-800", button: "bg-red-600 hover:bg-red-700" },
    orange: { border: "border-orange-300", gradient: "bg-gradient-to-r from-orange-500 to-orange-700", bg: "bg-orange-100", text: "text-orange-800", button: "bg-orange-600 hover:bg-orange-700" },
    amber: { border: "border-amber-300", gradient: "bg-gradient-to-r from-amber-500 to-amber-700", bg: "bg-amber-100", text: "text-amber-800", button: "bg-amber-600 hover:bg-amber-700" },
    yellow: { border: "border-yellow-300", gradient: "bg-gradient-to-r from-yellow-500 to-yellow-700", bg: "bg-yellow-100", text: "text-yellow-800", button: "bg-yellow-600 hover:bg-yellow-700" },
    lime: { border: "border-lime-300", gradient: "bg-gradient-to-r from-lime-500 to-lime-700", bg: "bg-lime-100", text: "text-lime-800", button: "bg-lime-600 hover:bg-lime-700" },
    fuchsia: { border: "border-fuchsia-300", gradient: "bg-gradient-to-r from-fuchsia-500 to-fuchsia-700", bg: "bg-fuchsia-100", text: "text-fuchsia-800", button: "bg-fuchsia-600 hover:bg-fuchsia-700" },
    sky: { border: "border-sky-300", gradient: "bg-gradient-to-r from-sky-500 to-sky-700", bg: "bg-sky-100", text: "text-sky-800", button: "bg-sky-600 hover:bg-sky-700" },
    slate: { border: "border-slate-300", gradient: "bg-gradient-to-r from-slate-500 to-slate-700", bg: "bg-slate-100", text: "text-slate-800", button: "bg-slate-600 hover:bg-slate-700" },
    gold: { border: "border-yellow-400", gradient: "bg-gradient-to-r from-yellow-500 to-amber-600", bg: "bg-yellow-100", text: "text-yellow-900", button: "bg-amber-500 hover:bg-amber-600" },
  };
  return styles[color] ?? styles.gray;
};
