import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { users } from "../../drizzle/schema";

const modeSchema = z.enum(["social", "creator"]);

export const accountModeRouter = router({
  getMode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const [user] = await db
      .select({ accountMode: users.accountMode, modeSelected: users.modeSelected })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    return {
      accountMode: user?.accountMode ?? "social",
      modeSelected: user?.modeSelected ?? false,
    };
  }),

  setMode: protectedProcedure
    .input(z.object({ mode: modeSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = await getRequiredDb();
      await db
        .update(users)
        .set({ accountMode: input.mode, modeSelected: true })
        .where(eq(users.id, ctx.user.id));

      return { success: true, mode: input.mode };
    }),

  getModeInfo: publicProcedure
    .input(z.object({ mode: modeSchema }))
    .query(({ input }) => {
      const modes = {
        social: {
          name: "Social Mode",
          description: "Share posts, stories, reels, and connect with friends and communities.",
          primaryAction: "Follow",
          audienceLabel: "Followers",
          features: ["Posts and stories", "Reels and photos", "Direct messaging", "Followers and following", "Communities"],
        },
        creator: {
          name: "Creator Mode",
          description: "Publish videos and long-form content while building a subscriber audience.",
          primaryAction: "Subscribe",
          audienceLabel: "Subscribers",
          features: ["Video publishing", "Subscriber audience", "Channel management", "Video analytics", "Monetization readiness"],
        },
      } as const;

      return modes[input.mode];
    }),
});
