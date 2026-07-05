import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Challenges() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    hashtag: "",
    description: "",
    coverImage: "",
  });

  const { data: trendingChallenges, isLoading: loadingChallenges } = trpc.challenges.getTrendingChallenges.useQuery({
    limit: 20,
  });

  const createChallengeMutation = trpc.challenges.createChallenge.useMutation();
  const joinChallengeMutation = trpc.challenges.incrementParticipants.useMutation();

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createChallengeMutation.mutateAsync({
        hashtag: formData.hashtag,
        description: formData.description,
        coverImage: formData.coverImage,
      });
      setFormData({ hashtag: "", description: "", coverImage: "" });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create challenge:", error);
    }
  };

  const handleJoinChallenge = async (challengeId: number) => {
    try {
      await joinChallengeMutation.mutateAsync({ challengeId });
    } catch (error) {
      console.error("Failed to join challenge:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Challenges</h1>
          <p className="text-purple-200">Participate in trending hashtag challenges</p>
        </div>

        {/* Create Challenge Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Challenge"}
          </Button>
        )}

        {/* Create Challenge Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Hashtag</label>
                <Input
                  value={formData.hashtag}
                  onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
                  placeholder="Enter hashtag (e.g., #DanceChallenge)"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter challenge description"
                  className="w-full bg-slate-700 border border-purple-500 text-white rounded p-2"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Cover Image URL</label>
                <Input
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="Enter cover image URL"
                  className="bg-slate-700 border-purple-500 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createChallengeMutation.isPending}
              >
                {createChallengeMutation.isPending ? "Creating..." : "Create Challenge"}
              </Button>
            </form>
          </Card>
        )}

        {/* Trending Challenges */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Trending Challenges</h2>
          {loadingChallenges ? (
            <p className="text-purple-200">Loading challenges...</p>
          ) : trendingChallenges && trendingChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors overflow-hidden"
                >
                  {challenge.coverImage && (
                    <img
                      src={challenge.coverImage}
                      alt={challenge.hashtag}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}
                  <h3 className="text-lg font-bold text-white mb-2">{challenge.hashtag}</h3>
                  <p className="text-purple-200 text-sm mb-3 line-clamp-2">{challenge.description}</p>
                  <div className="flex justify-between items-center text-xs text-purple-300 mb-3">
                    <span>👥 {challenge.participants} participants</span>
                    <span>👁️ {challenge.views} views</span>
                  </div>
                  <Button
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled={joinChallengeMutation.isPending}
                  >
                    Join Challenge
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-purple-200">No challenges available</p>
          )}
        </div>
      </div>
    </div>
  );
}
