import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function ReelsPage() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    videoUrl: "",
    caption: "",
    thumbnail: "",
    duration: 0,
  });

  const { data: trendingReels, isLoading: loadingReels } = trpc.reels.getTrendingReels.useQuery({
    limit: 20,
  });

  const createReelMutation = trpc.reels.createReel.useMutation();
  const likeReelMutation = trpc.reels.likeReel.useMutation();

  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReelMutation.mutateAsync({
        videoUrl: formData.videoUrl,
        caption: formData.caption,
        thumbnail: formData.thumbnail,
        duration: formData.duration,
      });
      setFormData({ videoUrl: "", caption: "", thumbnail: "", duration: 0 });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create reel:", error);
    }
  };

  const handleLikeReel = async (reelId: number) => {
    try {
      await likeReelMutation.mutateAsync({ reelId });
    } catch (error) {
      console.error("Failed to like reel:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Reels</h1>
          <p className="text-purple-200">Short-form vertical videos</p>
        </div>

        {/* Create Reel Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Reel"}
          </Button>
        )}

        {/* Create Reel Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateReel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Video URL</label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="Enter video URL"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Caption</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Enter caption"
                  className="w-full bg-slate-700 border border-purple-500 text-white rounded p-2"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">Thumbnail URL</label>
                  <Input
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    placeholder="Enter thumbnail URL"
                    className="bg-slate-700 border-purple-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-purple-200 mb-2">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    placeholder="0"
                    className="bg-slate-700 border-purple-500 text-white"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createReelMutation.isPending}
              >
                {createReelMutation.isPending ? "Creating..." : "Create Reel"}
              </Button>
            </form>
          </Card>
        )}

        {/* Trending Reels */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Trending Reels</h2>
          {loadingReels ? (
            <p className="text-purple-200">Loading reels...</p>
          ) : trendingReels && trendingReels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingReels.map((reel) => (
                <Card
                  key={reel.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors overflow-hidden"
                >
                  {reel.thumbnail && (
                    <img
                      src={reel.thumbnail}
                      alt={reel.caption || "Reel"}
                      className="w-full h-48 object-cover rounded mb-3"
                    />
                  )}
                  <p className="text-purple-200 text-sm mb-3 line-clamp-2">{reel.caption}</p>
                  <div className="flex justify-between items-center text-xs text-purple-300 mb-3">
                    <span>👁️ {reel.views} views</span>
                    <span>❤️ {reel.likes} likes</span>
                    <span>💬 {reel.comments} comments</span>
                  </div>
                  <Button
                    onClick={() => handleLikeReel(reel.id)}
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600"
                    disabled={likeReelMutation.isPending}
                  >
                    ❤️ Like
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-purple-200">No reels available</p>
          )}
        </div>
      </div>
    </div>
  );
}
