import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function Collections() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  const { data: userCollections, isLoading: loadingCollections } = trpc.collections.getUserCollections.useQuery(
    { userId: user?.id || 0 },
    { enabled: !!user }
  );

  const createCollectionMutation = trpc.collections.createCollection.useMutation();

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollectionMutation.mutateAsync(formData);
      setFormData({ name: "", description: "", isPublic: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create collection:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Collections</h1>
          <p className="text-purple-200">Save and organize your favorite content</p>
        </div>

        {/* Create Collection Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Collection"}
          </Button>
        )}

        {/* Create Collection Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Collection Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter collection name"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter collection description"
                  className="w-full bg-slate-700 border border-purple-500 text-white rounded p-2"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-purple-200">Make Public</label>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createCollectionMutation.isPending}
              >
                {createCollectionMutation.isPending ? "Creating..." : "Create Collection"}
              </Button>
            </form>
          </Card>
        )}

        {/* User Collections */}
        {user && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Your Collections</h2>
            {loadingCollections ? (
              <p className="text-purple-200">Loading collections...</p>
            ) : userCollections && userCollections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userCollections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors cursor-pointer"
                  >
                    <h3 className="text-lg font-bold text-white mb-2">{collection.name}</h3>
                    <p className="text-purple-200 text-sm mb-3">{collection.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-purple-300">
                        {collection.isPublic ? "🌐 Public" : "🔒 Private"}
                      </span>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-purple-200">You haven't created any collections yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
