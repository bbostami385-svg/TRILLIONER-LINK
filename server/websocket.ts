import { Server, Socket } from "socket.io";
import { createServer } from "http";
import express from "express";
import { messages, conversations } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

interface ConnectedUser {
  userId: number;
  socketId: string;
  conversationIds: number[];
}

const connectedUsers = new Map<number, ConnectedUser>();
const familyRoomMembers = new Map<string, Set<string>>();
let activeIo: Server | null = null;

export function setupWebSocket(app: express.Application) {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((origin) => origin.trim()).filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  activeIo = io;
  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins
    socket.on("user:join", (userId: number) => {
      connectedUsers.set(userId, {
        userId,
        socketId: socket.id,
        conversationIds: [],
      });
      io.emit("user:online", { userId, status: "online" });
    });

    // Join conversation room
    socket.on("conversation:join", (conversationId: number) => {
      const user = connectedUsers.get(parseInt(socket.handshake.auth.userId));
      if (user) {
        user.conversationIds.push(conversationId);
        socket.join(`conversation:${conversationId}`);
        io.to(`conversation:${conversationId}`).emit("user:joined", {
          conversationId,
          userId: user.userId,
        });
      }
    });

    // Leave conversation room
    socket.on("conversation:leave", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      io.to(`conversation:${conversationId}`).emit("user:left", {
        conversationId,
      });
    });

    // Send message
    socket.on("message:send", async (data: any) => {
      try {
        const { conversationId, content, senderId } = data;

        // Save message to database
        const db = await getDb();
        if (!db) {
          socket.emit("error", { message: "Database not available" });
          return;
        }
        await db.insert(messages).values({
          conversationId,
          senderId,
          content,
          isRead: 0,
          createdAt: new Date(),
        });

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit("message:received", {
          conversationId,
          senderId,
          content,
          createdAt: new Date(),
          isOwn: false,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing:start", (conversationId: number) => {
      socket.to(`conversation:${conversationId}`).emit("typing:indicator", {
        conversationId,
        isTyping: true,
      });
    });

    socket.on("typing:end", (conversationId: number) => {
      socket.to(`conversation:${conversationId}`).emit("typing:indicator", {
        conversationId,
        isTyping: false,
      });
    });

    // Mark messages as read
    socket.on("messages:read", async (data: any) => {
      try {
        const { conversationId, userId } = data;

        // Update read status in database
        const db = await getDb();
        if (!db) {
          socket.emit("error", { message: "Database not available" });
          return;
        }
        await db
          .update(messages)
          .set({ isRead: 1 })
          .where(
            and(
              eq(messages.conversationId, conversationId),
              eq(messages.senderId, userId)
            )
          );

        io.to(`conversation:${conversationId}`).emit("messages:marked-read", {
          conversationId,
          userId,
        });
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Family meetings keep audio/video in the browser and use Socket.IO only for WebRTC signaling.
    socket.on("family:join", (data: { roomCode?: string }) => {
      const roomCode = typeof data?.roomCode === "string" ? data.roomCode.trim() : "";
      if (!roomCode || roomCode.length > 96) return;
      const peers = familyRoomMembers.get(roomCode) ?? new Set<string>();
      socket.emit("family:participants", { roomCode, peers: Array.from(peers) });
      peers.add(socket.id);
      familyRoomMembers.set(roomCode, peers);
      socket.join(`family:${roomCode}`);
      socket.to(`family:${roomCode}`).emit("family:peer-joined", { roomCode, peerId: socket.id });
    });

    socket.on("family:signal", (data: { roomCode?: string; target?: string; signal?: unknown }) => {
      const roomCode = typeof data?.roomCode === "string" ? data.roomCode.trim() : "";
      const target = typeof data?.target === "string" ? data.target : "";
      if (!roomCode || !target || !data.signal || !familyRoomMembers.get(roomCode)?.has(socket.id) || !familyRoomMembers.get(roomCode)?.has(target)) return;
      io.to(target).emit("family:signal", { roomCode, peerId: socket.id, signal: data.signal });
    });

    socket.on("family:leave", (data: { roomCode?: string }) => {
      const roomCode = typeof data?.roomCode === "string" ? data.roomCode.trim() : "";
      if (!roomCode) return;
      familyRoomMembers.get(roomCode)?.delete(socket.id);
      socket.leave(`family:${roomCode}`);
      socket.to(`family:${roomCode}`).emit("family:peer-left", { roomCode, peerId: socket.id });
    });

    // User disconnects
    socket.on("disconnect", () => {
      let disconnectedUserId: number | null = null;

      connectedUsers.forEach((user, userId) => {
        if (user.socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
        }
      });

      if (disconnectedUserId) {
        io.emit("user:offline", { userId: disconnectedUserId, status: "offline" });
      }

      familyRoomMembers.forEach((members, roomCode) => {
        if (!members.delete(socket.id)) return;
        if (members.size === 0) familyRoomMembers.delete(roomCode);
        else io.to(`family:${roomCode}`).emit("family:peer-left", { roomCode, peerId: socket.id });
      });

      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}

export function emitToUser(userId: number, event: "kyc:status", payload: { status: "pending" | "approved" | "rejected"; message: string; notificationId?: number }) {
  const socketId = connectedUsers.get(userId)?.socketId;
  if (!socketId || !activeIo) return false;
  activeIo.to(socketId).emit(event, payload);
  return true;
}

export function getConnectedUsers() {
  return Array.from(connectedUsers.values() as any);
}

export function isUserOnline(userId: number) {
  return connectedUsers.has(userId);
}

export function getUserSocket(userId: number) {
  return connectedUsers.get(userId)?.socketId;
}
