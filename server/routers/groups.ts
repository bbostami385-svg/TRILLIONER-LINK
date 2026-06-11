import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { groups, groupMembers, users } from "../../drizzle/schema";
import { eq, and, like } from "drizzle-orm";
import { getDb } from "../db";

export const groupsRouter = router({
  // Create a new group
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        isPrivate: z.boolean().default(false),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db
        .insert(groups)
        .values({
          name: input.name,
          description: input.description,
          ownerId: ctx.user.id,
          isPrivate: input.isPrivate,
          coverImage: input.coverImage,
          memberCount: 1,
        });

      const groupId = Number(result[0].insertId);
      
      // Add creator as member
      await db.insert(groupMembers).values({
        groupId,
        userId: ctx.user.id,
        role: "admin",
      });

      const group = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
      return group[0] || null;
    }),

  // Get group details
  getGroup: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);
      return result[0] || null;
    }),

  // Get user's groups
  getUserGroups: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const userGroups = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, ctx.user.id))
      .innerJoin(groups, eq(groupMembers.groupId, groups.id));

    return userGroups.map((row) => row.groups);
  }),

  // Join group
  joinGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.insert(groupMembers).values({
        groupId: input.groupId,
        userId: ctx.user.id,
        role: "member",
      });

      // Update member count
      const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, input.groupId));
      await db.update(groups).set({ memberCount: members.length }).where(eq(groups.id, input.groupId));

      return { success: true };
    }),

  // Leave group
  leaveGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, input.groupId),
            eq(groupMembers.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // Get group members
  getGroupMembers: publicProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const members = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, input.groupId))
        .innerJoin(users, eq(groupMembers.userId, users.id));

      return members.map((row) => ({
        ...row.groupMembers,
        user: row.users,
      }));
    }),

  // Search groups
  searchGroups: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(groups)
        .where(like(groups.name, `%${input.query}%`))
        .limit(20);
      
      return results;
    }),

  // Update group
  updateGroup: protectedProcedure
    .input(
      z.object({
        groupId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const groupResult = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);
      const group = groupResult[0];

      if (!group || group.ownerId !== ctx.user.id) {
        throw new Error("Only group owner can update");
      }

      await db
        .update(groups)
        .set({
          name: input.name,
          description: input.description,
          coverImage: input.coverImage,
        })
        .where(eq(groups.id, input.groupId));

      const updated = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);
      return updated[0] || null;
    }),

  // Delete group
  deleteGroup: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const groupResult = await db.select().from(groups).where(eq(groups.id, input.groupId)).limit(1);
      const group = groupResult[0];

      if (!group || group.ownerId !== ctx.user.id) {
        throw new Error("Only group owner can delete");
      }

      await db.delete(groups).where(eq(groups.id, input.groupId));
      return { success: true };
    }),
});
