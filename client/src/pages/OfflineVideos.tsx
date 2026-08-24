import { useEffect, useMemo, useState } from "react";
import { Download, Trash2, WifiOff } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getOfflineVideoRecords, getOfflineVideoUrl, removeOfflineVideo, sortOfflineVideoRecords, type OfflineVideoRecord, type OfflineSort } from "@/lib/offlineVideos";

function formatBytes(value?: number) { if (!value) return "Size unavailable"; const units = ["B", "KB", "MB", "GB"]; let size = value; let unit = 0; while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; } return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`; }

export default function OfflineVideos() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [records, setRecords] = useState<OfflineVideoRecord[]>([]);
  const [urls, setUrls] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<OfflineSort>("date");
  const sortedRecords = useMemo(() => sortOfflineVideoRecords(records, sortBy), [records, sortBy]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = getOfflineVideoRecords();
      const pairs = await Promise.all(next.map(async (record) => [record.id, await getOfflineVideoUrl(record.videoUrl)] as const));
      if (!active) return;
      setRecords(next);
      setUrls(Object.fromEntries(pairs.filter(([, url]) => Boolean(url)) as Array<[number, string]>));
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  useEffect(() => () => { Object.values(urls).forEach((url) => URL.revokeObjectURL(url)); }, [urls]);

  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="max-w-md border-white/10 bg-white/5 p-8 text-center"><WifiOff className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-4 text-2xl font-bold">Your offline library</h1><p className="mt-2 text-slate-400">Sign in to save Creator videos for offline viewing on this browser.</p><Button className="mt-5" onClick={() => setLocation("/login")}>Sign in</Button></Card></main>;

  return <main className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-col gap-4 rounded-3xl border border-cyan-300/20 bg-cyan-500/5 p-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">TRILLIONER LINK / Offline library</p><h1 className="mt-2 text-3xl font-bold">Saved for the quiet moments.</h1><p className="mt-2 max-w-2xl text-slate-300">Saved videos are available from this browser even when the network is unavailable. Storage stays on your device.</p></div><div className="flex flex-wrap items-center gap-2"><label className="text-xs text-slate-400">Sort<select value={sortBy} onChange={(event) => setSortBy(event.target.value as OfflineSort)} className="ml-2 rounded-lg border border-cyan-300/20 bg-slate-950/80 px-2 py-2 text-xs text-white"><option value="date">Newest saved</option><option value="size">Largest file</option></select></label><span className="rounded-2xl border border-cyan-300/20 bg-black/20 px-4 py-3 text-sm text-cyan-100">{records.length} saved</span></div></header>{loading && <Card className="border-white/10 bg-white/5 p-8 text-center text-slate-400">Preparing your offline library…</Card>}{!loading && records.length === 0 && <Card className="border-white/10 bg-white/5 p-10 text-center"><Download className="mx-auto h-9 w-9 text-slate-500" /><h2 className="mt-3 text-xl font-semibold">Nothing saved yet</h2><p className="mt-2 text-sm text-slate-400">Use the bookmark control in Creator Video to save a video for offline viewing.</p><Button className="mt-5" onClick={() => setLocation("/videos")}>Browse Creator videos</Button></Card>}{!loading && records.length > 0 && <div className="grid gap-5 md:grid-cols-2">{sortedRecords.map((record) => <Card key={record.id} className="overflow-hidden border-white/10 bg-white/[0.045]"><div className="aspect-video bg-black">{urls[record.id] ? <video src={urls[record.id]} poster={record.thumbnailUrl ?? undefined} controls playsInline className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center p-6 text-center text-sm text-slate-400">This saved copy is unavailable. Save it again while online.</div>}</div><div className="p-4"><h2 className="truncate font-semibold">{record.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-400">{record.description || "Saved Creator video"}</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">Saved {new Date(record.savedAt).toLocaleDateString()} · {record.qualityLabel ?? "Original"} · {formatBytes(record.sizeBytes)}</span><Button variant="outline" onClick={() => { void removeOfflineVideo(record.id, record.videoUrl).then(() => { setRecords((current) => current.filter((item) => item.id !== record.id)); setUrls((current) => { const next = { ...current }; if (next[record.id]) URL.revokeObjectURL(next[record.id]); delete next[record.id]; return next; }); toast.success("Removed from offline library."); }); }} className="border-rose-300/20 bg-transparent text-rose-200 hover:bg-rose-500/10"><Trash2 className="mr-1.5 h-4 w-4" />Remove</Button></div></div></Card>)}</div>}</div></main>;
}
