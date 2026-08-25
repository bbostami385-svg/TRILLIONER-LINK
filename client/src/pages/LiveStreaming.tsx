import React, { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Play, Radio, MessageCircle, Share2, Heart, Loader2 } from "lucide-react";
import { HlsVideoPlayer } from "@/components/HlsVideoPlayer";
import { trpc } from "@/lib/trpc";
import "./LiveStreaming.css";

export default function LiveStreaming() {
  const { isAuthenticated, user } = useAuth();
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const activeQuery = trpc.liveStream.getActiveLiveStreams.useQuery({ limit: 20, offset: 0 });
  const detailsQuery = trpc.liveStream.getStreamDetails.useQuery(
    { streamId: selectedStreamId ?? "" },
    { enabled: Boolean(selectedStreamId) }
  );
  const chatQuery = trpc.liveStream.getStreamChatMessages.useQuery(
    { streamId: selectedStreamId ?? "", limit: 50, offset: 0 },
    { enabled: Boolean(selectedStreamId) }
  );
  const addViewer = trpc.liveStream.addStreamViewer.useMutation();
  const sendChat = trpc.liveStream.sendStreamChatMessage.useMutation({
    onSuccess: () => {
      setMessageInput("");
      void chatQuery.refetch();
    },
  });
  const startStream = trpc.liveStream.startLiveStream.useMutation({
    onSuccess: (stream) => {
      setIsStreaming(true);
      setStreamTitle("");
      setSelectedStreamId(stream.streamId);
      void activeQuery.refetch();
    },
  });
  const endStream = trpc.liveStream.endLiveStream.useMutation({
    onSuccess: () => {
      setIsStreaming(false);
      setSelectedStreamId(null);
      void activeQuery.refetch();
    },
  });

  useEffect(() => {
    if (selectedStreamId) void addViewer.mutateAsync({ streamId: selectedStreamId });
  }, [selectedStreamId]);

  const selectedStream = detailsQuery.data;
  const activeStreams = activeQuery.data?.streams ?? [];
  const chatMessages = chatQuery.data?.messages ?? [];

  const handleStartStream = async () => {
    const title = streamTitle.trim();
    if (!title || startStream.isPending) return;
    await startStream.mutateAsync({ title, isPublic: true });
  };

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedStreamId || !messageInput.trim() || sendChat.isPending || !isAuthenticated) return;
    await sendChat.mutateAsync({ streamId: selectedStreamId, message: messageInput.trim() });
  };

  return (
    <div className="livestream-container">
      <div className="livestream-header">
        <h1><Radio size={28} /> Live Streaming</h1>
        {isAuthenticated && (isStreaming ? (
          <Button onClick={() => selectedStreamId && endStream.mutate({ streamId: selectedStreamId })} className="stop-btn" disabled={endStream.isPending}>Stop Stream</Button>
        ) : <Button onClick={() => setIsStreaming(true)} className="start-btn">Start Live Stream</Button>)}
      </div>

      {isAuthenticated && isStreaming && !startStream.data && (
        <div className="start-stream-form">
          <div className="form-group"><label htmlFor="stream-title">Stream Title</label><input id="stream-title" type="text" value={streamTitle} onChange={(event) => setStreamTitle(event.target.value)} placeholder="Enter your stream title" maxLength={200} /></div>
          <Button onClick={handleStartStream} disabled={startStream.isPending || !streamTitle.trim()}>{startStream.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create stream</Button>
          {startStream.error && <p className="error-message">{startStream.error.message}</p>}
        </div>
      )}

      <div className="livestream-content">
        <div className="video-section">
          {selectedStream ? <div className="video-player">
            {selectedStream.hlsUrl ? <HlsVideoPlayer className="stream-video" src={selectedStream.hlsUrl} autoPlay poster={selectedStream.thumbnail ?? undefined} /> : <div className="player-placeholder"><Play size={64} /><p>Stream source is not available yet.</p></div>}
            <div className="stream-info"><span className="live-badge">● {selectedStream.status.toUpperCase()}</span><span className="viewers">{selectedStream.viewerCount} watching</span></div>
          </div> : <div className="no-stream-selected"><Radio size={64} /><p>{activeQuery.isLoading ? "Loading live streams..." : "Select a stream to watch"}</p></div>}
          {selectedStream && <div className="stream-details"><div className="stream-header"><div className="creator-info"><div className="chat-avatar">{selectedStream.creatorId}</div><div><h3>Creator #{selectedStream.creatorId}</h3><p>{selectedStream.viewerCount} viewers</p></div></div><Button className="follow-btn">Follow</Button></div><h2>{selectedStream.title}</h2><p>{selectedStream.description}</p><div className="stream-actions"><Button className="action-btn"><Heart size={20} /> Like</Button><Button className="action-btn"><Share2 size={20} /> Share</Button></div></div>}
        </div>

        <div className="chat-section"><div className="chat-header"><h3><MessageCircle size={20} /> Live Chat</h3></div><div className="chat-messages">{chatQuery.isLoading ? <div className="no-messages">Loading chat…</div> : chatMessages.length === 0 ? <div className="no-messages">No messages yet. Be the first to chat!</div> : chatMessages.slice().reverse().map((message) => <div key={message.id} className="chat-message"><div className="message-content"><span className="username">{message.username ?? `User #${message.userId ?? "guest"}`}</span><p>{message.message}</p></div></div>)}</div>{isAuthenticated && selectedStreamId && <form onSubmit={handleSendMessage} className="chat-input-form"><input type="text" value={messageInput} onChange={(event) => setMessageInput(event.target.value)} placeholder="Send a message..." maxLength={500} /><Button type="submit" className="send-btn" disabled={sendChat.isPending}>{sendChat.isPending ? "Sending…" : "Send"}</Button></form>}{sendChat.error && <p className="error-message">{sendChat.error.message}</p>}</div>
      </div>

      <div className="streams-list-section"><h2>Active Live Streams</h2>{activeQuery.error && <p className="error-message">{activeQuery.error.message}</p>}<div className="streams-grid">{activeStreams.map((stream) => <button key={stream.streamId} className={`stream-card ${selectedStreamId === stream.streamId ? "active" : ""}`} onClick={() => setSelectedStreamId(stream.streamId)}><div className="stream-thumbnail">{stream.thumbnail ? <img src={stream.thumbnail} alt={stream.title} /> : <div className="thumbnail-placeholder"><Radio size={32} /></div>}<div className="live-indicator">● LIVE</div><div className="viewers-badge">{stream.viewerCount} watching</div></div><div className="stream-info-card"><h4>{stream.title}</h4><p className="creator-name">Creator #{stream.creatorId}</p><p className="duration">Started {new Date(stream.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div></button>)}</div></div>
    </div>
  );
}
