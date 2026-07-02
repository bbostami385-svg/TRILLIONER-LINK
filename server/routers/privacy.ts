import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { privacySettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const privacyRouter = router({
  // Update privacy settings
  updateSettings: protectedProcedure
    .input(
      z.object({
        profileVisibility: z.enum(["public", "friends", "private"]),
        allowMessages: z.enum(["everyone", "friends", "none"]),
        allowComments: z.enum(["everyone", "friends", "none"]),
        showActivity: z.boolean(),
        showLastSeen: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [settings] = await db
        .insert(privacySettings)
        .values({
          userId: ctx.user.id,
          ...input,
        })
        .onConflictDoUpdate({
          target: privacySettings.userId,
          set: input,
        })
        .returning();
      return settings;
    }),

  // Get privacy settings
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const [settings] = await db
      .select()
      .from(privacySettings)
      .where(eq(privacySettings.userId, ctx.user.id));
    return settings;
  }),
});
