import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { db } from "../db";
import { users, follows } from "../../drizzle/schema";
import { ne, notInArray } from "drizzle-orm";

export const suggestionsRouter = router({
  // Get suggested users
  getSuggestedUsers: protectedProcedure.query(async ({ ctx }) => {
    const followedUsers = await db
      .select({ id: follows.followingId })
      .from(follows)
      .where(ne(follows.followerId, ctx.user.id));
    
    const followedIds = followedUsers.map(f => f.id);
    
    return await db
      .select()
      .from(users)
      .where(
        notInArray(users.id, [...followedIds, ctx.user.id])
      )
      .limit(10);
  }),

  // Get suggested hashtags
  getSuggestedHashtags: publicProcedure.query(async () => {
    // Return trending hashtags
    return [
      { hashtag: "#TRILLIONERLINK", count: 1000 },
      { hashtag: "#trending", count: 850 },
      { hashtag: "#viral", count: 750 },
      { hashtag: "#foryou", count: 650 },
      { hashtag: "#explore", count: 550 },
    ];
  }),

  // Get suggested content
  getSuggestedContent: protectedProcedure.query(async ({ ctx }) => {
    // Return personalized content recommendations
    return [];
  }),
});
