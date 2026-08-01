import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LevelBadge } from "./LevelBadge";
import { formatFollowers, getLevelEmoji } from "@/lib/levelUtils";
import { Trophy, ChevronDown } from "lucide-react";

interface LeaderboardProps {
  limit?: number;
}

/**
 * Leaderboard Component
 * Displays top users ranked by level and followers
 */
export const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 20 }) => {
  const [offset, setOffset] = useState(0);
  const { data: leaderboard, isLoading } = trpc.levels.getLeaderboard.useQuery({
    limit,
    offset,
  });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.users.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600">No users on the leaderboard yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <span className="text-sm text-gray-600 ml-auto">
            Top {leaderboard.total} creators
          </span>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {leaderboard.users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                index < 3
                  ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                  : "bg-gray-50 border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                {index === 0 && <span className="text-2xl">🥇</span>}
                {index === 1 && <span className="text-2xl">🥈</span>}
                {index === 2 && <span className="text-2xl">🥉</span>}
                {index >= 3 && (
                  <span className="font-bold text-gray-600 text-lg">#{index + 1}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">User #{user.userId}</span>
                  <LevelBadge level={user.currentLevel} size="sm" />
                </div>
                <div className="text-sm text-gray-600">
                  {formatFollowers(user.totalFollowers)} followers
                </div>
              </div>

              {/* Stats */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-semibold text-gray-900">
                  Level {user.currentLevel}
                </div>
                <div className="text-xs text-gray-600">
                  {user.levelUpCount} level ups
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {leaderboard.total > leaderboard.offset + limit && (
          <Button
            onClick={handleLoadMore}
            variant="outline"
            className="w-full gap-2 mt-4"
          >
            <ChevronDown className="w-4 h-4" />
            Load More
          </Button>
        )}

        {/* Footer Info */}
        <div className="text-xs text-gray-600 text-center mt-4 pt-4 border-t">
          Showing {leaderboard.offset + 1} - {Math.min(leaderboard.offset + limit, leaderboard.total)} of{" "}
          {leaderboard.total} users
        </div>
      </div>
    </Card>
  );
};

export default Leaderboard;
