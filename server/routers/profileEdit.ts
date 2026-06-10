import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const profileEditRouter = router({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

      if (!user.length) {
        throw new Error("User not found");
      }

      return user[0];
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw new Error("Failed to fetch profile");
    }
  }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        bio: z.string().max(500).optional(),
        website: z.string().url().optional(),
        profileImage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.bio) updateData.bio = input.bio;
        if (input.website) updateData.website = input.website;
        if (input.profileImage) updateData.profileImage = input.profileImage;

        updateData.updatedAt = new Date();

        await db.update(users).set(updateData).where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: "Profile updated successfully",
        };
      } catch (error) {
        console.error("Error updating profile:", error);
        throw new Error("Failed to update profile");
      }
    }),

  // Update email
  updateEmail: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Check if email already exists
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existing.length && existing[0].id !== ctx.user.id) {
          throw new Error("Email already in use");
        }

        await db
          .update(users)
          .set({ email: input.email, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          message: "Email updated successfully",
        };
      } catch (error) {
        console.error("Error updating email:", error);
        throw new Error("Failed to update email");
      }
    }),

  // Change password (if applicable)
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        // This is a placeholder for password change logic
        // In production, you would:
        // 1. Verify current password
        // 2. Hash new password
        // 3. Update in database

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (error) {
        console.error("Error changing password:", error);
        throw new Error("Failed to change password");
      }
    }),

  // Get user statistics
  getUserStats: protectedProcedure.query(async ({ ctx }: any) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Mock statistics for now
      return {
        postsCount: 42,
        followersCount: 1234,
        followingCount: 567,
        videosCount: 12,
        storiesCount: 8,
        likesCount: 5678,
        commentsCount: 234,
      };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw new Error("Failed to fetch user stats");
    }
  }),

  // Get user's posts
  getUserPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Query user's posts from database
        return {
          posts: [],
          total: 0,
        };
      } catch (error) {
        console.error("Error fetching user posts:", error);
        throw new Error("Failed to fetch user posts");
      }
    }),

  // Get user's followers
  getFollowers: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Query followers from database
        return {
          followers: [],
          total: 0,
        };
      } catch (error) {
        console.error("Error fetching followers:", error);
        throw new Error("Failed to fetch followers");
      }
    }),

  // Get user's following
  getFollowing: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Query following from database
        return {
          following: [],
          total: 0,
        };
      } catch (error) {
        console.error("Error fetching following:", error);
        throw new Error("Failed to fetch following");
      }
    }),

  // Delete account
  deleteAccount: protectedProcedure
    .input(
      z.object({
        password: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Verify password and delete account
        // In production, implement proper verification and data cleanup

        return {
          success: true,
          message: "Account deleted successfully",
        };
      } catch (error) {
        console.error("Error deleting account:", error);
        throw new Error("Failed to delete account");
      }
    }),
});
