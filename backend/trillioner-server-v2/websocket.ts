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

export function setupWebSocket(app: express.Application) {
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

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

      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return httpServer;
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
