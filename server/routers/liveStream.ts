import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { liveStreams, streamChatMessages } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  return db;
};

const streamIdSchema = z.object({ streamId: z.string().min(1).max(120) });

export const liveStreamRouter = router({
  startLiveStream: protectedProcedure
    .input(z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().max(5000).optional(),
      thumbnail: z.string().url().optional(),
      isPublic: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const streamId = `stream-${ctx.user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const streamKey = `key-${streamId}`;
      const rtmpUrl = `rtmp://stream.example.com/live/${streamKey}`;
      const hlsUrl = `https://stream.example.com/live/${streamKey}/index.m3u8`;
      await db.insert(liveStreams).values({
        streamId,
        creatorId: ctx.user.id,
        title: input.title,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
        isPublic: input.isPublic,
        status: "live",
        streamKey,
        rtmpUrl,
        hlsUrl,
        viewerCount: 0,
      });
      const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.streamId, streamId)).limit(1);
      if (!stream) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create live stream" });
      return stream;
    }),

  endLiveStream: protectedProcedure
    .input(streamIdSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [stream] = await db.select({ id: liveStreams.id, creatorId: liveStreams.creatorId, status: liveStreams.status })
        .from(liveStreams).where(eq(liveStreams.streamId, input.streamId)).limit(1);
      if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found" });
      if (stream.creatorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can end this stream" });
      await db.update(liveStreams).set({ status: "ended", endedAt: new Date() }).where(eq(liveStreams.id, stream.id));
      return { success: true, streamId: input.streamId };
    }),

  getActiveLiveStreams: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const streams = await db.select().from(liveStreams)
        .where(and(eq(liveStreams.isPublic, true), eq(liveStreams.status, "live")))
        .orderBy(desc(liveStreams.startedAt)).limit(input.limit).offset(input.offset);
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(liveStreams)
        .where(and(eq(liveStreams.isPublic, true), eq(liveStreams.status, "live")));
      return { streams, total: Number(total) };
    }),

  getStreamDetails: publicProcedure
    .input(streamIdSchema)
    .query(async ({ input }) => {
      const db = await requireDb();
      const [stream] = await db.select().from(liveStreams).where(eq(liveStreams.streamId, input.streamId)).limit(1);
      if (!stream || (!stream.isPublic && stream.status === "live")) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found" });
      }
      return stream;
    }),

  getUserLiveStreams: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20), offset: z.number().min(0).default(0) }))
    .query(async ({ input, ctx }) => {
      const db = await requireDb();
      const streams = await db.select().from(liveStreams).where(eq(liveStreams.creatorId, ctx.user.id))
        .orderBy(desc(liveStreams.createdAt)).limit(input.limit).offset(input.offset);
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(liveStreams).where(eq(liveStreams.creatorId, ctx.user.id));
      return { streams, total: Number(total) };
    }),

  addStreamViewer: publicProcedure
    .input(streamIdSchema)
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const [stream] = await db.select({ id: liveStreams.id }).from(liveStreams)
        .where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.status, "live"), eq(liveStreams.isPublic, true))).limit(1);
      if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found" });
      await db.update(liveStreams).set({ viewerCount: sql`${liveStreams.viewerCount} + 1` }).where(eq(liveStreams.id, stream.id));
      return { success: true, streamId: input.streamId };
    }),

  sendStreamChatMessage: protectedProcedure
    .input(z.object({ streamId: z.string().min(1).max(120), message: z.string().trim().min(1).max(500) }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [stream] = await db.select({ id: liveStreams.id }).from(liveStreams)
        .where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.status, "live"))).limit(1);
      if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found" });
      await db.insert(streamChatMessages).values({ streamId: input.streamId, userId: ctx.user.id, username: ctx.user.name ?? "Member", message: input.message });
      const [created] = await db.select().from(streamChatMessages)
        .where(eq(streamChatMessages.streamId, input.streamId)).orderBy(desc(streamChatMessages.createdAt)).limit(1);
      return { success: true, message: created, timestamp: created?.createdAt ?? new Date() };
    }),

  getStreamChatMessages: publicProcedure
    .input(z.object({ streamId: z.string().min(1).max(120), limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
    .query(async ({ input }) => {
      const db = await requireDb();
      const messages = await db.select().from(streamChatMessages).where(eq(streamChatMessages.streamId, input.streamId))
        .orderBy(desc(streamChatMessages.createdAt)).limit(input.limit).offset(input.offset);
      const [{ total }] = await db.select({ total: sql<number>`count(*)` }).from(streamChatMessages).where(eq(streamChatMessages.streamId, input.streamId));
      return { messages, total: Number(total) };
    }),

  recordStream: protectedProcedure
    .input(streamIdSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [stream] = await db.select({ id: liveStreams.id, creatorId: liveStreams.creatorId, status: liveStreams.status, recordingId: liveStreams.recordingId })
        .from(liveStreams).where(eq(liveStreams.streamId, input.streamId)).limit(1);
      if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found" });
      if (stream.creatorId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the creator can record this stream" });
      const recordingId = stream.recordingId ?? `rec-${input.streamId}-${Date.now()}`;
      await db.update(liveStreams).set({ recordingId }).where(eq(liveStreams.id, stream.id));
      return { success: true, streamId: input.streamId, recordingId };
    }),
});
