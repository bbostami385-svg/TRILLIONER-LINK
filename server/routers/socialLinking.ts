import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, linkedAccounts, accountLinkingRecords } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * OAuth configuration for different providers
 */
const OAUTH_CONFIG = {
  google: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
    redirectUri: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/google/callback`,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid profile email",
  },
  youtube: {
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET || "",
    redirectUri: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/youtube/callback`,
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
  },
  facebook: {
    clientId: process.env.FACEBOOK_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET || "",
    redirectUri: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/facebook/callback`,
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scope: "public_profile,email",
  },
  instagram: {
    clientId: process.env.INSTAGRAM_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.INSTAGRAM_OAUTH_CLIENT_SECRET || "",
    redirectUri: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/instagram/callback`,
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://graph.instagram.com/v18.0/access_token",
    scope: "user_profile,user_media",
  },
  tiktok: {
    clientId: process.env.TIKTOK_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.TIKTOK_OAUTH_CLIENT_SECRET || "",
    redirectUri: `${process.env.FRONTEND_URL || "http://localhost:5173"}/auth/tiktok/callback`,
    authUrl: "https://www.tiktok.com/v1/oauth/authorize",
    tokenUrl: "https://open.tiktokapis.com/v1/oauth/token",
    scope: "user.info.basic,user.info.profile",
  },
};

export const socialLinkingRouter = router({
  /**
   * Generate OAuth URL for a specific provider
   */
  generateOAuthURL: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const config = OAUTH_CONFIG[input.provider];

      if (!config.clientId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `${input.provider} OAuth is not configured`,
        });
      }

      // Generate state token for security
      const state = Buffer.from(
        JSON.stringify({
          userId: ctx.user.id,
          provider: input.provider,
          timestamp: Date.now(),
        })
      ).toString("base64");

      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: config.scope,
        state,
      });

      const authUrl = `${config.authUrl}?${params.toString()}`;

      return {
        authUrl,
        provider: input.provider,
        message: `Redirecting to ${input.provider} for authorization...`,
      };
    }),

  /**
   * Handle OAuth callback and link account
   */
  handleOAuthCallback: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]),
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Verify state token
      try {
        const decodedState = JSON.parse(
          Buffer.from(input.state, "base64").toString()
        );

        if (decodedState.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "State token mismatch",
          });
        }
      } catch {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid state token",
        });
      }

      // In production, exchange code for access token with the OAuth provider
      // For now, simulate the token exchange
      const accessToken = `mock_token_${input.provider}_${Date.now()}`;
      const refreshToken = `mock_refresh_${input.provider}_${Date.now()}`;
      const tokenExpiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

      // Get provider profile data (simulated)
      const profileData = {
        id: `${input.provider}_user_${Math.random()}`,
        name: "User Name",
        email: "user@example.com",
        profilePicture: "https://via.placeholder.com/150",
      };

      // Check if account is already linked
      const existingLink = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.userId, ctx.user.id),
            eq(linkedAccounts.provider, input.provider)
          )
        )
        .limit(1);

      let linkedAccount;

      if (existingLink[0]) {
        // Update existing link
        await db
          .update(linkedAccounts)
          .set({
            accessToken,
            refreshToken,
            tokenExpiresAt,
            profileData,
            lastSyncedAt: new Date(),
          })
          .where(eq(linkedAccounts.id, existingLink[0].id));

        linkedAccount = existingLink[0];
      } else {
        // Create new link
        const newLink = await db
          .insert(linkedAccounts)
          .values({
            userId: ctx.user.id,
            provider: input.provider,
            providerId: profileData.id,
            providerUsername: profileData.name,
            accessToken,
            refreshToken,
            tokenExpiresAt,
            profileData,
            isVerified: true,
          })
          .returning();

        linkedAccount = newLink[0];
      }

      // Create linking record
      await db
        .insert(accountLinkingRecords)
        .values({
          userId: ctx.user.id,
          linkedAccountId: linkedAccount.id,
          action: "linked",
          details: {
            provider: input.provider,
            linkedAt: new Date(),
          },
        });

      // Update user's linkedAccounts JSON field
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const currentLinks = (user[0]?.linkedAccounts as any) || {};
      currentLinks[input.provider] = {
        linkedAccountId: linkedAccount.id,
        linkedAt: new Date(),
      };

      await db
        .update(users)
        .set({ linkedAccounts: currentLinks })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        provider: input.provider,
        linkedAccountId: linkedAccount.id,
        message: `${input.provider} account linked successfully!`,
      };
    }),

  /**
   * Unlink social account
   */
  unlinkAccount: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Find linked account
      const linkedAccount = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.userId, ctx.user.id),
            eq(linkedAccounts.provider, input.provider)
          )
        )
        .limit(1);

      if (!linkedAccount[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `${input.provider} account not linked`,
        });
      }

      // Create unlinking record
      await db
        .insert(accountLinkingRecords)
        .values({
          userId: ctx.user.id,
          linkedAccountId: linkedAccount[0].id,
          action: "unlinked",
          details: {
            provider: input.provider,
            unlinkedAt: new Date(),
          },
        });

      // Delete linked account
      // Note: In production, you might want to soft-delete instead
      // await db.delete(linkedAccounts).where(eq(linkedAccounts.id, linkedAccount[0].id));

      // Update user's linkedAccounts JSON field
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      const currentLinks = (user[0]?.linkedAccounts as any) || {};
      delete currentLinks[input.provider];

      await db
        .update(users)
        .set({ linkedAccounts: currentLinks })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
        provider: input.provider,
        message: `${input.provider} account unlinked successfully`,
      };
    }),

  /**
   * Get all linked accounts for current user
   */
  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    const accounts = await db
      .select()
      .from(linkedAccounts)
      .where(eq(linkedAccounts.userId, ctx.user.id))
      .orderBy((t) => [t.createdAt]);

    return {
      accounts,
      total: accounts.length,
      message: `You have ${accounts.length} linked account(s)`,
    };
  }),

  /**
   * Get specific provider info
   */
  getProviderInfo: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = getDb();

      const account = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.userId, ctx.user.id),
            eq(linkedAccounts.provider, input.provider)
          )
        )
        .limit(1);

      if (!account[0]) {
        return {
          isLinked: false,
          provider: input.provider,
          message: `${input.provider} account not linked`,
        };
      }

      return {
        isLinked: true,
        provider: input.provider,
        linkedAccountId: account[0].id,
        providerUsername: account[0].providerUsername,
        profileData: account[0].profileData,
        isVerified: account[0].isVerified,
        linkedAt: account[0].createdAt,
        lastSyncedAt: account[0].lastSyncedAt,
      };
    }),

  /**
   * Sync data from linked account
   * In production, fetch followers, videos, etc. from the provider
   */
  syncLinkedAccountData: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const account = await db
        .select()
        .from(linkedAccounts)
        .where(
          and(
            eq(linkedAccounts.userId, ctx.user.id),
            eq(linkedAccounts.provider, input.provider)
          )
        )
        .limit(1);

      if (!account[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `${input.provider} account not linked`,
        });
      }

      // In production, fetch data from the provider's API
      // For now, simulate the sync
      const syncedData = {
        followers: Math.floor(Math.random() * 10000),
        following: Math.floor(Math.random() * 1000),
        posts: Math.floor(Math.random() * 500),
        videos: Math.floor(Math.random() * 100),
        totalViews: Math.floor(Math.random() * 1000000),
      };

      // Update last synced time
      await db
        .update(linkedAccounts)
        .set({ lastSyncedAt: new Date() })
        .where(eq(linkedAccounts.id, account[0].id));

      // Create sync record
      await db
        .insert(accountLinkingRecords)
        .values({
          userId: ctx.user.id,
          linkedAccountId: account[0].id,
          action: "synced",
          details: {
            provider: input.provider,
            syncedData,
            syncedAt: new Date(),
          },
        });

      return {
        success: true,
        provider: input.provider,
        syncedData,
        message: `${input.provider} data synced successfully`,
      };
    }),
});
