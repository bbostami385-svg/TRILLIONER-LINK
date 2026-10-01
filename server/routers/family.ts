import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { familyCircleMembers, familyCircles, familyMeetings, users } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function member(db: Awaited<ReturnType<typeof getRequiredDb>>, circleId: number, userId: number) {
  const [row] = await db.select({ id: familyCircleMembers.id, role: familyCircleMembers.role }).from(familyCircleMembers).where(and(eq(familyCircleMembers.circleId, circleId), eq(familyCircleMembers.userId, userId), eq(familyCircleMembers.status, "active"))).limit(1);
  if (!row) throw new TRPCError({ code: "FORBIDDEN", message: "You are not a member of this Family Circle." });
  return row;
}

export const familyRouter = router({
  getMyCircles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const rows = await db.select({ circle: familyCircles, role: familyCircleMembers.role }).from(familyCircleMembers).innerJoin(familyCircles, eq(familyCircleMembers.circleId, familyCircles.id)).where(and(eq(familyCircleMembers.userId, ctx.user.id), eq(familyCircleMembers.status, "active"))).orderBy(desc(familyCircles.updatedAt));
    return rows.map((row) => ({ ...row.circle, role: row.role }));
  }),
  createCircle: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(100), description: z.string().trim().max(500).optional() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const result = await db.insert(familyCircles).values({ ownerId: ctx.user.id, name: input.name, description: input.description || null, privacy: "invite_only", maxMembers: 20 });
    const circleId = Number(result[0].insertId);
    await db.insert(familyCircleMembers).values({ circleId, userId: ctx.user.id, invitedById: ctx.user.id, role: "owner", status: "active" });
    const [circle] = await db.select().from(familyCircles).where(eq(familyCircles.id, circleId)).limit(1);
    return circle;
  }),
  getCircle: protectedProcedure.input(z.object({ circleId: z.number().int().positive() })).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const membership = await member(db, input.circleId, ctx.user.id);
    const [circle] = await db.select().from(familyCircles).where(eq(familyCircles.id, input.circleId)).limit(1);
    if (!circle) throw new TRPCError({ code: "NOT_FOUND", message: "Family Circle not found." });
    const members = await db.select({ id: familyCircleMembers.id, userId: familyCircleMembers.userId, role: familyCircleMembers.role, name: users.name, handle: users.handle, profileImage: users.profileImage }).from(familyCircleMembers).innerJoin(users, eq(familyCircleMembers.userId, users.id)).where(and(eq(familyCircleMembers.circleId, input.circleId), eq(familyCircleMembers.status, "active")));
    const meetings = await db.select().from(familyMeetings).where(eq(familyMeetings.circleId, input.circleId)).orderBy(desc(familyMeetings.scheduledAt)).limit(20);
    return { circle, membership, members, meetings };
  }),
  inviteMember: protectedProcedure.input(z.object({ circleId: z.number().int().positive(), userId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const owner = await member(db, input.circleId, ctx.user.id);
    if (owner.role !== "owner") throw new TRPCError({ code: "FORBIDDEN", message: "Only the circle owner can invite members." });
    const [circle] = await db.select().from(familyCircles).where(eq(familyCircles.id, input.circleId)).limit(1);
    if (!circle) throw new TRPCError({ code: "NOT_FOUND", message: "Family Circle not found." });
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, input.userId)).limit(1);
    if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Member account not found." });
    const [count] = await db.select({ count: sql<number>`count(*)` }).from(familyCircleMembers).where(and(eq(familyCircleMembers.circleId, input.circleId), eq(familyCircleMembers.status, "active")));
    if (Number(count?.count ?? 0) >= circle.maxMembers) throw new TRPCError({ code: "BAD_REQUEST", message: "This Family Circle has reached its member limit." });
    await db.insert(familyCircleMembers).values({ circleId: input.circleId, userId: input.userId, invitedById: ctx.user.id, role: "member", status: "active" }).onDuplicateKeyUpdate({ set: { status: "active", invitedById: ctx.user.id } });
    return { success: true };
  }),
  createMeeting: protectedProcedure.input(z.object({ circleId: z.number().int().positive(), title: z.string().trim().min(2).max(160), scheduledAt: z.coerce.date() })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    await member(db, input.circleId, ctx.user.id);
    if (input.scheduledAt.getTime() < Date.now() - 60_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a future meeting time." });
    const roomCode = `family-${crypto.randomUUID()}`;
    const result = await db.insert(familyMeetings).values({ circleId: input.circleId, createdById: ctx.user.id, title: input.title, scheduledAt: input.scheduledAt, roomCode, status: "scheduled" });
    const [meeting] = await db.select().from(familyMeetings).where(eq(familyMeetings.id, Number(result[0].insertId))).limit(1);
    return meeting;
  }),
  updateMeetingStatus: protectedProcedure.input(z.object({ meetingId: z.number().int().positive(), status: z.enum(["live", "ended", "cancelled"]) })).mutation(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const [meeting] = await db.select().from(familyMeetings).where(eq(familyMeetings.id, input.meetingId)).limit(1);
    if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "Family meeting not found." });
    const access = await member(db, meeting.circleId, ctx.user.id);
    if (access.role !== "owner" && meeting.createdById !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the meeting host can update this meeting." });
    await db.update(familyMeetings).set({ status: input.status, updatedAt: new Date() }).where(eq(familyMeetings.id, input.meetingId));
    return { success: true };
  }),
  getMeetingAccess: protectedProcedure.input(z.object({ meetingId: z.number().int().positive() })).query(async ({ input, ctx }) => {
    const db = await getRequiredDb();
    const [row] = await db.select({ meeting: familyMeetings, circle: familyCircles }).from(familyMeetings).innerJoin(familyCircles, eq(familyMeetings.circleId, familyCircles.id)).where(eq(familyMeetings.id, input.meetingId)).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Family meeting not found." });
    await member(db, row.meeting.circleId, ctx.user.id);
    if (["ended", "cancelled"].includes(row.meeting.status)) throw new TRPCError({ code: "BAD_REQUEST", message: "This family meeting is no longer active." });
    return row;
  }),
});
