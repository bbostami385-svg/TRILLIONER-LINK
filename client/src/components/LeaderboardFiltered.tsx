import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { LevelBadge } from "./LevelBadge";
import { ModeIndicator } from "./ModeIndicator";
import { formatFollowers, getLevelEmoji } from "@/lib/levelUtils";
import { Trophy, ChevronDown, Filter } from "lucide-react";

interface LeaderboardFilteredProps {
  limit?: number;
}

type ModeFilter = "all" | "social" | "creator";

/**
 * Enhanced Leaderboard Component with Mode Filtering
 * Displays top users ranked by level and followers with filtering options
 */
export const LeaderboardFiltered: React.FC<LeaderboardFilteredProps> = ({ limit = 20 }) => {
  const [offset, setOffset] = useState(0);
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [sortBy, setSortBy] = useState<"level" | "followers">("level");

  // Queries
  const { data: leaderboard, isLoading } = trpc.levels.getLeaderboard.useQuery({
    limit,
    offset,
  });

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit);
  };

  const handleModeFilterChange = (mode: ModeFilter) => {
    setModeFilter(mode);
    setOffset(0);
  };

  const handleSortChange = (sort: "level" | "followers") => {
    setSortBy(sort);
    setOffset(0);
  };

  // Filter and sort data
  const filteredUsers = React.useMemo(() => {
    if (!leaderboard) return [];

    let filtered = [...leaderboard.users];

    // Apply mode filter
    if (modeFilter !== "all") {
      filtered = filtered.filter((user) => {
        // This would need to be added to the backend query
        // For now, we'll show all users
        return true;
      });
    }

    // Apply sorting
    if (sortBy === "followers") {
      filtered.sort((a, b) => b.totalFollowers - a.totalFollowers);
    }

    return filtered;
  }, [leaderboard, modeFilter, sortBy]);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          </div>
          <span className="text-sm text-gray-600">
            Top {leaderboard.total} creators
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-gray-200">
          {/* Mode Filter */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={modeFilter === "all" ? "default" : "outline"}
              onClick={() => handleModeFilterChange("all")}
              className="gap-1"
            >
              <Filter className="w-4 h-4" />
              All Modes
            </Button>
            <Button
              size="sm"
              variant={modeFilter === "social" ? "default" : "outline"}
              onClick={() => handleModeFilterChange("social")}
            >
              Social
            </Button>
            <Button
              size="sm"
              variant={modeFilter === "creator" ? "default" : "outline"}
              onClick={() => handleModeFilterChange("creator")}
            >
              Creator
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant={sortBy === "level" ? "default" : "outline"}
              onClick={() => handleSortChange("level")}
            >
              By Level
            </Button>
            <Button
              size="sm"
              variant={sortBy === "followers" ? "default" : "outline"}
              onClick={() => handleSortChange("followers")}
            >
              By Followers
            </Button>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-2">
          {filteredUsers.map((user, index) => (
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
                <div className="flex items-center gap-2 mb-1">
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

export default LeaderboardFiltered;
