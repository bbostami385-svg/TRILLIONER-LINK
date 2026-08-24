import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { friendInvitations, follows, users } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);
export const invitationRouter = router({
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getRequiredDb();
    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(friendInvitations).values({ inviterId: ctx.user.id, tokenHash, expiresAt });
    return { token: rawToken, expiresAt };
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select({ id: friendInvitations.id, status: friendInvitations.status, expiresAt: friendInvitations.expiresAt, createdAt: friendInvitations.createdAt, acceptedAt: friendInvitations.acceptedAt, acceptedBy: friendInvitations.acceptedBy })
      .from(friendInvitations).where(eq(friendInvitations.inviterId, ctx.user.id)).orderBy(desc(friendInvitations.createdAt)).limit(20);
  }),

  revoke: protectedProcedure.input(z.object({ invitationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const result = await db.update(friendInvitations).set({ status: "revoked", updatedAt: new Date() }).where(and(eq(friendInvitations.id, input.invitationId), eq(friendInvitations.inviterId, ctx.user.id), eq(friendInvitations.status, "pending")));
    return { success: Number(result[0].affectedRows ?? 0) > 0 };
  }),

  accept: protectedProcedure.input(z.object({ token: invitationTokenSchema })).mutation(async ({ ctx, input }) => {
    const db = await getRequiredDb();
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const [invite] = await db.select().from(friendInvitations).where(eq(friendInvitations.tokenHash, tokenHash)).limit(1);
    if (!invite) throw new Error("Invitation not found or invalid.");
    if (invite.inviterId === ctx.user.id) throw new Error("You cannot accept your own invitation.");
    if (invite.status !== "pending") throw new Error("This invitation is no longer active.");
    if (invite.expiresAt.getTime() <= Date.now()) {
      await db.update(friendInvitations).set({ status: "expired", updatedAt: new Date() }).where(eq(friendInvitations.id, invite.id));
      throw new Error("This invitation has expired.");
    }
    const [existingFollow] = await db.select({ id: follows.id }).from(follows).where(and(eq(follows.followerId, ctx.user.id), eq(follows.followingId, invite.inviterId))).limit(1);
    if (!existingFollow) await db.insert(follows).values({ followerId: ctx.user.id, followingId: invite.inviterId });
    await db.update(friendInvitations).set({ status: "accepted", acceptedBy: ctx.user.id, acceptedAt: new Date(), updatedAt: new Date() }).where(and(eq(friendInvitations.id, invite.id), eq(friendInvitations.status, "pending")));
    const [inviter] = await db.select({ name: users.name, handle: users.handle }).from(users).where(eq(users.id, invite.inviterId)).limit(1);
    return { success: true, inviter: inviter ?? null };
  }),
});
