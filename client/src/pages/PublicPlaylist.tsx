import { useState } from "react";
import { Check, Copy, Facebook, ListVideo, Linkedin, Play, Send, Share2, Video } from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getSocialShareUrl, shareOrCopy, type ShareTarget } from "@/lib/share";

const shareTargets: Array<{ id: ShareTarget; label: string; icon: typeof Facebook; className: string }> = [
  { id: "whatsapp", label: "WhatsApp", icon: Send, className: "text-emerald-200 hover:bg-emerald-500/15" },
  { id: "facebook", label: "Facebook", icon: Facebook, className: "text-blue-200 hover:bg-blue-500/15" },
  { id: "x", label: "X", icon: Share2, className: "text-slate-100 hover:bg-white/10" },
  { id: "telegram", label: "Telegram", icon: Send, className: "text-sky-200 hover:bg-sky-500/15" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, className: "text-cyan-200 hover:bg-cyan-500/15" },
];

export default function PublicPlaylist() {
  const params = useParams<{ playlistId: string }>();
  const playlistId = Number(params.playlistId);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const playlist = trpc.creatorPlaylists.publicItems.useQuery({ playlistId }, { enabled: Number.isInteger(playlistId) && playlistId > 0, retry: false });
  const openVideo = (videoId: number) => { window.location.href = `/videos?video=${videoId}`; };
  const playlistUrl = typeof window === "undefined" ? `/playlist/${playlistId}` : `${window.location.origin}/playlist/${playlistId}`;
  const sharePayload = { title: `${playlist.data?.name ?? "Public playlist"} on TRILLIONER LINK`, text: playlist.data?.description || "Watch this public playlist on TRILLIONER LINK.", url: playlistUrl };

  const sharePlaylist = async () => {
    try {
      await shareOrCopy(sharePayload);
      setCopied(true);
      toast.success("Playlist link is ready to share.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "We could not share this playlist.");
    }
  };

  if (playlist.isLoading) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="border-white/10 bg-white/5 p-8 text-center text-slate-300">Loading playlist…</Card></main>;
  if (playlist.error || !playlist.data) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="max-w-md border-white/10 bg-white/5 p-8 text-center"><ListVideo className="mx-auto h-10 w-10 text-slate-600" /><h1 className="mt-4 text-2xl font-bold">Playlist unavailable</h1><p className="mt-2 text-slate-400">This playlist is private, removed, or no longer available.</p><Button className="mt-5" onClick={() => { window.location.href = "/videos"; }}>Browse videos</Button></Card></main>;

  return <main className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-5xl space-y-6"><header className="rounded-3xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_42%),rgba(255,255,255,0.04)] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><ListVideo className="h-3.5 w-3.5" /> TRILLIONER LINK / Public playlist</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{playlist.data.name}</h1><p className="mt-2 max-w-2xl text-slate-300">{playlist.data.description || "A curated long-form viewing path from a TRILLIONER LINK Creator."}</p></div><div className="relative shrink-0"><Button onClick={() => setShareOpen((value) => !value)} aria-expanded={shareOpen} aria-haspopup="menu" className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Share2 className="mr-2 h-4 w-4" />{copied ? "Copied" : "Share playlist"}</Button>{shareOpen && <div role="menu" className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-white/10 bg-[#101522] p-3 shadow-2xl"><button role="menuitem" onClick={() => void sharePlaylist()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-white/10"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</span>{copied ? "Link copied" : "Share or copy link"}</button><div className="my-2 border-t border-white/10" />{shareTargets.map(({ id, label, icon: Icon, className }) => <a key={id} role="menuitem" href={getSocialShareUrl(id, sharePayload)} target="_blank" rel="noreferrer noopener" onClick={() => setShareOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${className}`}><Icon className="h-4 w-4" />Share to {label}</a>)}</div>}</div></div><p className="mt-5 text-xs uppercase tracking-wider text-slate-500">{playlist.data.items.length} video{playlist.data.items.length === 1 ? "" : "s"} · Shorts stay in their own experience</p></header>{playlist.data.items.length === 0 ? <Card className="border-white/10 bg-white/[0.045] p-10 text-center"><Video className="mx-auto h-9 w-9 text-slate-600" /><p className="mt-3 text-slate-400">This playlist is ready for its first public video.</p></Card> : <div className="space-y-3">{playlist.data.items.map((item, index) => <button key={item.itemId} onClick={() => openVideo(item.videoId)} className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:border-cyan-300/30 hover:bg-white/[0.08]"><span className="w-6 text-center text-sm text-slate-500">{index + 1}</span>{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt="" className="h-20 w-32 rounded-xl object-cover" /> : <div className="grid h-20 w-32 place-items-center rounded-xl bg-slate-900 text-slate-600"><Play className="h-6 w-6" /></div>}<span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.title}</span><span className="mt-1 block line-clamp-2 text-sm text-slate-400">{item.description || "Open this Creator video."}</span><span className="mt-2 block text-xs text-slate-500">{item.views.toLocaleString()} views</span></span><Play className="h-5 w-5 shrink-0 text-cyan-300" /></button>)}</div>}</div></main>;
}
