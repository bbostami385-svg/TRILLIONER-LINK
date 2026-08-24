import { useEffect, useState } from "react";
import { ListVideo, Lock, Plus, Share2, Trash2, Video, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function CreatorPlaylists() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [videoId, setVideoId] = useState("");
  const playlists = trpc.creatorPlaylists.mine.useQuery(undefined, { enabled: isAuthenticated && user?.accountMode === "creator", retry: false });
  const items = trpc.creatorPlaylists.items.useQuery({ playlistId: selectedPlaylistId ?? 0 }, { enabled: Boolean(selectedPlaylistId), retry: false });
  const createPlaylist = trpc.creatorPlaylists.create.useMutation();
  const deletePlaylistMutation = trpc.creatorPlaylists.delete.useMutation();
  const addVideo = trpc.creatorPlaylists.addVideo.useMutation();
  const removeItem = trpc.creatorPlaylists.removeItem.useMutation();

  useEffect(() => {
    if (!selectedPlaylistId && playlists.data?.[0]) setSelectedPlaylistId(playlists.data[0].id);
    if (selectedPlaylistId && playlists.data && !playlists.data.some((playlist) => playlist.id === selectedPlaylistId)) setSelectedPlaylistId(playlists.data[0]?.id ?? null);
  }, [playlists.data, selectedPlaylistId]);

  const submitPlaylist = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const created = await createPlaylist.mutateAsync({ name, description: description || undefined, isPublic });
      setName(""); setDescription(""); setIsPublic(false); setShowCreate(false);
      await utils.creatorPlaylists.mine.invalidate();
      if (created) setSelectedPlaylistId(created.id);
      toast.success("Playlist created.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create playlist."); }
  };

  const submitVideo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedPlaylistId || !videoId.trim() || !/^\d+$/.test(videoId.trim())) { toast.error("Enter a valid video ID."); return; }
    try {
      const result = await addVideo.mutateAsync({ playlistId: selectedPlaylistId, videoId: Number(videoId.trim()) });
      setVideoId(""); await utils.creatorPlaylists.items.invalidate({ playlistId: selectedPlaylistId });
      toast.success(result.alreadyAdded ? "That video is already in the playlist." : "Video added to playlist.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not add this video."); }
  };

  const removeVideo = async (itemId: number) => {
    if (!selectedPlaylistId) return;
    try { await removeItem.mutateAsync({ itemId }); await utils.creatorPlaylists.items.invalidate({ playlistId: selectedPlaylistId }); toast.success("Video removed from playlist."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not remove this video."); }
  };

  const sharePlaylist = async (playlistId: number, isPublic: boolean) => { if (!isPublic) { toast.error("Make this playlist public before sharing it."); return; } const url = `${window.location.origin}/playlist/${playlistId}`; await navigator.clipboard?.writeText(url); toast.success("Public playlist link copied."); };

  const removePlaylist = async (playlistId: number) => {
    try { await deletePlaylistMutation.mutateAsync({ playlistId }); await utils.creatorPlaylists.mine.invalidate(); toast.success("Playlist deleted."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete this playlist."); }
  };

  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="max-w-md border-white/10 bg-white/5 p-8 text-center"><ListVideo className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-4 text-2xl font-bold">Creator playlists</h1><p className="mt-2 text-slate-400">Sign in to curate your channel’s long-form videos.</p><Button className="mt-5" onClick={() => setLocation("/login")}>Sign in</Button></Card></main>;
  if (user?.accountMode !== "creator") return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="max-w-lg border-indigo-400/20 bg-white/5 p-8 text-center"><ListVideo className="mx-auto h-10 w-10 text-indigo-300" /><h1 className="mt-4 text-2xl font-bold">Playlists are a Creator tool</h1><p className="mt-2 text-slate-300">Switch your account to Creator Mode in Settings to organize long-form videos into channel playlists.</p><Button className="mt-5" onClick={() => setLocation("/settings")}>Open Settings</Button></Card></main>;

  return <main className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><ListVideo className="h-3.5 w-3.5" /> TRILLIONER LINK / Creator tools</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Playlists with a point of view.</h1><p className="mt-2 max-w-2xl text-slate-400">Organize your long-form channel into clear viewing paths. Shorts stay in the dedicated Shorts experience.</p></div><Button onClick={() => setShowCreate((value) => !value)} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">{showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showCreate ? "Close" : "New playlist"}</Button></header>
    {showCreate && <Card className="border-cyan-300/20 bg-cyan-500/5 p-5"><form onSubmit={submitPlaylist} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="grid gap-1.5 text-sm text-slate-300">Playlist name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={255} required placeholder="Design notes, field recordings…" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-400" /></label><label className="grid gap-1.5 text-sm text-slate-300">Description<input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="What viewers will find here" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-400" /></label><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Public</label><Button type="submit" disabled={createPlaylist.isPending}>{createPlaylist.isPending ? "Creating…" : "Create"}</Button></div></form></Card>}
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Your playlists</h2><span className="text-xs text-slate-500">{playlists.data?.length ?? 0} total</span></div>{playlists.isLoading && <Card className="border-white/10 bg-white/5 p-5 text-sm text-slate-400">Loading playlists…</Card>}{!playlists.isLoading && !playlists.data?.length && <Card className="border-white/10 bg-white/5 p-5 text-sm text-slate-400">Create your first playlist to give your channel a clear rhythm.</Card>}{playlists.data?.map((playlist) => <button key={playlist.id} onClick={() => setSelectedPlaylistId(playlist.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedPlaylistId === playlist.id ? "border-cyan-300/50 bg-cyan-500/10" : "border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{playlist.name}</p><p className="mt-1 line-clamp-2 text-xs text-slate-400">{playlist.description || "No description yet."}</p></div>{playlist.isPublic ? <Video className="h-4 w-4 shrink-0 text-cyan-300" /> : <Lock className="h-4 w-4 shrink-0 text-slate-500" />}</div><span className="mt-3 block text-[11px] uppercase tracking-wider text-slate-500">{playlist.isPublic ? "Public playlist" : "Private playlist"}</span></button>)}</aside><section><Card className="min-h-[420px] border-white/10 bg-white/[0.045] p-5">{!selectedPlaylistId ? <div className="grid min-h-[360px] place-items-center text-center"><ListVideo className="h-10 w-10 text-slate-600" /><p className="mt-3 text-slate-400">Select a playlist to manage its videos.</p></div> : <><div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Selected playlist</p><h2 className="mt-1 text-2xl font-bold">{playlists.data?.find((playlist) => playlist.id === selectedPlaylistId)?.name}</h2><p className="mt-1 text-sm text-slate-400">Add a published long-form video by its ID.</p></div><form onSubmit={submitVideo} className="flex gap-2"><input inputMode="numeric" value={videoId} onChange={(event) => setVideoId(event.target.value)} placeholder="Video ID" className="w-28 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400" /><Button type="submit" disabled={addVideo.isPending}><Plus className="mr-1.5 h-4 w-4" />Add</Button></form></div>{items.isLoading && <p className="py-8 text-sm text-slate-400">Loading playlist videos…</p>}{!items.isLoading && !items.data?.length && <div className="grid min-h-[250px] place-items-center text-center"><Video className="h-9 w-9 text-slate-600" /><p className="mt-3 text-sm text-slate-400">No public long-form videos yet.</p></div>}{items.data && items.data.length > 0 && <div className="mt-5 space-y-3">{items.data.map((item, index) => <div key={item.itemId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"><span className="w-5 text-center text-xs text-slate-500">{index + 1}</span>{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-14 w-24 rounded-lg object-cover" /> : <div className="grid h-14 w-24 place-items-center rounded-lg bg-slate-900 text-slate-600"><Video className="h-5 w-5" /></div>}<div className="min-w-0 flex-1"><p className="truncate font-medium">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">Video #{item.videoId} · {item.views.toLocaleString()} views</p></div><Button aria-label={`Remove ${item.title}`} variant="outline" onClick={() => void removeVideo(item.itemId)} className="border-rose-300/20 bg-transparent text-rose-200 hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></Button></div>)}</div>}<div className="mt-6 flex flex-wrap gap-2"><Button variant="outline" onClick={() => void sharePlaylist(selectedPlaylistId, Boolean(playlists.data?.find((playlist) => playlist.id === selectedPlaylistId)?.isPublic))} className="border-cyan-300/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"><Share2 className="mr-2 h-4 w-4" />Copy public link</Button><Button variant="outline" onClick={() => void removePlaylist(selectedPlaylistId)} className="border-rose-300/20 bg-transparent text-rose-200 hover:bg-rose-500/10"><Trash2 className="mr-2 h-4 w-4" />Delete playlist</Button></div></>}</Card></section></div></div></main>;
}
