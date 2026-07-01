import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { events, eventRsvps, users } from "../../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "../db";

export const eventsRouter = router({
  // Create an event
  createEvent: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        startDate: z.date(),
        endDate: z.date().optional(),
        location: z.string().optional(),
        coverImage: z.string().optional(),
        isOnline: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(events).values({
        title: input.title,
        description: input.description,
        creatorId: ctx.user.id,
        startDate: input.startDate,
        endDate: input.endDate,
        location: input.location,
        coverImage: input.coverImage,
        isOnline: input.isOnline,
        attendees: 1,
      });

      const eventId = Number(result[0].insertId);
      
      // Creator automatically attends
      await db.insert(eventRsvps).values({
        eventId,
        userId: ctx.user.id,
        status: "going",
      });

      const event = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      return event[0] || null;
    }),

  // Get event details
  getEvent: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      return result[0] || null;
    }),

  // Get upcoming events
  getUpcomingEvents: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = new Date();
      return db.select().from(events).where(gte(events.startDate, now)).limit(input.limit);
    }),

  // RSVP to event
  rsvpEvent: protectedProcedure
    .input(z.object({ eventId: z.number(), status: z.enum(["going", "interested", "not_going"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if already RSVP'd
      const existing = await db
        .select()
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, input.eventId), eq(eventRsvps.userId, ctx.user.id)))
        .limit(1);

      if (existing.length > 0) {
        // Update existing RSVP
        await db
          .update(eventRsvps)
          .set({ status: input.status })
          .where(and(eq(eventRsvps.eventId, input.eventId), eq(eventRsvps.userId, ctx.user.id)));
      } else {
        // Create new RSVP
        await db.insert(eventRsvps).values({
          eventId: input.eventId,
          userId: ctx.user.id,
          status: input.status,
        });
      }

      return { success: true };
    }),

  // Get event attendees
  getEventAttendees: publicProcedure
    .input(z.object({ eventId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const attendees = await db
        .select()
        .from(eventRsvps)
        .where(eq(eventRsvps.eventId, input.eventId))
        .innerJoin(users, eq(eventRsvps.userId, users.id));

      return attendees.map((row) => ({
        ...row.eventRsvps,
        user: row.users,
      }));
    }),

  // Update event
  updateEvent: protectedProcedure
    .input(
      z.object({
        eventId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        location: z.string().optional(),
        coverImage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const eventResult = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      const event = eventResult[0];

      if (!event || event.creatorId !== ctx.user.id) {
        throw new Error("Only event creator can update");
      }

      await db
        .update(events)
        .set({
          title: input.title,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
          location: input.location,
          coverImage: input.coverImage,
        })
        .where(eq(events.id, input.eventId));

      const updated = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      return updated[0] || null;
    }),

  // Delete event
  deleteEvent: protectedProcedure
    .input(z.object({ eventId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const eventResult = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
      const event = eventResult[0];

      if (!event || event.creatorId !== ctx.user.id) {
        throw new Error("Only event creator can delete");
      }

      await db.delete(events).where(eq(events.id, input.eventId));
      return { success: true };
    }),
});
