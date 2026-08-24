import { z } from "zod";
import { and, asc, eq } from "drizzle-orm";
import { subscriptionCollectionMembers, subscriptionCollections, subscriptions, users } from "../../drizzle/schema";
import { getRequiredDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

async function ownedCollection(db: Awaited<ReturnType<typeof getRequiredDb>>, collectionId: number, userId: number) {
  const [collection] = await db.select().from(subscriptionCollections).where(and(eq(subscriptionCollections.id, collectionId), eq(subscriptionCollections.userId, userId))).limit(1);
  if (!collection) throw new Error("Subscription topic not found.");
  return collection;
}

export const subscriptionCollectionsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    return db.select().from(subscriptionCollections).where(eq(subscriptionCollections.userId, ctx.user.id)).orderBy(asc(subscriptionCollections.name));
  }),

  subscriptions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const subscribed = await db.select({ subscriptionId: subscriptions.id, creatorId: subscriptions.creatorId, creatorName: users.name, creatorHandle: users.handle, creatorImage: users.profileImage }).from(subscriptions).innerJoin(users, eq(users.id, subscriptions.creatorId)).where(eq(subscriptions.subscriberId, ctx.user.id)).orderBy(asc(users.name));
    const memberships = await db.select({ collectionId: subscriptionCollectionMembers.collectionId, subscriptionId: subscriptionCollectionMembers.subscriptionId }).from(subscriptionCollectionMembers).innerJoin(subscriptionCollections, eq(subscriptionCollections.id, subscriptionCollectionMembers.collectionId)).where(eq(subscriptionCollections.userId, ctx.user.id));
    const bySubscription = new Map<number, number[]>();
    memberships.forEach((membership) => bySubscription.set(membership.subscriptionId, [...(bySubscription.get(membership.subscriptionId) ?? []), membership.collectionId]));
    return subscribed.map((channel) => ({ ...channel, collectionIds: bySubscription.get(channel.subscriptionId) ?? [] }));
  }),

  channels: protectedProcedure
    .input(z.object({ collectionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await ownedCollection(db, input.collectionId, ctx.user.id);
      return db.select({ memberId: subscriptionCollectionMembers.id, subscriptionId: subscriptions.id, creatorId: users.id, creatorName: users.name, creatorHandle: users.handle, creatorImage: users.profileImage }).from(subscriptionCollectionMembers).innerJoin(subscriptions, eq(subscriptions.id, subscriptionCollectionMembers.subscriptionId)).innerJoin(users, eq(users.id, subscriptions.creatorId)).where(and(eq(subscriptionCollectionMembers.collectionId, input.collectionId), eq(subscriptions.subscriberId, ctx.user.id))).orderBy(asc(users.name));
    }),

  create: protectedProcedure
    .input(z.object({ name: z.string().trim().min(1).max(80), description: z.string().trim().max(255).optional(), color: z.enum(["cyan", "violet", "rose", "amber", "emerald"]).default("cyan") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [created] = await db.insert(subscriptionCollections).values({ userId: ctx.user.id, name: input.name, description: input.description || null, color: input.color }).$returningId();
      const [collection] = await db.select().from(subscriptionCollections).where(eq(subscriptionCollections.id, created.id)).limit(1);
      return collection;
    }),

  delete: protectedProcedure
    .input(z.object({ collectionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await ownedCollection(db, input.collectionId, ctx.user.id);
      await db.delete(subscriptionCollectionMembers).where(eq(subscriptionCollectionMembers.collectionId, input.collectionId));
      await db.delete(subscriptionCollections).where(eq(subscriptionCollections.id, input.collectionId));
      return { success: true } as const;
    }),

  add: protectedProcedure
    .input(z.object({ collectionId: z.number().int().positive(), subscriptionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await ownedCollection(db, input.collectionId, ctx.user.id);
      const [subscription] = await db.select({ id: subscriptions.id }).from(subscriptions).where(and(eq(subscriptions.id, input.subscriptionId), eq(subscriptions.subscriberId, ctx.user.id))).limit(1);
      if (!subscription) throw new Error("Subscribe to this channel before organizing it.");
      const [existing] = await db.select({ id: subscriptionCollectionMembers.id }).from(subscriptionCollectionMembers).where(and(eq(subscriptionCollectionMembers.collectionId, input.collectionId), eq(subscriptionCollectionMembers.subscriptionId, input.subscriptionId))).limit(1);
      if (existing) return { success: true, alreadyAdded: true } as const;
      await db.insert(subscriptionCollectionMembers).values({ collectionId: input.collectionId, subscriptionId: input.subscriptionId });
      return { success: true, alreadyAdded: false } as const;
    }),

  remove: protectedProcedure
    .input(z.object({ memberId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      const [member] = await db.select({ id: subscriptionCollectionMembers.id }).from(subscriptionCollectionMembers).innerJoin(subscriptionCollections, eq(subscriptionCollections.id, subscriptionCollectionMembers.collectionId)).where(and(eq(subscriptionCollectionMembers.id, input.memberId), eq(subscriptionCollections.userId, ctx.user.id))).limit(1);
      if (!member) throw new Error("Topic membership not found.");
      await db.delete(subscriptionCollectionMembers).where(eq(subscriptionCollectionMembers.id, input.memberId));
      return { success: true } as const;
    }),
});
