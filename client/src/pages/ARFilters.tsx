import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function ARFiltersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: trendingFilters, isLoading: loadingFilters } = trpc.arFilters.getTrendingARFilters.useQuery({
    limit: 20,
  });

  const { data: searchResults, isLoading: loadingSearch, isError: searchError } = trpc.arFilters.searchARFilters.useQuery(
    { query: searchQuery.trim(), limit: 20 },
    { enabled: searchQuery.trim().length > 0 }
  );

  const useFilterMutation = trpc.arFilters.incrementUses.useMutation({ onSuccess: () => toast.success("Filter added to your library."), onError: (error) => toast.error(error.message) });

  const handleUseFilter = async (filterId: number) => {
    try {
      await useFilterMutation.mutateAsync({ filterId });
    } catch (error) {
      console.error("Failed to use filter:", error);
    }
  };

  const displayFilters = searchQuery ? searchResults : trendingFilters;
  const isLoading = searchQuery ? loadingSearch : loadingFilters;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AR Filters</h1>
          <p className="text-purple-200">Discover and use augmented reality filters</p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-purple-200 mb-2">Search Filters</label>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="bg-slate-700 border-purple-500 text-white"
          />
        </div>

        {/* Filters Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            Trending Filters
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item} className="h-64 animate-pulse border-purple-500/30 bg-slate-800" />)}</div>
          ) : searchError ? (
            <Card className="border-rose-300/30 bg-rose-500/10 p-6 text-rose-100">Filter search is temporarily unavailable. Please try again shortly.</Card>
          ) : displayFilters && displayFilters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayFilters.map((filter: any) => (
                <Card
                  key={filter.id}
                  className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors overflow-hidden"
                >
                  {filter.thumbnail && (
                    <img
                      src={filter.thumbnail}
                      alt={filter.name}
                      className="w-full h-40 object-cover rounded mb-3"
                    />
                  )}

                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white truncate">{filter.name}</h3>
                    <p className="text-purple-300 text-sm">AR Filter</p>
                  </div>

                  <div className="space-y-2 text-sm text-purple-200 mb-4">
                    <p>✨ Augmented Reality</p>
                    <p>🔗 {filter.filterUrl?.substring(0, 30)}...</p>
                  </div>

                  <Button
                    onClick={() => handleUseFilter(filter.filterId || filter.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled={useFilterMutation.isPending}
                  >
                    ✨ Try Filter
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-white/10 bg-white/5 p-8 text-center"><p className="text-purple-200">{searchQuery ? `No public filters match “${searchQuery}”.` : "No public filters are available yet."}</p><p className="mt-2 text-sm text-slate-400">Try another filter name or check back after creators publish new effects.</p></Card>
          )}
        </div>

        {/* Info */}
        <Card className="mt-8 p-6 bg-slate-800 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">About AR Filters</h2>
          <div className="space-y-3 text-purple-200">
            <p>
              <strong>Trending Filters:</strong> Discover the most popular AR filters being used on the platform.
            </p>
            <p>
              <strong>Try Filter:</strong> Click "Try Filter" to preview and use the filter in your content.
            </p>
            <p>
              <strong>AR Technology:</strong> Use cutting-edge augmented reality to enhance your videos and photos.
            </p>
            <p>
              <strong>Creator Tools:</strong> Create and share your own AR filters with the community.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
