import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/useWebSocket";
import { trpc } from "@/lib/trpc";
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
  senderId: number;
  text: string;
  time: string;
  isOwn: boolean;
}

export default function Messages() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [liveMessages, setLiveMessages] = useState<Record<number, Message[]>>({});
  const utils = trpc.useUtils();
  const conversationsQuery = trpc.messages.getConversations.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const messagesQuery = trpc.messages.getMessages.useQuery(
    { conversationId: selectedChat?.id ?? 0, limit: 50 },
    { enabled: isAuthenticated && Boolean(selectedChat) }
  );
  const sendMessage = trpc.messages.sendMessage.useMutation({
    onSuccess: async () => {
      setMessageText("");
      if (selectedChat) await utils.messages.getMessages.invalidate({ conversationId: selectedChat.id });
      await utils.messages.getConversations.invalidate();
    },
  });
  const { socket, isConnected, joinConversation, leaveConversation, sendMessage: sendLiveMessage } = useWebSocket({
    autoConnect: isAuthenticated,
  });

  const chats = useMemo<Chat[]>(() => (conversationsQuery.data ?? []).map((conversation) => ({
    id: conversation.id,
    name: `Conversation #${conversation.id}`,
    avatar: "💬",
    lastMessage: "Open to load messages",
    timestamp: conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : "",
    unread: 0,
  })), [conversationsQuery.data]);

  const messages = useMemo<Message[]>(() => {
    if (!selectedChat) return [];
    const persisted = (messagesQuery.data ?? []).slice().reverse().map((message) => ({
      id: message.id,
      senderId: message.senderId,
      text: message.content,
      time: new Date(message.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      isOwn: message.senderId === user?.id,
    }));
    return [...persisted, ...(liveMessages[selectedChat.id] ?? [])].filter(
      (message, index, all) => all.findIndex((candidate) => candidate.id === message.id) === index
    );
  }, [liveMessages, messagesQuery.data, selectedChat, user?.id]);

  useEffect(() => {
    if (!selectedChat || !isConnected) return;
    joinConversation(selectedChat.id);
    return () => leaveConversation(selectedChat.id);
  }, [isConnected, joinConversation, leaveConversation, selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat) return;
    const handleReceived = (payload: { conversationId: number; senderId: number; content: string; createdAt?: string; id?: number }) => {
      if (payload.conversationId !== selectedChat.id) return;
      setLiveMessages((current) => ({
        ...current,
        [selectedChat.id]: [...(current[selectedChat.id] ?? []), {
          id: payload.id ?? Date.now(),
          senderId: payload.senderId,
          text: payload.content,
          time: new Date(payload.createdAt ?? Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
          isOwn: payload.senderId === user?.id,
        }],
      }));
      void utils.messages.getMessages.invalidate({ conversationId: selectedChat.id });
    };
    socket.on("message:received", handleReceived);
    return () => { socket.off("message:received", handleReceived); };
  }, [selectedChat, socket, user?.id, utils.messages.getMessages]);

  if (!isAuthenticated) {
    return (
      <div className="messages-container"><div className="loading"><p>Please log in to view messages</p><Button onClick={() => setLocation("/signup")} className="mt-4">Sign In</Button></div></div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || !selectedChat || sendMessage.isPending) return;
    if (isConnected) {
      sendLiveMessage(selectedChat.id, content, user?.id ?? 0);
      setMessageText("");
      return;
    }
    await sendMessage.mutateAsync({ conversationId: selectedChat.id, content });
  };

  return (
    <div className="messages-container">
      <div className="messages-wrapper">
        <div className="chat-list">
          <div className="chat-list-header"><h2>Messages</h2><button className="new-chat-btn" title="New message">✏️</button></div>
          <div className="chat-search"><input type="text" placeholder="Search chats..." /></div>
          <div className="chats">
            {conversationsQuery.isLoading && <div className="loading">Loading conversations…</div>}
            {conversationsQuery.isError && <div className="loading">Unable to load conversations.</div>}
            {!conversationsQuery.isLoading && !conversationsQuery.isError && chats.length === 0 && <div className="loading">No conversations yet.</div>}
            {chats.map((chat) => (
              <button key={chat.id} className={`chat-item ${selectedChat?.id === chat.id ? "active" : ""}`} onClick={() => setSelectedChat(chat)}>
                <div className="chat-avatar">{chat.avatar}</div><div className="chat-info"><p className="chat-name">{chat.name}</p><p className="chat-preview">{chat.lastMessage}</p></div><div className="chat-meta"><p className="chat-time">{chat.timestamp}</p>{chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="chat-window">
          {selectedChat ? <>
            <div className="chat-header"><div className="chat-header-info"><div className="chat-avatar">{selectedChat.avatar}</div><div><p className="chat-name">{selectedChat.name}</p><p className="chat-status">{isConnected ? "Live now" : "Saved mode"}</p></div></div><div className="chat-header-actions"><button className="icon-btn" title="Call">📞</button><button className="icon-btn" title="Video call">📹</button><button className="icon-btn" title="Info">ℹ️</button></div></div>
            <div className="messages-list">{messagesQuery.isLoading ? <div className="loading">Loading messages…</div> : messages.length === 0 ? <div className="loading">No messages yet.</div> : messages.map((msg) => <div key={msg.id} className={`message ${msg.isOwn ? "own" : "other"}`}><div className="message-bubble"><p className="message-text">{msg.text}</p><p className="message-time">{msg.time}</p></div></div>)}</div>
            <form onSubmit={handleSendMessage} className="message-input-form"><button type="button" className="attach-btn" title="Attach file">📎</button><input type="text" className="message-input" placeholder="Type a message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} /><button type="submit" className="send-btn" title="Send" disabled={sendMessage.isPending}>➤</button></form>
          </> : <div className="no-chat-selected"><p>Select a chat to start messaging</p></div>}
        </div>
      </div>
      <div className="messages-bottom-padding" />
    </div>
  );
}
