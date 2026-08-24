import { Bell, CheckCheck, MessageCircle, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import "./Notifications.css";

const categories = [
  { value: "all", label: "All" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "appeals", label: "Appeals" },
  { value: "social", label: "Social" },
] as const;
type Category = (typeof categories)[number]["value"];

function iconFor(type: string) { if (type === "subscribe") return <UserPlus className="h-5 w-5 text-indigo-300" />; if (type === "appeal_result") return <Sparkles className="h-5 w-5 text-amber-300" />; if (type === "comment") return <MessageCircle className="h-5 w-5 text-cyan-300" />; return <Bell className="h-5 w-5 text-slate-300" />; }
function timeAgo(value: Date | string) { const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000); if (minutes < 1) return "now"; if (minutes < 60) return `${minutes}m ago`; if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`; return `${Math.floor(minutes / 1440)}d ago`; }

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const [category, setCategory] = useState<Category>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const query = trpc.notifications.getBellFeed.useQuery({ limit: 30, category }, { enabled: isAuthenticated, refetchInterval: 15_000, staleTime: 10_000 });
  const markRead = trpc.notifications.markAsRead.useMutation({ onSuccess: () => void query.refetch() });
  const markAll = trpc.notifications.markAllAsRead.useMutation({ onSuccess: () => void query.refetch() });
  if (!isAuthenticated) return <main className="grid min-h-screen place-items-center bg-[#080b14] p-6 text-white"><Card className="border-white/10 bg-white/5 p-8 text-center"><h1 className="text-2xl font-bold">Sign in to view notifications</h1></Card></main>;
  const all = query.data ?? [];
  const list = unreadOnly ? all.filter((item) => !item.isRead) : all;
  const unreadCount = all.filter((item) => !item.isRead).length;
  return <main className="min-h-screen bg-[#080b14] px-4 py-8 text-white sm:px-8"><div className="mx-auto max-w-3xl"><header className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">TRILLIONER LINK / Updates</p><h1 className="mt-2 text-3xl font-bold">Notifications</h1><p className="mt-2 text-slate-400">Filter account signals without leaving your creator workspace.</p></div>{unreadCount > 0 && <Button variant="outline" disabled={markAll.isPending} onClick={() => markAll.mutate()} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"><CheckCheck className="mr-2 h-4 w-4" />Mark all as read</Button>}</header><div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Notification category"><button onClick={() => setUnreadOnly(false)} className={`rounded-full px-4 py-2 text-sm ${!unreadOnly ? "bg-white text-slate-950" : "bg-white/5 text-slate-300"}`}>All activity</button><button onClick={() => setUnreadOnly(true)} className={`rounded-full px-4 py-2 text-sm ${unreadOnly ? "bg-white text-slate-950" : "bg-white/5 text-slate-300"}`}>Unread ({unreadCount})</button>{categories.map((item) => <button key={item.value} onClick={() => setCategory(item.value)} className={`rounded-full px-4 py-2 text-sm ${category === item.value ? "bg-indigo-400 text-slate-950" : "bg-white/5 text-slate-300"}`}>{item.label}</button>)}</div><section className="mt-4 space-y-3">{query.isLoading ? [1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-white/10 bg-white/5" />) : list.length === 0 ? <Card className="border-white/10 bg-white/[0.045] p-10 text-center text-slate-400"><Bell className="mx-auto h-8 w-8 text-slate-600" /><p className="mt-3">No notifications in this view.</p></Card> : list.map((item) => <button key={item.id} onClick={() => !item.isRead && markRead.mutate({ notificationId: item.id })} className={`flex w-full gap-4 rounded-2xl border border-white/10 p-4 text-left transition hover:bg-white/10 ${!item.isRead ? "bg-indigo-500/10" : "bg-white/[0.045]"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10">{iconFor(item.type)}</span><span className="min-w-0 flex-1"><span className="block text-sm text-slate-200"><strong>{item.fromUserName ?? "TRILLIONER LINK"}</strong> {item.message}</span><span className="mt-2 block text-xs text-slate-500">{timeAgo(item.createdAt)}</span></span>{!item.isRead && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-indigo-300" />}</button>)}</section></div></main>;
}
