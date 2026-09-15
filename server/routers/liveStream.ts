import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { liveStreams, streamChatMessages, users } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const streamIdInput = z.object({ streamId: z.string().min(1).max(120) });
const pageInput = z.object({ limit: z.number().int().min(1).max(50).default(20), offset: z.number().int().nonnegative().default(0) });
const rtmpBase = () => (process.env.STREAM_RTMP_BASE_URL ?? "rtmp://stream.example.com/live").replace(/\/$/, "");
const hlsBase = () => (process.env.STREAM_HLS_BASE_URL ?? "https://stream.example.com/live").replace(/\/$/, "");

export const liveStreamRouter = router({
  startLiveStream: protectedProcedure.input(z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(2000).optional(), thumbnail: z.string().url().optional(), isPublic: z.boolean().default(true) })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const streamId = `stream-${ctx.user.id}-${Date.now()}`;
    const streamKey = `${ctx.user.id}-${crypto.randomUUID()}`;
    const rtmpUrl = `${rtmpBase()}/${streamKey}`;
    const hlsUrl = `${hlsBase()}/${streamKey}/index.m3u8`;
    await db.insert(liveStreams).values({ streamId, creatorId: ctx.user.id, title: input.title, description: input.description || null, thumbnail: input.thumbnail || null, isPublic: input.isPublic, status: "ready", streamKey, rtmpUrl, hlsUrl });
    return { streamId, rtmpUrl, hlsUrl, streamKey, status: "ready", createdAt: new Date() };
  }),

  endLiveStream: protectedProcedure.input(streamIdInput).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const [stream] = await db.select({ id: liveStreams.id }).from(liveStreams).where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.creatorId, ctx.user.id))).limit(1);
    if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found." });
    await db.update(liveStreams).set({ status: "ended", endedAt: new Date(), updatedAt: new Date() }).where(eq(liveStreams.id, stream.id));
    return { success: true, message: "Live stream ended", streamId: input.streamId };
  }),

  getActiveLiveStreams: publicProcedure.input(pageInput).query(async ({ input }) => {
    const db = await getRequiredDb();
    const streams = await db.select({ id: liveStreams.streamId, userId: liveStreams.creatorId, title: liveStreams.title, description: liveStreams.description, thumbnail: liveStreams.thumbnail, viewerCount: liveStreams.viewerCount, startedAt: liveStreams.startedAt, hlsUrl: liveStreams.hlsUrl, status: liveStreams.status, creatorName: users.name }).from(liveStreams).leftJoin(users, eq(liveStreams.creatorId, users.id)).where(and(eq(liveStreams.isPublic, true), eq(liveStreams.status, "live"))).orderBy(desc(liveStreams.startedAt)).limit(input.limit).offset(input.offset);
    const totalRows = await db.select({ id: liveStreams.id }).from(liveStreams).where(and(eq(liveStreams.isPublic, true), eq(liveStreams.status, "live")));
    return { streams, total: totalRows.length };
  }),

  getStreamDetails: publicProcedure.input(streamIdInput).query(async ({ input }) => {
    const db = await getRequiredDb();
    const [stream] = await db.select({ id: liveStreams.streamId, userId: liveStreams.creatorId, title: liveStreams.title, description: liveStreams.description, thumbnail: liveStreams.thumbnail, viewerCount: liveStreams.viewerCount, startedAt: liveStreams.startedAt, endedAt: liveStreams.endedAt, hlsUrl: liveStreams.hlsUrl, status: liveStreams.status, creatorName: users.name }).from(liveStreams).leftJoin(users, eq(liveStreams.creatorId, users.id)).where(eq(liveStreams.streamId, input.streamId)).limit(1);
    if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found." });
    return stream;
  }),

  getUserLiveStreams: protectedProcedure.input(pageInput).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const streams = await db.select().from(liveStreams).where(eq(liveStreams.creatorId, ctx.user.id)).orderBy(desc(liveStreams.createdAt)).limit(input.limit).offset(input.offset);
    const totalRows = await db.select({ id: liveStreams.id }).from(liveStreams).where(eq(liveStreams.creatorId, ctx.user.id));
    return { streams, total: totalRows.length };
  }),

  addStreamViewer: publicProcedure.input(streamIdInput).mutation(async ({ input }) => {
    const db = await getRequiredDb();
    const result = await db.update(liveStreams).set({ viewerCount: sql`${liveStreams.viewerCount} + 1`, updatedAt: new Date() }).where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.status, "live")));
    if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found." });
    return { success: true, message: "Viewer added" };
  }),

  sendStreamChatMessage: publicProcedure.input(z.object({ streamId: z.string().min(1).max(120), message: z.string().trim().min(1).max(500), userId: z.number().int().positive().optional(), username: z.string().trim().max(160).optional() })).mutation(async ({ input, ctx }: any) => {
    const db = await getRequiredDb();
    const [stream] = await db.select({ id: liveStreams.id }).from(liveStreams).where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.status, "live"))).limit(1);
    if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream is not active." });
    const senderId = ctx.user?.id ?? input.userId ?? null;
    await db.insert(streamChatMessages).values({ streamId: input.streamId, userId: senderId, username: input.username || null, message: input.message.trim() });
    return { success: true, message: "Chat message sent", timestamp: new Date() };
  }),

  getStreamChatMessages: publicProcedure.input(streamIdInput.merge(pageInput)).query(async ({ input }) => {
    const db = await getRequiredDb();
    const messages = await db.select({ id: streamChatMessages.id, streamId: streamChatMessages.streamId, userId: streamChatMessages.userId, username: streamChatMessages.username, message: streamChatMessages.message, createdAt: streamChatMessages.createdAt }).from(streamChatMessages).where(eq(streamChatMessages.streamId, input.streamId)).orderBy(desc(streamChatMessages.createdAt)).limit(input.limit).offset(input.offset);
    const totalRows = await db.select({ id: streamChatMessages.id }).from(streamChatMessages).where(eq(streamChatMessages.streamId, input.streamId));
    return { messages: messages.reverse(), total: totalRows.length };
  }),

  recordStream: protectedProcedure.input(streamIdInput.extend({ recordingId: z.string().trim().max(160).optional() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const [stream] = await db.select({ id: liveStreams.id }).from(liveStreams).where(and(eq(liveStreams.streamId, input.streamId), eq(liveStreams.creatorId, ctx.user.id))).limit(1);
    if (!stream) throw new TRPCError({ code: "NOT_FOUND", message: "Live stream not found." });
    const recordingId = input.recordingId || `rec-${Date.now()}`;
    await db.update(liveStreams).set({ recordingId, updatedAt: new Date() }).where(eq(liveStreams.id, stream.id));
    return { success: true, message: "Stream recording registered", recordingId };
  }),
});
