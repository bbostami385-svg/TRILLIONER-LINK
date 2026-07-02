import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Play, Radio, MessageCircle, Share2, Heart } from "lucide-react";
import "./LiveStreaming.css";

export default function LiveStreaming() {
  const { isAuthenticated, user } = useAuth();
  const [activeStreams, setActiveStreams] = useState<any[]>([]);
  const [selectedStream, setSelectedStream] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch active live streams
    const fetchStreams = async () => {
      try {
        // Mock data for now
        setActiveStreams([
          {
            id: "stream-1",
            userId: 1,
            title: "Gaming Session - New Game Release",
            description: "Playing the latest game release",
            thumbnail: "https://via.placeholder.com/400x225?text=Gaming",
            viewerCount: 1234,
            duration: 3600,
            startedAt: new Date(),
            hlsUrl: "https://stream.example.com/live/stream-1/index.m3u8",
            creator: {
              id: 1,
              name: "Gaming Channel",
              avatar: "https://via.placeholder.com/40x40?text=GC",
            },
          },
          {
            id: "stream-2",
            userId: 2,
            title: "Music Production Live",
            description: "Creating music in real-time",
            thumbnail: "https://via.placeholder.com/400x225?text=Music",
            viewerCount: 567,
            duration: 1800,
            startedAt: new Date(),
            hlsUrl: "https://stream.example.com/live/stream-2/index.m3u8",
            creator: {
              id: 2,
              name: "Music Producer",
              avatar: "https://via.placeholder.com/40x40?text=MP",
            },
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching streams:", error);
        setLoading(false);
      }
    };

    fetchStreams();
  }, []);

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      alert("Please enter a stream title");
      return;
    }

    setIsStreaming(true);
    // Call API to start stream
    // Get RTMP URL and stream key
    // Start broadcasting
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    setStreamTitle("");
    // Call API to stop stream
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedStream) return;

    const newMessage = {
      id: Date.now(),
      username: user?.name || "Anonymous",
              avatar: user?.profileImage || "https://via.placeholder.com/32x32?text=U",
      message: messageInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setMessageInput("");
    // Call API to send message
  };

  if (loading) {
    return (
      <div className="livestream-container">
        <div className="loading">Loading live streams...</div>
      </div>
    );
  }

  return (
    <div className="livestream-container">
      {/* Header */}
      <div className="livestream-header">
        <h1>
          <Radio size={28} /> Live Streaming
        </h1>
        {isAuthenticated && (
          <Button
            onClick={() => (isStreaming ? handleStopStream() : handleStartStream())}
            className={isStreaming ? "stop-btn" : "start-btn"}
          >
            {isStreaming ? "Stop Stream" : "Start Live Stream"}
          </Button>
        )}
      </div>

      {/* Start Stream Form */}
      {isAuthenticated && isStreaming && (
        <div className="start-stream-form">
          <div className="form-group">
            <label>Stream Title</label>
            <input
              type="text"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Enter your stream title"
              maxLength={200}
            />
          </div>
          <div className="form-info">
            <p>RTMP URL: rtmp://stream.example.com/live/YOUR_STREAM_KEY</p>
            <p>Stream Key: Copy from your dashboard</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="livestream-content">
        {/* Video Player */}
        <div className="video-section">
          {selectedStream ? (
            <div className="video-player">
              <div className="player-placeholder">
                <Play size={64} />
                <p>Video Stream: {selectedStream.title}</p>
                <div className="stream-info">
                  <span className="live-badge">● LIVE</span>
                  <span className="viewers">{selectedStream.viewerCount} watching</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-stream-selected">
              <Radio size={64} />
              <p>Select a stream to watch</p>
            </div>
          )}

          {/* Stream Details */}
          {selectedStream && (
            <div className="stream-details">
              <div className="stream-header">
                <div className="creator-info">
                  <img src={selectedStream.creator.avatar || "https://via.placeholder.com/40x40?text=Creator"} alt={selectedStream.creator.name} />
                  <div>
                    <h3>{selectedStream.creator.name}</h3>
                    <p>{selectedStream.viewerCount} viewers</p>
                  </div>
                </div>
                <Button className="follow-btn">Follow</Button>
              </div>

              <h2>{selectedStream.title}</h2>
              <p>{selectedStream.description}</p>

              <div className="stream-actions">
                <Button className="action-btn">
                  <Heart size={20} /> Like
                </Button>
                <Button className="action-btn">
                  <Share2 size={20} /> Share
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>
              <MessageCircle size={20} /> Live Chat
            </h3>
          </div>

          <div className="chat-messages">
            {chatMessages.length === 0 ? (
              <div className="no-messages">No messages yet. Be the first to chat!</div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="chat-message">
                  <img src={msg.avatar || "https://via.placeholder.com/32x32?text=U"} alt={msg.username} className="avatar" />
                  <div className="message-content">
                    <span className="username">{msg.username}</span>
                    <p>{msg.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {isAuthenticated && (
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Send a message..."
                maxLength={500}
              />
              <Button type="submit" className="send-btn">
                Send
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Active Streams List */}
      <div className="streams-list-section">
        <h2>Active Live Streams</h2>
        <div className="streams-grid">
          {activeStreams.map((stream) => (
            <div
              key={stream.id}
              className={`stream-card ${selectedStream?.id === stream.id ? "active" : ""}`}
              onClick={() => setSelectedStream(stream)}
            >
              <div className="stream-thumbnail">
                <img src={stream.thumbnail} alt={stream.title} />
                <div className="live-indicator">● LIVE</div>
                <div className="viewers-badge">{stream.viewerCount} watching</div>
              </div>
              <div className="stream-info-card">
                <h4>{stream.title}</h4>
                <p className="creator-name">{stream.creator.name}</p>
                <p className="duration">{Math.floor(stream.duration / 60)} min</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
