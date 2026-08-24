import { useEffect, useState } from "react";
import { Check, FolderHeart, LockKeyhole, Plus, Trash2, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const colors = ["cyan", "violet", "rose", "amber", "emerald"] as const;
const colorClasses: Record<(typeof colors)[number], string> = { cyan: "border-cyan-300/40 bg-cyan-500/10 text-cyan-100", violet: "border-violet-300/40 bg-violet-500/10 text-violet-100", rose: "border-rose-300/40 bg-rose-500/10 text-rose-100", amber: "border-amber-300/40 bg-amber-500/10 text-amber-100", emerald: "border-emerald-300/40 bg-emerald-500/10 text-emerald-100" };

export default function SubscriptionCollections() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<(typeof colors)[number]>("cyan");
  const collections = trpc.subscriptionCollections.mine.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const subscriptions = trpc.subscriptionCollections.subscriptions.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const channels = trpc.subscriptionCollections.channels.useQuery({ collectionId: selectedId ?? 0 }, { enabled: Boolean(selectedId), retry: false });
  const create = trpc.subscriptionCollections.create.useMutation();
  const removeCollection = trpc.subscriptionCollections.delete.useMutation();
  const add = trpc.subscriptionCollections.add.useMutation();
  const remove = trpc.subscriptionCollections.remove.useMutation();

  useEffect(() => {
    if (!selectedId && collections.data?.[0]) setSelectedId(collections.data[0].id);
    if (selectedId && collections.data && !collections.data.some((collection) => collection.id === selectedId)) setSelectedId(collections.data[0]?.id ?? null);
  }, [collections.data, selectedId]);

  const submitCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    try { const created = await create.mutateAsync({ name, description: description || undefined, color }); setName(""); setDescription(""); setColor("cyan"); setShowCreate(false); await utils.subscriptionCollections.mine.invalidate(); if (created) setSelectedId(created.id); toast.success("Subscription topic created."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not create topic."); }
  };

  const toggleChannel = async (subscriptionId: number, memberId?: number) => {
    if (!selectedId) return;
    try { if (memberId) await remove.mutateAsync({ memberId }); else await add.mutateAsync({ collectionId: selectedId, subscriptionId }); await Promise.all([utils.subscriptionCollections.channels.invalidate({ collectionId: selectedId }), utils.subscriptionCollections.subscriptions.invalidate()]); toast.success(memberId ? "Channel removed from topic." : "Channel added to topic."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update this topic."); }
  };

  const deleteTopic = async () => {
    if (!selectedId) return;
    try { await removeCollection.mutateAsync({ collectionId: selectedId }); await utils.subscriptionCollections.mine.invalidate(); toast.success("Topic deleted."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not delete topic."); }
  };

  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="max-w-md border-white/10 bg-white/5 p-8 text-center"><FolderHeart className="mx-auto h-10 w-10 text-cyan-300" /><h1 className="mt-4 text-2xl font-bold">Subscription topics</h1><p className="mt-2 text-slate-400">Sign in to organize the Creator channels you follow.</p><Button className="mt-5" onClick={() => setLocation("/login")}>Sign in</Button></Card></main>;

  return <main className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300"><FolderHeart className="h-3.5 w-3.5" /> TRILLIONER LINK / Subscription map</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Your subscriptions, in the right rooms.</h1><p className="mt-2 max-w-2xl text-slate-400">Create private topics such as Science, Music, or Islamic learning. A channel can live in more than one topic without changing your subscription.</p></div><Button onClick={() => setShowCreate((value) => !value)} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">{showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}{showCreate ? "Close" : "New topic"}</Button></header>
    {showCreate && <Card className="border-cyan-300/20 bg-cyan-500/5 p-5"><form onSubmit={submitCreate} className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"><label className="grid gap-1.5 text-sm text-slate-300">Topic name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="Science, Music, Islamic…" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-400" /></label><label className="grid gap-1.5 text-sm text-slate-300">Description<input value={description} onChange={(event) => setDescription(event.target.value)} maxLength={255} placeholder="A short note about this viewing lane" className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:ring-2 focus:ring-cyan-400" /></label><div className="flex flex-wrap items-center gap-3"><div className="flex gap-1.5" aria-label="Topic color">{colors.map((item) => <button type="button" key={item} aria-label={`Use ${item} color`} onClick={() => setColor(item)} className={`h-7 w-7 rounded-full border-2 ${item === "cyan" ? "bg-cyan-400" : item === "violet" ? "bg-violet-400" : item === "rose" ? "bg-rose-400" : item === "amber" ? "bg-amber-400" : "bg-emerald-400"} ${color === item ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950" : "border-transparent"}`} />)}</div><Button type="submit" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create"}</Button></div></form></Card>}
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="space-y-3"><div className="flex items-center justify-between"><h2 className="font-semibold">Your topics</h2><span className="text-xs text-slate-500">{collections.data?.length ?? 0} total</span></div>{collections.isLoading && <Card className="border-white/10 bg-white/5 p-5 text-sm text-slate-400">Loading topics…</Card>}{!collections.isLoading && !collections.data?.length && <Card className="border-white/10 bg-white/5 p-5 text-sm text-slate-400">Create a topic, then place your active subscriptions into it.</Card>}{collections.data?.map((collection) => <button key={collection.id} onClick={() => setSelectedId(collection.id)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedId === collection.id ? colorClasses[collection.color as (typeof colors)[number]] ?? colorClasses.cyan : "border-white/10 bg-white/[0.045] hover:bg-white/[0.08]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{collection.name}</p><p className="mt-1 line-clamp-2 text-xs opacity-70">{collection.description || "No description yet."}</p></div><LockKeyhole className="h-4 w-4 shrink-0 opacity-60" /></div></button>)}</aside><section><Card className="min-h-[450px] border-white/10 bg-white/[0.045] p-5">{!selectedId ? <div className="grid min-h-[380px] place-items-center text-center"><FolderHeart className="h-10 w-10 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Select a topic to organize your subscribed channels.</p></div> : <><div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Selected topic</p><h2 className="mt-1 text-2xl font-bold">{collections.data?.find((collection) => collection.id === selectedId)?.name}</h2><p className="mt-1 text-sm text-slate-400">Select or clear a channel below. Changes are saved immediately.</p></div><Button variant="outline" onClick={() => void deleteTopic()} disabled={removeCollection.isPending} className="border-rose-300/20 bg-transparent text-rose-200 hover:bg-rose-500/10"><Trash2 className="mr-2 h-4 w-4" />Delete topic</Button></div>{subscriptions.isLoading && <p className="py-8 text-sm text-slate-400">Loading subscriptions…</p>}{!subscriptions.isLoading && !subscriptions.data?.length && <div className="grid min-h-[280px] place-items-center text-center"><FolderHeart className="h-9 w-9 text-slate-600" /><p className="mt-3 text-sm text-slate-400">Subscribe to Creator channels first, then they will appear here.</p></div>}{subscriptions.data && subscriptions.data.length > 0 && <div className="mt-5 space-y-3">{subscriptions.data.map((channel) => { const member = channels.data?.find((item) => item.subscriptionId === channel.subscriptionId); const inTopic = Boolean(member); return <div key={channel.subscriptionId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 p-3"><div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400/40 to-indigo-500/40 text-sm font-bold">{channel.creatorImage ? <img src={channel.creatorImage} alt="" className="h-full w-full object-cover" /> : (channel.creatorName?.[0] ?? "C").toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-medium">{channel.creatorName || "Creator channel"}</p><p className="truncate text-xs text-slate-500">{channel.creatorHandle ? `@${channel.creatorHandle}` : "Subscribed channel"}</p></div><Button variant="outline" onClick={() => void toggleChannel(channel.subscriptionId, member?.memberId)} className={inTopic ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" : "border-cyan-300/20 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20"}>{inTopic ? <><Check className="mr-1.5 h-4 w-4" />In topic</> : <><Plus className="mr-1.5 h-4 w-4" />Add</>}</Button></div>; })}</div>}</>}</Card></section></div></div></main>;
}
