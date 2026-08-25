import { useParams, useLocation } from "wouter";
import { ArrowLeft, FolderOpen, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function CollectionDetail() {
  const { collectionId } = useParams<{ collectionId: string }>();
  const [, setLocation] = useLocation();
  const id = Number(collectionId);
  const collection = trpc.collections.getCollection.useQuery({ collectionId: id }, { enabled: Number.isInteger(id) && id > 0 });
  const items = trpc.collections.getCollectionItems.useQuery({ collectionId: id }, { enabled: Number.isInteger(id) && id > 0 });

  if (collection.isLoading || items.isLoading) return <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6"><Card className="mx-auto max-w-3xl animate-pulse border-purple-500/30 bg-slate-800 p-10"><div className="h-8 w-2/3 rounded bg-white/10" /><div className="mt-4 h-4 w-full rounded bg-white/10" /><div className="mt-8 h-40 rounded bg-white/10" /></Card></main>;
  if (collection.error || items.error || !collection.data || !Number.isInteger(id) || id <= 0) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6"><Card className="max-w-md border-rose-300/30 bg-rose-500/10 p-8 text-center text-rose-100"><p className="font-semibold">This collection is unavailable.</p><Button onClick={() => setLocation("/collections")} variant="outline" className="mt-5 border-white/20 bg-transparent text-white">Back to Collections</Button></Card></main>;
  if (!collection.data.isPublic) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6"><Card className="max-w-md border-amber-300/30 bg-amber-500/10 p-8 text-center text-amber-100"><LockKeyhole className="mx-auto h-9 w-9" /><p className="mt-4 font-semibold">This collection is private.</p><p className="mt-2 text-sm text-amber-100/70">Only its owner can view private saved content.</p><Button onClick={() => setLocation("/collections")} variant="outline" className="mt-5 border-white/20 bg-transparent text-white">Back to Collections</Button></Card></main>;

  return <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 text-white sm:p-6"><div className="mx-auto max-w-3xl space-y-6"><Button onClick={() => setLocation("/collections")} variant="ghost" className="text-purple-200 hover:bg-white/10 hover:text-white"><ArrowLeft className="mr-2 h-4 w-4" />Back to Collections</Button><Card className="border-purple-500/60 bg-slate-800 p-6"><div className="flex items-start gap-4"><FolderOpen className="mt-1 h-8 w-8 text-cyan-300" /><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Public collection</p><h1 className="mt-2 text-3xl font-bold">{collection.data.name}</h1><p className="mt-2 text-purple-200">{collection.data.description || "A public collection curated on TRILLIONER LINK."}</p><p className="mt-4 text-sm text-slate-400">{items.data?.length ?? 0} saved item{items.data?.length === 1 ? "" : "s"}</p></div></div></Card><section className="space-y-3">{items.data?.length ? items.data.map((item) => <Card key={item.id} className="border-white/10 bg-white/5 p-4"><p className="font-medium">Saved {item.videoId ? "long-form video" : item.reelId ? "Short" : item.postId ? "post" : "item"}</p><p className="mt-1 text-sm text-slate-400">Reference ID: {item.videoId ?? item.reelId ?? item.postId ?? item.id}</p></Card>) : <Card className="border-white/10 bg-white/5 p-8 text-center text-slate-400">This public collection is ready for its first saved item.</Card>}</section></div></main>;
}
