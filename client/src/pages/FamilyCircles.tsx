import { useState } from "react";
import { CalendarDays, LockKeyhole, Plus, ShieldCheck, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/hooks/useTranslation";

export default function FamilyCircles() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [circleName, setCircleName] = useState("");
  const [circleDescription, setCircleDescription] = useState("");
  const [inviteUserId, setInviteUserId] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const utils = trpc.useUtils();
  const circlesQuery = trpc.family.getMyCircles.useQuery(undefined, { enabled: isAuthenticated });
  const activeCircleId = selectedCircleId ?? circlesQuery.data?.[0]?.id ?? null;
  const circleQuery = trpc.family.getCircle.useQuery({ circleId: activeCircleId ?? 0 }, { enabled: Boolean(activeCircleId) });
  const createCircle = trpc.family.createCircle.useMutation({ onSuccess: async () => { setShowCreate(false); setCircleName(""); setCircleDescription(""); await utils.family.getMyCircles.invalidate(); } });
  const inviteMember = trpc.family.inviteMember.useMutation({ onSuccess: async () => { setInviteUserId(""); await utils.family.getCircle.invalidate(); } });
  const createMeeting = trpc.family.createMeeting.useMutation({ onSuccess: async () => { setMeetingTitle(""); setMeetingTime(""); await utils.family.getCircle.invalidate(); } });

  if (!isAuthenticated) return <main className="mx-auto max-w-3xl p-6 text-slate-200"><Card><CardContent className="p-8 text-center">{t("common.login")}</CardContent></Card></main>;

  const circle = circleQuery.data;
  const isOwner = circle?.membership.role === "owner";
  const submitCircle = (event: React.FormEvent) => { event.preventDefault(); createCircle.mutate({ name: circleName, description: circleDescription || undefined }); };
  const submitInvite = (event: React.FormEvent) => { event.preventDefault(); if (activeCircleId && Number(inviteUserId) > 0) inviteMember.mutate({ circleId: activeCircleId, userId: Number(inviteUserId) }); };
  const submitMeeting = (event: React.FormEvent) => { event.preventDefault(); if (activeCircleId && meetingTime) createMeeting.mutate({ circleId: activeCircleId, title: meetingTitle, scheduledAt: new Date(meetingTime) }); };

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-950/60 via-slate-900 to-indigo-950/60 p-6 md:flex-row md:items-end md:justify-between"><div><div className="mb-3 flex items-center gap-2 text-cyan-300"><LockKeyhole className="h-5 w-5" /><span className="text-sm font-semibold uppercase tracking-[0.18em]">{t("family.privacyNote")}</span></div><h1 className="text-3xl font-bold md:text-4xl">{t("family.title")}</h1><p className="mt-2 max-w-2xl text-slate-300">{t("family.subtitle")}</p></div><Button onClick={() => setShowCreate((value) => !value)} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300"><Plus className="mr-2 h-4 w-4" />{t("family.createShort")}</Button></header>

{showCreate && <Card className="border-cyan-300/20 bg-slate-900"><CardHeader><CardTitle>{t("family.create")}</CardTitle></CardHeader><CardContent><form onSubmit={submitCircle} className="grid gap-4 md:grid-cols-2"><label className="space-y-2 text-sm"><span>{t("family.name")}</span><Input required value={circleName} onChange={(event) => setCircleName(event.target.value)} placeholder={t("family.namePlaceholder")} /></label><label className="space-y-2 text-sm"><span>{t("family.description")}</span><Input value={circleDescription} onChange={(event) => setCircleDescription(event.target.value)} placeholder={t("family.descriptionPlaceholder")} /></label><div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={createCircle.isPending}>{createCircle.isPending ? t("family.creating") : t("family.createShort")}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t("family.cancel")}</Button></div></form></CardContent></Card>}

<div className="grid gap-6 lg:grid-cols-[18rem_1fr]"> <Card className="border-white/10 bg-slate-900"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300" />{t("family.title")}</CardTitle></CardHeader><CardContent className="space-y-2">{circlesQuery.isLoading ? <div className="h-16 animate-pulse rounded-xl bg-white/5" /> : circlesQuery.data?.length ? circlesQuery.data.map((item) => <button key={item.id} onClick={() => setSelectedCircleId(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${item.id === activeCircleId ? "border-cyan-300/60 bg-cyan-400/10" : "border-white/10 hover:border-cyan-300/30"}`}><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.role === "owner" ? t("family.owner") : t("family.members")}</p></button>) : <p className="text-sm text-slate-400">{t("family.empty")}</p>}</CardContent></Card>

{circle ? <section className="space-y-6"><Card className="border-white/10 bg-slate-900"><CardHeader><div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"><div><CardTitle>{circle.circle.name}</CardTitle><p className="mt-1 text-sm text-slate-400">{circle.circle.description || t("family.subtitle")}</p></div><span className="inline-flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4" />{t("family.privacyNote")}</span></div></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{circle.members.map((member) => <div key={member.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="font-medium">{member.name || `#${member.userId}`}</p><p className="text-xs text-slate-400">{member.role === "owner" ? t("family.owner") : t("family.members")}</p></div>)}</div>{isOwner && <form onSubmit={submitInvite} className="mt-5 flex flex-col gap-2 sm:flex-row"><Input required inputMode="numeric" value={inviteUserId} onChange={(event) => setInviteUserId(event.target.value)} placeholder={t("family.invite")} /><Button type="submit" disabled={inviteMember.isPending}>{inviteMember.isPending ? t("family.inviting") : t("family.inviteAction")}</Button></form>}<p className="mt-2 text-xs text-slate-500">{t("family.inviteHint")}</p></CardContent></Card>

<Card className="border-white/10 bg-slate-900"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-cyan-300" />{t("family.meetings")}</CardTitle></CardHeader><CardContent><form onSubmit={submitMeeting} className="grid gap-3 md:grid-cols-[1fr_16rem_auto]"><Input required value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder={t("family.meetingTitlePlaceholder")} /><Input required type="datetime-local" value={meetingTime} onChange={(event) => setMeetingTime(event.target.value)} aria-label={t("family.meetingTime")} /><Button type="submit" disabled={createMeeting.isPending}>{createMeeting.isPending ? t("family.scheduling") : t("family.schedule")}</Button></form><div className="mt-5 space-y-3">{circle.meetings.length ? circle.meetings.map((meeting) => <div key={meeting.id} className="flex flex-col gap-3 rounded-xl border border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{meeting.title}</p><p className="text-sm text-slate-400">{new Date(meeting.scheduledAt).toLocaleString()} · <span className={meeting.status === "live" ? "text-emerald-300" : "text-slate-400"}>{meeting.status === "live" ? t("family.live") : t("family.scheduled")}</span></p></div><Button onClick={() => setLocation(`/family-meeting/${meeting.id}`)}>{meeting.status === "live" ? t("family.join") : t("family.start")}</Button></div>) : <p className="text-sm text-slate-400">{t("family.noMeetings")}</p>}</div></CardContent></Card></section> : <Card className="border-white/10 bg-slate-900"><CardContent className="p-8 text-center text-slate-400">{t("family.empty")}</CardContent></Card>}</div></div></main>;
}
