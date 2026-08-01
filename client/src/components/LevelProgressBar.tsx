import React from "react";
import { Card } from "@/components/ui/card";
import {
  getLevelProgress,
  getNextLevelThreshold,
  LEVEL_THRESHOLDS,
  formatFollowers,
} from "@/lib/levelUtils";
import { ChevronUp } from "lucide-react";

interface LevelProgressBarProps {
  currentLevel: number;
  followers: number;
  showDetails?: boolean;
}

/**
 * LevelProgressBar Component
 * Shows progress towards next level with visual bar
 */
export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  currentLevel,
  followers,
  showDetails = true,
}) => {
  const progress = getLevelProgress(followers, currentLevel);
  const nextThreshold = getNextLevelThreshold(currentLevel);
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const followersUntilNextLevel = Math.max(0, nextThreshold - followers);

  if (currentLevel >= 20) {
    return (
      <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-900 mb-2">🏆 Maximum Level Reached!</div>
          <div className="text-sm text-yellow-700">
            You have achieved Level 20 - Supreme Status
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">
            Level {currentLevel} → Level {currentLevel + 1}
          </div>
          <div className="text-xs text-gray-500">
            {progress.toFixed(0)}% complete
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Details */}
        {showDetails && (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-gray-600">Current</div>
              <div className="font-semibold text-gray-900">
                {formatFollowers(followers)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Until Next</div>
              <div className="font-semibold text-purple-600 flex items-center justify-center gap-1">
                <ChevronUp className="w-3 h-3" />
                {formatFollowers(followersUntilNextLevel)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Target</div>
              <div className="font-semibold text-gray-900">
                {formatFollowers(nextThreshold)}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LevelProgressBar;
