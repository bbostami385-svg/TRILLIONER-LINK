import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function AdsDashboard() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    postId: 0,
    budget: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const { data: userAds, isLoading: loadingAds } = trpc.ads.getUserAds.useQuery(undefined, {
    enabled: !!user,
  });

  const createAdMutation = trpc.ads.createSponsoredPost.useMutation();
  const updateAdStatusMutation = trpc.ads.updateAdStatus.useMutation();

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdMutation.mutateAsync({
        postId: formData.postId,
        budget: formData.budget,
        startDate: new Date(formData.startDate),
      });
      setFormData({
        postId: 0,
        budget: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create ad:", error);
    }
  };

  const handleUpdateAdStatus = async (adId: number, status: "active" | "paused" | "ended") => {
    try {
      await updateAdStatusMutation.mutateAsync({ adId, status });
    } catch (error) {
      console.error("Failed to update ad status:", error);
    }
  };

  const calculateCTR = (ad: any) => {
    if (ad.impressions === 0) return 0;
    return ((ad.clicks / ad.impressions) * 100).toFixed(2);
  };

  const calculateCPC = (ad: any) => {
    if (ad.clicks === 0) return 0;
    return (parseFloat(ad.spent) / ad.clicks).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Ads Dashboard</h1>
          <p className="text-purple-200">Manage your sponsored posts and campaigns</p>
        </div>

        {/* Create Ad Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Ad"}
          </Button>
        )}

        {/* Create Ad Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Post ID</label>
                <Input
                  type="number"
                  value={formData.postId}
                  onChange={(e) => setFormData({ ...formData, postId: parseInt(e.target.value) })}
                  placeholder="Enter post ID"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Budget</label>
                <Input
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="Enter budget amount"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createAdMutation.isPending}
              >
                {createAdMutation.isPending ? "Creating..." : "Create Ad"}
              </Button>
            </form>
          </Card>
        )}

        {/* User Ads */}
        {user && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Ads</h2>
            {loadingAds ? (
              <p className="text-purple-200">Loading ads...</p>
            ) : userAds && userAds.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAds.map((ad) => (
                  <Card key={ad.id} className="p-4 bg-slate-800 border-purple-500">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-white mb-1">Post #{ad.postId}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          ad.status === "active"
                            ? "bg-green-600"
                            : ad.status === "paused"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                        }`}
                      >
                        {ad.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-purple-200 mb-4">
                      <p>💰 Budget: ${ad.budget}</p>
                      <p>💸 Spent: ${ad.spent}</p>
                      <p>👁️ Impressions: {ad.impressions}</p>
                      <p>🖱️ Clicks: {ad.clicks}</p>
                      <p>📊 CTR: {calculateCTR(ad)}%</p>
                      <p>💵 CPC: ${calculateCPC(ad)}</p>
                    </div>

                    <div className="flex gap-2">
                      {ad.status !== "active" && (
                        <Button
                          onClick={() => handleUpdateAdStatus(ad.id, "active")}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={updateAdStatusMutation.isPending}
                        >
                          Activate
                        </Button>
                      )}
                      {ad.status === "active" && (
                        <Button
                          onClick={() => handleUpdateAdStatus(ad.id, "paused")}
                          size="sm"
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                          disabled={updateAdStatusMutation.isPending}
                        >
                          Pause
                        </Button>
                      )}
                      {ad.status !== "ended" && (
                        <Button
                          onClick={() => handleUpdateAdStatus(ad.id, "ended")}
                          size="sm"
                          className="flex-1 bg-red-600 hover:bg-red-700"
                          disabled={updateAdStatusMutation.isPending}
                        >
                          End
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-purple-200">You don't have any ads yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
