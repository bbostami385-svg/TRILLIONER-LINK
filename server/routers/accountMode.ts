import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const accountModeRouter = router({
  // Get user's account mode
  getMode: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db
      .select({ accountMode: users.accountMode })
      .from(users)
      .where(eq(users.id, ctx.user.id));
    return user?.accountMode || "social";
  }),

  // Set account mode (YouTube or Social)
  setMode: protectedProcedure
    .input(z.object({ mode: z.enum(["youtube", "social"]) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(users)
        .set({ accountMode: input.mode })
        .where(eq(users.id, ctx.user.id));
      return { success: true, mode: input.mode };
    }),

  // Get mode info
  getModeInfo: publicProcedure
    .input(z.object({ mode: z.enum(["youtube", "social"]) }))
    .query(async () => {
      const modes = {
        youtube: {
          name: "YouTube Mode",
          description: "Create channels, upload videos, gain subscribers",
          features: [
            "Video uploads",
            "Subscribers system",
            "Channel management",
            "Video analytics",
            "Monetization",
          ],
        },
        social: {
          name: "Facebook/Instagram Mode",
          description: "Share posts, stories, reels with friends and followers",
          features: [
            "Posts and stories",
            "Reels and videos",
            "Direct messaging",
            "Followers system",
            "Live streaming",
          ],
        },
      };
      return modes;
    }),
});
