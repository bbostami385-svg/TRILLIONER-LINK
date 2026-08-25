import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import VideoFeedSkeleton from "@/components/VideoFeedSkeleton";
import { Clock3, Heart, RefreshCw } from "lucide-react";
import { ReactionPicker } from "@/components/VideoReactionControls";
import VideoShareMenu from "@/components/VideoShareMenu";
import { isWatchLaterSaved, toggleWatchLater } from "@/lib/watchLater";
import { toast } from "sonner";

export function ReelsPage() {
  const { user, isAuthenticated } = useAuth();
  const addToHistory = trpc.history.addToHistory.useMutation();
  const historyRecorded = useRef<Set<number>>(new Set());
  const [, setLocation] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const formTouchStart = useRef<number | null>(null);
  const [selectedReactions, setSelectedReactions] = useState<Record<number, string>>({});
  const [heartBurstId, setHeartBurstId] = useState<number | null>(null);
  const [watchLaterSaved, setWatchLaterSaved] = useState<Record<number, boolean>>({});
  const [formData, setFormData] = useState({
    videoUrl: "",
    caption: "",
    thumbnail: "",
    duration: 0,
  });

  const { data: trendingReels, isLoading: loadingReels, refetch: refetchReels } = trpc.reels.getTrendingReels.useQuery({
    limit: 20,
  });

  const createReelMutation = trpc.reels.createReel.useMutation();
  const refreshShorts = async () => { if (refreshing) return; setRefreshing(true); try { await refetchReels(); } finally { setRefreshing(false); } };
  const onFeedTouchStart = (event: React.TouchEvent) => { const y = event.touches[0]?.clientY ?? null; formTouchStart.current = y; setPullStart(typeof window !== "undefined" && window.scrollY <= 4 ? y : null); };
  const onFeedTouchMove = (event: React.TouchEvent) => { if (pullStart === null) return; const current = event.touches[0]?.clientY ?? pullStart; setPullDistance(Math.min(96, Math.max(0, current - pullStart))); };
  const onFeedTouchEnd = (event: React.TouchEvent) => { if (formTouchStart.current === null) return; const delta = (event.changedTouches[0]?.clientY ?? formTouchStart.current) - formTouchStart.current; if (pullDistance >= 72) void refreshShorts(); formTouchStart.current = null; setPullStart(null); setPullDistance(0); if (pullDistance < 72 && Math.abs(delta) > 48) return; };
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
  useEffect(() => { if (trendingReels) setWatchLaterSaved(Object.fromEntries(trendingReels.map((reel) => [reel.id, isWatchLaterSaved(reel.id, "short")]))); }, [trendingReels]);
  const handleDoubleTapReel = (reelId: number) => { setHeartBurstId(reelId); window.setTimeout(() => setHeartBurstId((current) => current === reelId ? null : current), 850); void handleLikeReel(reelId); };
  const chooseReelReaction = (reelId: number, reaction: string) => { setSelectedReactions((current) => ({ ...current, [reelId]: reaction })); void handleLikeReel(reelId); };
  const recordReelPlayback = (reelId: number) => { if (!isAuthenticated || historyRecorded.current.has(reelId)) return; historyRecorded.current.add(reelId); void addToHistory.mutateAsync({ reelId }).catch(() => { historyRecorded.current.delete(reelId); }); };
  const saveReelToWatchLater = (reel: NonNullable<typeof trendingReels>[number]) => { const result = toggleWatchLater({ id: reel.id, title: reel.caption || "TRILLIONER LINK Short", description: reel.caption, videoUrl: reel.videoUrl, thumbnailUrl: reel.thumbnail, creatorName: `Creator #${reel.userId}`, mediaType: "short" }); setWatchLaterSaved((current) => ({ ...current, [reel.id]: result.saved })); toast.success(result.saved ? "Short added to Watch Later." : "Short removed from Watch Later."); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4" onTouchStart={onFeedTouchStart} onTouchMove={onFeedTouchMove} onTouchEnd={onFeedTouchEnd}><div className={`mx-auto flex items-center justify-center overflow-hidden text-xs text-purple-100 transition-all ${pullDistance > 0 || refreshing ? "h-9 opacity-100" : "h-0 opacity-0"}`} style={{ transform: `translateY(${Math.min(pullDistance, 20)}px)` }} aria-live="polite"><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Refreshing Shorts…" : pullDistance >= 72 ? "Release to refresh" : "Pull down to refresh"}</div>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">TRILLIONER LINK / Short-form</p><h1 className="text-4xl font-bold text-white mb-2">Shorts</h1><p className="text-purple-200">Fast, vertical videos built for discovery.</p></div><Button onClick={() => setLocation("/videos")} variant="outline" className="border-purple-300/30 bg-transparent text-white hover:bg-purple-500/15 hover:text-white">Open long-form videos</Button></div>
        </div>

        {/* Create Short Button */}
        {user && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {showCreateForm ? "Cancel" : "Create Short"}
          </Button>
        )}

        {/* Create Short Form */}
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
                {createReelMutation.isPending ? "Creating..." : "Create Short"}
              </Button>
            </form>
          </Card>
        )}

        {/* Trending Reels */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Trending Shorts</h2>
          {loadingReels ? (
            <VideoFeedSkeleton variant="short" />
          ) : trendingReels && trendingReels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trendingReels.map((reel) => (
                <Card
                  key={reel.id}
                  className="relative p-4 bg-slate-800 border-purple-500 hover:border-pink-500 transition-colors overflow-hidden" onDoubleClick={() => handleDoubleTapReel(reel.id)}
                >
                  {heartBurstId === reel.id && <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center" aria-hidden="true"><Heart className="h-24 w-24 animate-ping text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.8)]" /></div>}
                  <video src={reel.videoUrl} poster={reel.thumbnail || undefined} controls playsInline onPlay={() => recordReelPlayback(reel.id)} className="w-full h-48 rounded mb-3 bg-black object-cover" aria-label={reel.caption || "Short video"} />
                  <p className="text-purple-200 text-sm mb-3 line-clamp-2">{reel.caption}</p>
                  <div className="flex justify-between items-center text-xs text-purple-300 mb-3">
                    <span>👁️ {reel.views} views</span>
                    <span>❤️ {reel.likes} likes</span>
                    <span>💬 {reel.comments} comments</span>
                  </div>
                  <div className="flex items-center gap-2"><ReactionPicker compact selected={selectedReactions[reel.id]} onSelect={(reaction) => chooseReelReaction(reel.id, reaction)} onLike={() => void handleLikeReel(reel.id)} /><VideoShareMenu title={reel.caption || "TRILLIONER LINK Short"} text={reel.caption || undefined} url={`${window.location.origin}/shorts?video=${reel.id}`} /><button type="button" aria-label={watchLaterSaved[reel.id] ? "Remove Short from Watch Later" : "Save Short to Watch Later"} onClick={() => saveReelToWatchLater(reel)} className={`grid h-10 w-10 place-items-center rounded-full transition ${watchLaterSaved[reel.id] ? "bg-amber-300 text-slate-950" : "bg-white/10 text-white hover:bg-white/20"}`}><Clock3 className="h-4 w-4" /></button></div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-purple-200">No Shorts available yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
