import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { url = process.env.VITE_API_URL || "http://localhost:3000", autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!autoConnect) return;

    const connectSocket = () => {
      if (socketRef.current?.connected) return;

      socketRef.current = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: maxReconnectAttempts,
        transports: ["websocket", "polling"],
      });

      socketRef.current.on("connect", () => {
        console.log("WebSocket connected");
        reconnectAttempts.current = 0;
      });

      socketRef.current.on("disconnect", () => {
        console.log("WebSocket disconnected");
      });

      socketRef.current.on("error", (error: any) => {
        console.error("WebSocket error:", error);
      });

      socketRef.current.on("connect_error", (error: any) => {
        console.error("WebSocket connection error:", error);
        reconnectAttempts.current++;
      });
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url, autoConnect]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`WebSocket not connected, cannot emit ${event}`);
    }
  }, []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    emit("conversation:join", conversationId);
  }, [emit]);

  const leaveConversation = useCallback((conversationId: number) => {
    emit("conversation:leave", conversationId);
  }, [emit]);

  const sendMessage = useCallback(
    (conversationId: number, content: string, senderId: number) => {
      emit("message:send", { conversationId, content, senderId });
    },
    [emit]
  );

  const markMessagesAsRead = useCallback((conversationId: number, userId: number) => {
    emit("messages:read", { conversationId, userId });
  }, [emit]);

  const startTyping = useCallback((conversationId: number) => {
    emit("typing:start", conversationId);
  }, [emit]);

  const stopTyping = useCallback((conversationId: number) => {
    emit("typing:end", conversationId);
  }, [emit]);

  const isConnected = socketRef.current?.connected ?? false;

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
  };
}
