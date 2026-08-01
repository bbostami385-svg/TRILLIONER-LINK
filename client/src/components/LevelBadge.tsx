import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  getLevelBadgeColor,
  getLevelEmoji,
  LEVEL_DESCRIPTIONS,
  formatFollowers,
} from "@/lib/levelUtils";
import { Zap } from "lucide-react";

interface LevelBadgeProps {
  level: number;
  followers?: number;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

/**
 * LevelBadge Component
 * Displays user's current level with color-coded styling
 */
export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  followers,
  size = "md",
  showDescription = false,
}) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const badgeColor = getLevelBadgeColor(level);
  const emoji = getLevelEmoji(level);
  const description = LEVEL_DESCRIPTIONS[level];

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={`gap-2 font-bold border transition-all ${sizeClasses[size]} ${badgeColor}`}
      >
        <span>{emoji}</span>
        <span>Level {level}</span>
        {level >= 10 && <Zap className="w-3 h-3" />}
      </Badge>

      {showDescription && (
        <div className="text-xs text-gray-600">
          <div className="font-semibold">{description}</div>
          {followers !== undefined && (
            <div className="text-gray-500">{formatFollowers(followers)} followers</div>
          )}
        </div>
      )}
    </div>
  );
};

export default LevelBadge;
