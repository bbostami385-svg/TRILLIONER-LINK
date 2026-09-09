import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import "./Messages.css";

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

interface Message {
  id: number;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");

  const chats: Chat[] = [
    {
      id: 1,
      name: "John Doe",
      avatar: "👨",
      lastMessage: "Hey, how are you?",
      timestamp: "2 min",
      unread: 2,
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "👩",
      lastMessage: "See you tomorrow!",
      timestamp: "1 hour",
      unread: 0,
    },
    {
      id: 3,
      name: "Tech Group",
      avatar: "👥",
      lastMessage: "Great discussion today",
      timestamp: "3 hours",
      unread: 5,
    },
    {
      id: 4,
      name: "Creative Team",
      avatar: "🎨",
      lastMessage: "New project ideas",
      timestamp: "5 hours",
      unread: 0,
    },
  ];

  const messages: Message[] = [
    { id: 1, sender: "John", text: "Hey, how are you?", time: "2:30 PM", isOwn: false },
    { id: 2, sender: "You", text: "I am doing great!", time: "2:31 PM", isOwn: true },
    { id: 3, sender: "John", text: "Want to grab coffee?", time: "2:32 PM", isOwn: false },
  ];

  if (!isAuthenticated) {
    return (
      <div className="messages-container">
        <div className="loading">
          <p>Please log in to view messages</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      console.log("Message sent:", messageText);
      setMessageText("");
    }
  };

  return (
    <div className="messages-container">
      <div className="messages-wrapper">
        {/* Chat List */}
        <div className="chat-list">
          <div className="chat-list-header">
            <h2>Messages</h2>
            <button className="new-chat-btn" title="New message">
              ✏️
            </button>
          </div>

          <div className="chat-search">
            <input type="text" placeholder="Search chats..." />
          </div>

          <div className="chats">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`}
                onClick={() => setSelectedChat(chat)}
              >
                <div className="chat-avatar">{chat.avatar}</div>
                <div className="chat-info">
                  <p className="chat-name">{chat.name}</p>
                  <p className="chat-preview">{chat.lastMessage}</p>
                </div>
                <div className="chat-meta">
                  <p className="chat-time">{chat.timestamp}</p>
                  {chat.unread > 0 && (
                    <span className="unread-badge">{chat.unread}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="chat-window">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">{selectedChat.avatar}</div>
                  <div>
                    <p className="chat-name">{selectedChat.name}</p>
                    <p className="chat-status">Active now</p>
                  </div>
                </div>
                <div className="chat-header-actions">
                  <button className="icon-btn" title="Call">
                    📞
                  </button>
                  <button className="icon-btn" title="Video call">
                    📹
                  </button>
                  <button className="icon-btn" title="Info">
                    ℹ️
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message ${msg.isOwn ? "own" : "other"}`}
                  >
                    <div className="message-bubble">
                      <p className="message-text">{msg.text}</p>
                      <p className="message-time">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="message-input-form">
                <button
                  type="button"
                  className="attach-btn"
                  title="Attach file"
                >
                  📎
                </button>
                <input
                  type="text"
                  className="message-input"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <button type="submit" className="send-btn" title="Send">
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a chat to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="messages-bottom-padding"></div>
    </div>
  );
}
