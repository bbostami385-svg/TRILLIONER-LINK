import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export function SoundLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("");

  const { data: trendingSounds, isLoading: loadingTrending } = trpc.sounds.getTrendingSounds.useQuery({
    limit: 20,
  });

  const { data: searchResults, isLoading: loadingSearch } = trpc.sounds.searchSounds.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 0 }
  );

  const { data: artistSounds, isLoading: loadingArtist } = trpc.sounds.getSoundsByArtist.useQuery(
    { artist: selectedArtist, limit: 20 },
    { enabled: selectedArtist.length > 0 }
  );

  const incrementUsesMutation = trpc.sounds.incrementUses.useMutation();

  const handlePlaySound = async (soundId: number) => {
    try {
      await incrementUsesMutation.mutateAsync(
        { soundId },
        {
          onSuccess: () => {
            alert("Sound added to your library!");
          },
          onError: (error) => {
            alert(`Error: ${error.message}`);
          },
        }
      );
    } catch (error) {
      console.error("Failed to play sound:", error);
    }
  };

  const displaySounds = searchQuery ? searchResults : selectedArtist ? artistSounds : trendingSounds;
  const isLoading = searchQuery ? loadingSearch : selectedArtist ? loadingArtist : loadingTrending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Sound Library</h1>
          <p className="text-purple-200">Discover trending sounds and music</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Search Sounds</label>
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedArtist("");
              }}
              placeholder="Search by title..."
              className="bg-slate-700 border-purple-500 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-2">Filter by Artist</label>
            <Input
              value={selectedArtist}
              onChange={(e) => {
                setSelectedArtist(e.target.value);
                setSearchQuery("");
              }}
              placeholder="Search by artist..."
              className="bg-slate-700 border-purple-500 text-white"
            />
          </div>
        </div>

        {/* Sounds Grid */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {searchQuery ? "Search Results" : selectedArtist ? "Artist Sounds" : "Trending Sounds"}
          </h2>
          {isLoading ? (
            <p className="text-purple-200">Loading sounds...</p>
          ) : displaySounds && displaySounds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displaySounds.map((sound: any) => (
                <Card key={sound.id} className="p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-white truncate">{sound.title}</h3>
                    <p className="text-purple-300 text-sm">{sound.artist || "Unknown Artist"}</p>
                  </div>

                  <div className="space-y-2 text-sm text-purple-200 mb-4">
                    <p>⏱️ {sound.duration ? Math.floor(sound.duration / 60) : 0}:{String((sound.duration || 0) % 60).padStart(2, "0")}</p>
                    <p>👁️ {sound.uses} uses</p>
                    <p>❤️ {sound.likes} likes</p>
                  </div>

                  <Button
                    onClick={() => handlePlaySound(sound.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
                    disabled={incrementUsesMutation.isPending}
                  >
                    🎵 Use Sound
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-purple-200">No sounds found</p>
          )}
        </div>

        {/* Info */}
        <Card className="mt-8 p-6 bg-slate-800 border-purple-500">
          <h2 className="text-2xl font-bold text-white mb-4">About Sound Library</h2>
          <div className="space-y-3 text-purple-200">
            <p>
              <strong>Trending Sounds:</strong> Discover the most popular sounds being used on the platform.
            </p>
            <p>
              <strong>Search:</strong> Find sounds by title or artist name.
            </p>
            <p>
              <strong>Use Sound:</strong> Click "Use Sound" to add it to your content.
            </p>
            <p>
              <strong>Sound Stats:</strong> See how many times each sound has been used and liked.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
