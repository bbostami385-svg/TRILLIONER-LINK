import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export function PagesPage() {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { data: popularPages, isLoading: loadingPopular } = trpc.pages.getPopularPages.useQuery({
    limit: 20,
  });

  const { data: searchResults, isLoading: loadingSearch } = trpc.pages.searchPages.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createPageMutation = trpc.pages.createPage.useMutation();
  const followPageMutation = trpc.pages.followPage.useMutation();

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const utils = trpc.useUtils();
      await createPageMutation.mutateAsync(
        {
          name: formData.name,
          description: formData.description,
        },
        {
          onSuccess: () => {
            setFormData({ name: "", description: "" });
            setShowCreateForm(false);
            utils.pages.getPopularPages.invalidate();
            alert("Page created successfully!");
          },
          onError: (error) => {
            alert(`Error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error("Failed to create page:", error);
    }
  };

  const handleFollowPage = async (pageId: number) => {
    try {
      const utils = trpc.useUtils();
      await followPageMutation.mutateAsync(
        { pageId },
        {
          onSuccess: () => {
            utils.pages.getPopularPages.invalidate();
            alert("Page followed!");
          },
          onError: (error) => {
            alert(`Error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error("Failed to follow page:", error);
    }
  };

  const displayPages = searchQuery ? searchResults : popularPages;
  const isLoading = searchQuery ? loadingSearch : loadingPopular;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Pages & Channels</h1>
          <p className="text-purple-200">Discover and follow popular pages</p>
        </div>

        {/* Create Page Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Page"}
          </Button>
        )}

        {/* Create Page Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6 bg-slate-800 border-purple-500">
            <form onSubmit={handleCreatePage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Page Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter page name"
                  className="bg-slate-700 border-purple-500 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter page description"
                  className="bg-slate-700 border-purple-500 text-white"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={createPageMutation.isPending}
              >
                {createPageMutation.isPending ? "Creating..." : "Create Page"}
              </Button>
            </form>
          </Card>
        )}

        {/* Search */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-purple-200 mb-2">Search Pages</label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by page name..."
            className="bg-slate-700 border-purple-500 text-white"
          />
        </div>

        {/* Pages Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {searchQuery ? "Search Results" : "Popular Pages"}
          </h2>
          {isLoading ? (
            <p className="text-purple-200">Loading pages...</p>
          ) : displayPages && displayPages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayPages.map((page: any) => (
                <Card
                  key={page.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white truncate">{page.name}</h3>
                    <p className="text-purple-300 text-sm line-clamp-2">{page.description}</p>
                  </div>

                  <div className="space-y-2 text-sm text-purple-200 mb-4">
                    <p>👥 {page.followers} followers</p>
                    {page.isVerified && <p>✅ Verified</p>}
                  </div>

                  <Button
                    onClick={() => handleFollowPage(page.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled={followPageMutation.isPending}
                  >
                    Follow
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-purple-200">No pages found</p>
          )}
        </div>

        {/* Info */}
        <Card className="mt-8 p-6 bg-slate-800 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">About Pages</h2>
          <div className="space-y-3 text-purple-200">
            <p>
              <strong>Create Page:</strong> Start your own page to share content with followers.
            </p>
            <p>
              <strong>Follow Pages:</strong> Stay updated with content from your favorite pages.
            </p>
            <p>
              <strong>Popular Pages:</strong> Discover trending pages in the community.
            </p>
            <p>
              <strong>Verified Pages:</strong> Follow verified pages for authentic content.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
