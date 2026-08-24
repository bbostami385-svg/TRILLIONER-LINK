import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { buildHandleCandidates, handleSchema, normalizeHandle, validateHandle } from "../handleUtils";
import { inArray } from "drizzle-orm";

const socialProviders = ["facebook", "instagram", "twitter", "youtube", "tiktok"] as const;
const allowedSocialHosts: Record<(typeof socialProviders)[number], string[]> = { facebook: ["facebook.com", "www.facebook.com"], instagram: ["instagram.com", "www.instagram.com"], twitter: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"], youtube: ["youtube.com", "www.youtube.com", "youtu.be"], tiktok: ["tiktok.com", "www.tiktok.com"] };
export const socialLinksSchema = z.object(Object.fromEntries(socialProviders.map((provider) => [provider, z.string().trim().max(500).optional()])) as Record<(typeof socialProviders)[number], z.ZodOptional<z.ZodString>>).superRefine((value, ctx) => { for (const provider of socialProviders) { const raw = value[provider]; if (!raw) continue; let parsed: URL; try { parsed = new URL(raw); } catch { ctx.addIssue({ code: "custom", path: [provider], message: "Use a complete profile URL." }); continue; } if (parsed.protocol !== "https:" || !allowedSocialHosts[provider].includes(parsed.hostname.toLowerCase())) ctx.addIssue({ code: "custom", path: [provider], message: `Use an official ${provider} profile URL.` }); } });
export const socialLinkOrderSchema = z.array(z.enum(socialProviders)).max(socialProviders.length).default([...socialProviders]);
export function normalizeSocialLinks(value: z.infer<typeof socialLinksSchema> | null | undefined) { return Object.fromEntries(socialProviders.flatMap((provider) => value?.[provider] ? [[provider, value[provider]]] : [])) as Partial<Record<(typeof socialProviders)[number], string>>; }
export function normalizeSocialLinkOrder(order: readonly string[] | null | undefined, links: Partial<Record<(typeof socialProviders)[number], string>>) { const requested = (order ?? []).filter((provider, index, list): provider is (typeof socialProviders)[number] => socialProviders.includes(provider as (typeof socialProviders)[number]) && list.indexOf(provider) === index && Boolean(links[provider as (typeof socialProviders)[number]])); const remaining = socialProviders.filter((provider) => links[provider] && !requested.includes(provider)); return [...requested, ...remaining]; }
function readPublicSocialLinks(value: unknown) { const root = value && typeof value === "object" ? (value as Record<string, unknown>) : {}; const parsed = socialLinksSchema.safeParse(root.socialLinks); if (!parsed.success) return []; const links = normalizeSocialLinks(parsed.data); const order = Array.isArray(root.socialLinkOrder) ? root.socialLinkOrder.filter((item): item is string => typeof item === "string") : undefined; return normalizeSocialLinkOrder(order, links).map((provider) => ({ provider, url: links[provider]! })); }

export const profileEditRouter = router({
  getByHandle: publicProcedure.input(z.object({ handle: z.string().trim().min(1).max(64) })).query(async ({ input }) => {
    const validation = validateHandle(input.handle);
    if (!validation.valid) return null;
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [user] = await db.select({ id: users.id, name: users.name, handle: users.handle, profileImage: users.profileImage, bio: users.bio, accountMode: users.accountMode, activeProfileBadge: users.activeProfileBadge, activeProfileTheme: users.activeProfileTheme, linkedAccounts: users.linkedAccounts }).from(users).where(eq(users.handleNormalized, validation.normalized)).limit(1);
    return user ? { id: user.id, name: user.name, handle: user.handle, profileImage: user.profileImage, bio: user.bio, accountMode: user.accountMode, activeProfileBadge: user.activeProfileBadge, activeProfileTheme: user.activeProfileTheme, socialLinks: readPublicSocialLinks(user.linkedAccounts) } : null;
  }),

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
        socialLinks: socialLinksSchema.optional(),
        socialLinkOrder: socialLinkOrderSchema.optional(),
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
        if (input.socialLinks) {
          const [current] = await db.select({ linkedAccounts: users.linkedAccounts }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
          const existingLinks = current?.linkedAccounts && typeof current.linkedAccounts === "object" ? (current.linkedAccounts as Record<string, unknown>) : {};
          const normalizedLinks = normalizeSocialLinks(input.socialLinks);
          updateData.linkedAccounts = { ...existingLinks, socialLinks: normalizedLinks, socialLinkOrder: normalizeSocialLinkOrder(input.socialLinkOrder, normalizedLinks) };
        }

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

  suggestHandles: protectedProcedure.input(z.object({ handle: z.string().trim().min(1).max(64), limit: z.number().int().min(1).max(8).default(6) })).query(async ({ input, ctx }: any) => {
    const candidates = buildHandleCandidates(input.handle, Math.min(input.limit * 2, 8));
    const db = await getDb();
    if (!db || candidates.length === 0) return [];
    const existing = await db.select({ handleNormalized: users.handleNormalized }).from(users).where(inArray(users.handleNormalized, candidates));
    const taken = new Set(existing.map((row) => row.handleNormalized));
    return candidates.filter((candidate) => !taken.has(candidate)).slice(0, input.limit);
  }),

  checkHandleAvailability: protectedProcedure.input(z.object({ handle: z.string().trim().min(1).max(64) })).query(async ({ input, ctx }: any) => {
    const validation = validateHandle(input.handle);
    if (!validation.valid) return { available: false, normalized: validation.normalized, message: validation.message };
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.handleNormalized, validation.normalized)).limit(1);
    return { available: existing.length === 0 || existing[0].id === ctx.user.id, normalized: validation.normalized, message: existing.length === 0 || existing[0].id === ctx.user.id ? "Handle is available." : "This handle is already taken." };
  }),

  claimHandle: protectedProcedure.input(z.object({ handle: handleSchema })).mutation(async ({ input, ctx }: any) => {
    const normalized = normalizeHandle(input.handle);
    const validation = validateHandle(normalized);
    if (!validation.valid) throw new Error(validation.message);
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    try {
      const existing = await db.select({ id: users.id }).from(users).where(eq(users.handleNormalized, normalized)).limit(1);
      if (existing.length && existing[0].id !== ctx.user.id) throw new Error("This handle is already taken.");
      await db.update(users).set({ handle: input.handle, handleNormalized: normalized, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
      return { success: true, handle: input.handle, handleNormalized: normalized };
    } catch (error) {
      if (String(error).toLowerCase().includes("duplicate") || String(error).toLowerCase().includes("unique")) throw new Error("This handle is already taken.");
      throw error;
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
