import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, ShieldCheck } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";

function RemoteVideo({ stream }: { stream: MediaStream }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream; }, [stream]);
  return <video ref={ref} autoPlay playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" />;
}

export default function FamilyMeeting() {
  const [, params] = useRoute("/family-meeting/:meetingId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const meetingId = Number(params?.meetingId ?? 0);
  const meetingQuery = trpc.family.getMeetingAccess.useQuery({ meetingId }, { enabled: isAuthenticated && meetingId > 0 });
  const updateStatus = trpc.family.updateMeetingStatus.useMutation();
  const { socket, isConnected } = useWebSocket({ userId: user?.id, autoConnect: Boolean(isAuthenticated) });
  const localVideo = useRef<HTMLVideoElement>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map<string, MediaStream>());
  const [mediaError, setMediaError] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  useEffect(() => {
    if (!stream || !localVideo.current) return;
    localVideo.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    const access = meetingQuery.data;
    if (!access || !isConnected || !socket) return;
    const roomCode = access.meeting.roomCode;
    const sendSignal = (target: string, signal: RTCSessionDescriptionInit | RTCIceCandidateInit) => socket.emit("family:signal", { roomCode, target, signal });
    const createPeer = async (peerId: string, initiator: boolean) => {
      if (peers.current.has(peerId)) return peers.current.get(peerId)!;
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      peers.current.set(peerId, pc);
      localStream.current?.getTracks().forEach((track) => pc.addTrack(track, localStream.current!));
      pc.onicecandidate = (event) => { if (event.candidate) sendSignal(peerId, event.candidate.toJSON()); };
      pc.ontrack = (event) => { const [remote] = event.streams; if (remote) setRemoteStreams((current) => new Map(current).set(peerId, remote)); };
      pc.onconnectionstatechange = () => { if (["failed", "closed", "disconnected"].includes(pc.connectionState)) { pc.close(); peers.current.delete(peerId); setRemoteStreams((current) => { const next = new Map(current); next.delete(peerId); return next; }); } };
      if (initiator) { const offer = await pc.createOffer(); await pc.setLocalDescription(offer); sendSignal(peerId, offer); }
      return pc;
    };
    const onParticipants = (data: { peers: string[] }) => { data.peers.forEach((peerId) => { void createPeer(peerId, true); }); };
    const onPeerJoined = (data: { peerId: string }) => { void createPeer(data.peerId, true); };
    const onSignal = async (data: { peerId: string; signal: RTCSessionDescriptionInit | RTCIceCandidateInit }) => {
      const pc = await createPeer(data.peerId, false);
      try {
        const signalType = "type" in data.signal ? data.signal.type : undefined;
        if (signalType === "offer") { await pc.setRemoteDescription(data.signal as RTCSessionDescriptionInit); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); sendSignal(data.peerId, answer); }
        else if (signalType === "answer") await pc.setRemoteDescription(data.signal as RTCSessionDescriptionInit);
        else await pc.addIceCandidate(data.signal as RTCIceCandidateInit);
      } catch { /* A late candidate or closed peer is harmless during reconnect. */ }
    };
    const onPeerLeft = (data: { peerId: string }) => { peers.current.get(data.peerId)?.close(); peers.current.delete(data.peerId); setRemoteStreams((current) => { const next = new Map(current); next.delete(data.peerId); return next; }); };
    socket.on("family:participants", onParticipants);
    socket.on("family:peer-joined", onPeerJoined);
    socket.on("family:signal", onSignal);
    socket.on("family:peer-left", onPeerLeft);
    socket.emit("family:join", { roomCode });
    return () => { socket.emit("family:leave", { roomCode }); socket.off("family:participants", onParticipants); socket.off("family:peer-joined", onPeerJoined); socket.off("family:signal", onSignal); socket.off("family:peer-left", onPeerLeft); peers.current.forEach((peer) => peer.close()); peers.current.clear(); localStream.current?.getTracks().forEach((track) => track.stop()); localStream.current = null; };
  }, [isConnected, meetingQuery.data, socket]);

  useEffect(() => {
    if (!meetingQuery.data || localStream.current) return;
    const startMedia = async () => {
      try { const next = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); localStream.current = next; setStream(next); }
      catch { setMediaError(true); }
    };
    void startMedia();
  }, [meetingQuery.data]);

  useEffect(() => {
    if (meetingQuery.data?.meeting.status === "scheduled" && meetingQuery.data.meeting.createdById === user?.id) {
      updateStatus.mutate({ meetingId, status: "live" });
    }
  }, [meetingId, meetingQuery.data, user?.id]);

  if (!isAuthenticated) return <main className="mx-auto max-w-3xl p-6 text-slate-200"><Card><CardContent className="p-8 text-center">{t("common.login")}</CardContent></Card></main>;
  if (meetingQuery.isLoading) return <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-300">{t("family.connecting")}</main>;
  if (meetingQuery.isError || !meetingQuery.data) return <main className="mx-auto max-w-3xl p-6"><Card><CardContent className="p-8 text-center text-rose-300">{t("family.noAccess")}<Button className="mt-4" onClick={() => setLocation("/family")}>{t("family.cancel")}</Button></CardContent></Card></main>;

  const access = meetingQuery.data;
  const isHost = access.meeting.createdById === user?.id;
  const toggleMute = () => { localStream.current?.getAudioTracks().forEach((track) => { track.enabled = muted; }); setMuted((value) => !value); };
  const toggleCamera = () => { localStream.current?.getVideoTracks().forEach((track) => { track.enabled = cameraOff; }); setCameraOff((value) => !value); };
  const leave = async () => { if (isHost) await updateStatus.mutateAsync({ meetingId, status: "ended" }); setLocation("/family"); };

  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100"><div className="mx-auto max-w-6xl space-y-5"><header className="flex flex-col gap-3 rounded-3xl border border-cyan-300/15 bg-gradient-to-r from-cyan-950/70 to-indigo-950/60 p-6 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-cyan-300"><ShieldCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-[0.18em]">{t("family.roomTitle")}</span></div><h1 className="mt-2 text-2xl font-bold">{access.meeting.title}</h1><p className="mt-1 text-sm text-slate-300">{access.circle.name} · {t("family.roomNote")}</p></div><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">{isConnected ? t("family.live") : t("family.connecting")}</span></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{stream && <video ref={localVideo} autoPlay muted playsInline className="aspect-video w-full rounded-2xl bg-black object-cover" />}{Array.from(remoteStreams.values()).map((remote, index) => <RemoteVideo key={index} stream={remote} />)}{!stream && <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-slate-400">{mediaError ? t("family.mediaError") : t("family.enableMedia")}</div>}{remoteStreams.size === 0 && <div className="grid aspect-video place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-slate-400">{t("family.waiting")}</div>}</div><div className="flex flex-wrap items-center justify-center gap-3"><Button variant="outline" onClick={toggleMute} disabled={!stream}>{muted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}{muted ? t("family.unmute") : t("family.mute")}</Button><Button variant="outline" onClick={toggleCamera} disabled={!stream}>{cameraOff ? <VideoOff className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}{cameraOff ? t("family.turnCameraOn") : t("family.turnCameraOff")}</Button><Button onClick={() => void leave()} className="bg-rose-600 hover:bg-rose-500"><PhoneOff className="mr-2 h-4 w-4" />{t("family.leave")}</Button></div></div></main>;
}
