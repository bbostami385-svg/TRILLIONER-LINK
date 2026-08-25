import { useState } from "react";
import { Clock3, ExternalLink, History, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMiniPlayer } from "@/components/MiniPlayer";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string) { return new Date(value).toLocaleString(); }
function formatDuration(value: number | null | undefined) { if (!value) return "Duration unavailable"; const minutes = Math.floor(value / 60); const seconds = value % 60; return `${minutes}:${String(seconds).padStart(2, "0")}`; }

export default function WatchHistory() {
  const utils = trpc.useUtils();
  const { open } = useMiniPlayer();
  const [limit] = useState(50);
  const history = trpc.history.getWatchHistory.useQuery({ limit });
  const clear = trpc.history.clearWatchHistory.useMutation({ onSuccess: () => void utils.history.getWatchHistory.invalidate() });
  const remove = trpc.history.removeFromHistory.useMutation({ onSuccess: () => void utils.history.getWatchHistory.invalidate() });

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/10 via-slate-950/40 to-indigo-500/10 p-6 shadow-xl"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">TRILLIONER LINK / WATCH HISTORY</p><h1 className="mt-2 text-3xl font-bold">Your viewing trail.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Continue from videos you have watched recently. Your history is private to your account and can be cleared at any time.</p></div><Button variant="outline" disabled={clear.isPending || !history.data?.length} onClick={() => clear.mutate()} className="border-rose-300/25 bg-transparent text-rose-200 hover:bg-rose-500/10"><Trash2 className="mr-2 h-4 w-4" />Clear history</Button></div></header>
    {history.isLoading && <div className="grid gap-4 sm:grid-cols-2">{[1,2,3,4].map((item) => <Card key={item} className="h-32 animate-pulse border-border bg-card" />)}</div>}
    {history.error && <Card className="border-rose-300/30 bg-rose-500/10 p-6 text-rose-200">Could not load your watch history. Please try again.</Card>}
    {!history.isLoading && !history.error && history.data?.length === 0 && <Card className="p-10 text-center"><History className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">No watch history yet</h2><p className="mt-2 text-sm text-muted-foreground">Videos you watch will appear here so you can return to them quickly.</p><Link href="/videos"><Button className="mt-6">Browse long-form videos</Button></Link></Card>}
    {!history.isLoading && !history.error && !!history.data?.length && <section className="space-y-3" aria-label="Watch history list">{history.data.map(({ history: item, video }) => <Card key={item.id} className="overflow-hidden border-border bg-card"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"><div className="aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:w-48">{video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-muted-foreground"><Clock3 className="h-8 w-8" /></div>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-200">{video.category || "Long-form video"}</span><span>Watched {formatDate(item.watchedAt)}</span></div><h2 className="mt-2 truncate text-lg font-semibold">{video.title}</h2><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{video.description || "No description provided."}</p><p className="mt-2 text-xs text-muted-foreground">{formatDuration(video.duration)} · {video.views.toLocaleString()} views</p></div><div className="flex shrink-0 flex-wrap gap-2 sm:flex-col"><Button onClick={() => open({ id: video.id, title: video.title, videoUrl: video.videoUrl, thumbnailUrl: video.thumbnailUrl, mediaType: "long" })}><ExternalLink className="mr-2 h-4 w-4" />Resume</Button><Button variant="outline" disabled={remove.isPending} onClick={() => remove.mutate({ historyId: item.id })} className="border-border"><Trash2 className="mr-2 h-4 w-4" />Remove</Button></div></div></Card>)}</section>}
  </div></main>;
}
