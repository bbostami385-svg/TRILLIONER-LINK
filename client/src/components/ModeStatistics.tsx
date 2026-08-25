import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Video, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { selectModeStatistics } from "@/lib/modeOnboarding";

interface ModeStatisticsProps {
  userId: number;
  currentMode: "social" | "creator";
}

/**
 * ModeStatistics Component
 * Displays statistics based on the current mode
 * Social Mode: Followers, Following, Posts
 * Creator Mode: Subscribers, Videos, Views
 */
export const ModeStatistics: React.FC<ModeStatisticsProps> = ({
  userId,
  currentMode,
}) => {
  const { data: modeStats, isLoading } = trpc.dualMode.getModeStatistics.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
        ))}
      </div>
    );
  }

  const stats = selectModeStatistics(modeStats ? [
    ...(modeStats.social ? [{ ...modeStats.social, mode: "social" as const }] : []),
    ...(modeStats.creator ? [{ ...modeStats.creator, mode: "creator" as const }] : []),
  ] : undefined, currentMode);

  if (!stats) {
    return null;
  }

  if (currentMode === "social") {
    return (
      <div className="grid grid-cols-3 gap-4">
        {/* Followers */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-2">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.followers}</div>
          <div className="text-sm text-gray-600">Followers</div>
        </Card>

        {/* Following */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-2">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.following}</div>
          <div className="text-sm text-gray-600">Following</div>
        </Card>

        {/* Posts */}
        <Card className="p-4 text-center hover:shadow-lg transition-shadow">
          <div className="flex justify-center mb-2">
            <Video className="w-6 h-6 text-pink-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalPosts}</div>
          <div className="text-sm text-gray-600">Posts</div>
        </Card>
      </div>
    );
  }

  // Creator Mode Statistics
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Subscribers */}
      <Card className="p-4 text-center hover:shadow-lg transition-shadow">
        <div className="flex justify-center mb-2">
          <Users className="w-6 h-6 text-red-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.subscribers}</div>
        <div className="text-sm text-gray-600">Subscribers</div>
      </Card>

      {/* Videos */}
      <Card className="p-4 text-center hover:shadow-lg transition-shadow">
        <div className="flex justify-center mb-2">
          <Video className="w-6 h-6 text-orange-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalVideos}</div>
        <div className="text-sm text-gray-600">Videos</div>
      </Card>

      {/* Views */}
      <Card className="p-4 text-center hover:shadow-lg transition-shadow">
        <div className="flex justify-center mb-2">
          <Eye className="w-6 h-6 text-green-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">{stats.totalViews}</div>
        <div className="text-sm text-gray-600">Views</div>
      </Card>
    </div>
  );
};

export default ModeStatistics;
