import { Server, Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { messages, conversations } from "../drizzle/schema";
import { getDb } from "./db";
import { sdk } from "./_core/sdk";
import { eq, and, or } from "drizzle-orm";

interface ConnectedUser {
  userId: number;
  socketId: string;
  conversationIds: number[];
}

const connectedUsers = new Map<number, ConnectedUser>();

export function setupWebSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    allowRequest: (_req, callback) => callback(null, true),
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const user = await sdk.authenticateRequest({
        headers: { cookie: socket.handshake.headers.cookie },
      } as any);
      socket.data.user = user;
      next();
    } catch {
      next(new Error("Unauthorized WebSocket connection"));
    }
  });

  const isConversationMember = async (conversationId: number, userId: number) => {
    const db = await getDb();
    if (!db) return false;
    const [conversation] = await db.select({ id: conversations.id })
      .from(conversations)
      .where(and(
        eq(conversations.id, conversationId),
        or(eq(conversations.participant1Id, userId), eq(conversations.participant2Id, userId)),
      ))
      .limit(1);
    return Boolean(conversation);
  };

  io.on("connection", (socket: Socket) => {
    const authenticatedUserId = socket.data.user.id as number;
    connectedUsers.set(authenticatedUserId, {
      userId: authenticatedUserId,
      socketId: socket.id,
      conversationIds: [],
    });
    io.emit("user:online", { userId: authenticatedUserId, status: "online" });
    console.log(`User connected: ${socket.id}`);

    // User joins
    socket.on("user:join", () => {
      // The authenticated handshake already registers this socket; ignore client IDs.
    });

    // Join conversation room
    socket.on("conversation:join", async (conversationId: number) => {
      if (!Number.isInteger(conversationId) || !(await isConversationMember(conversationId, authenticatedUserId))) {
        socket.emit("error", { message: "Conversation access denied" });
        return;
      }
      const user = connectedUsers.get(authenticatedUserId);
      if (user && !user.conversationIds.includes(conversationId)) user.conversationIds.push(conversationId);
      socket.join(`conversation:${conversationId}`);
      io.to(`conversation:${conversationId}`).emit("user:joined", {
        conversationId,
        userId: authenticatedUserId,
      });
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
        if (!Number.isInteger(conversationId) || senderId !== authenticatedUserId ||
          typeof content !== "string" || content.trim().length === 0 || content.length > 5000 ||
          !(await isConversationMember(conversationId, authenticatedUserId))) {
          socket.emit("error", { message: "Message access denied" });
          return;
        }

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
        if (userId !== authenticatedUserId || !(await isConversationMember(conversationId, authenticatedUserId))) {
          socket.emit("error", { message: "Conversation access denied" });
          return;
        }

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

  return io;
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
