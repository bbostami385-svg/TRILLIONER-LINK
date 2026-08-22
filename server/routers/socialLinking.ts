import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getRequiredDb } from "../db";
import { accountLinkingRecords, linkedAccounts, users } from "../../drizzle/schema";
import {
  buildAuthorizationUrl,
  exchangeCode,
  fetchProviderProfile,
  verifyOAuthState,
  type SocialProvider,
} from "../socialOAuth";

const providerSchema = z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]);
const safeAccountSelection = {
  id: linkedAccounts.id,
  provider: linkedAccounts.provider,
  providerUsername: linkedAccounts.providerUsername,
  isVerified: linkedAccounts.isVerified,
  createdAt: linkedAccounts.createdAt,
  updatedAt: linkedAccounts.updatedAt,
  lastSyncedAt: linkedAccounts.lastSyncedAt,
};

export const socialLinkingRouter = router({
  generateOAuthURL: protectedProcedure
    .input(z.object({ provider: providerSchema, origin: z.string().url() }))
    .mutation(({ input, ctx }) => {
      try {
        return {
          authUrl: buildAuthorizationUrl(input.provider as SocialProvider, input.origin, ctx.user.id),
          provider: input.provider,
          message: `Redirecting to ${input.provider} for authorization...`,
        };
      } catch (error) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: error instanceof Error ? error.message : "OAuth provider is not configured." });
      }
    }),

  handleOAuthCallback: protectedProcedure
    .input(z.object({ provider: providerSchema, code: z.string().min(1), state: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      let state: ReturnType<typeof verifyOAuthState>;
      try {
        state = verifyOAuthState(input.state, input.provider as SocialProvider);
      } catch (error) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: error instanceof Error ? error.message : "Invalid OAuth state." });
      }
      if (state.userId !== ctx.user.id) throw new TRPCError({ code: "UNAUTHORIZED", message: "OAuth account owner mismatch." });

      let token: Awaited<ReturnType<typeof exchangeCode>>;
      let profile: Awaited<ReturnType<typeof fetchProviderProfile>>;
      try {
        token = await exchangeCode(input.provider as SocialProvider, input.code, state.origin);
        profile = await fetchProviderProfile(input.provider as SocialProvider, token.accessToken);
      } catch (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Provider authorization failed." });
      }

      const db = await getRequiredDb();
      const [ownedByAnotherUser] = await db.select({ id: linkedAccounts.id, userId: linkedAccounts.userId })
        .from(linkedAccounts)
        .where(and(eq(linkedAccounts.provider, input.provider), eq(linkedAccounts.providerId, profile.id)))
        .limit(1);
      if (ownedByAnotherUser && ownedByAnotherUser.userId !== ctx.user.id) {
        throw new TRPCError({ code: "CONFLICT", message: "This provider account is already linked to another TRILLIONER LINK account." });
      }

      const [existing] = await db.select().from(linkedAccounts)
        .where(and(eq(linkedAccounts.userId, ctx.user.id), eq(linkedAccounts.provider, input.provider)))
        .limit(1);
      const tokenExpiresAt = new Date(Date.now() + token.expiresIn * 1000);
      let linkedAccountId: number;
      if (existing) {
        linkedAccountId = existing.id;
        await db.update(linkedAccounts).set({
          providerId: profile.id,
          providerUsername: profile.username ?? profile.name,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          tokenExpiresAt,
          profileData: profile.raw,
          isVerified: true,
          lastSyncedAt: new Date(),
        }).where(eq(linkedAccounts.id, existing.id));
      } else {
        const inserted = await db.insert(linkedAccounts).values({
          userId: ctx.user.id,
          provider: input.provider,
          providerId: profile.id,
          providerUsername: profile.username ?? profile.name,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          tokenExpiresAt,
          profileData: profile.raw,
          isVerified: true,
          lastSyncedAt: new Date(),
        });
        linkedAccountId = Number(inserted[0].insertId);
      }

      await db.insert(accountLinkingRecords).values({
        userId: ctx.user.id,
        linkedAccountId,
        action: "linked",
        details: { provider: input.provider, linkedAt: new Date() },
      });
      const [user] = await db.select({ linkedAccounts: users.linkedAccounts }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const currentLinks = { ...((user?.linkedAccounts as Record<string, unknown> | null) ?? {}) };
      currentLinks[input.provider] = { linkedAccountId, linkedAt: new Date().toISOString() };
      await db.update(users).set({ linkedAccounts: currentLinks }).where(eq(users.id, ctx.user.id));

      return { success: true, provider: input.provider, linkedAccountId, redirectOrigin: state.origin, message: `${input.provider} account linked successfully.` };
    }),

  unlinkAccount: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [account] = await db.select({ id: linkedAccounts.id }).from(linkedAccounts)
        .where(and(eq(linkedAccounts.userId, ctx.user.id), eq(linkedAccounts.provider, input.provider))).limit(1);
      if (!account) throw new TRPCError({ code: "NOT_FOUND", message: `${input.provider} account is not linked.` });
      await db.update(linkedAccounts).set({ accessToken: null, refreshToken: null, isVerified: false }).where(eq(linkedAccounts.id, account.id));
      const [user] = await db.select({ linkedAccounts: users.linkedAccounts }).from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const currentLinks = { ...((user?.linkedAccounts as Record<string, unknown> | null) ?? {}) };
      delete currentLinks[input.provider];
      await db.update(users).set({ linkedAccounts: currentLinks }).where(eq(users.id, ctx.user.id));
      return { success: true, provider: input.provider, message: `${input.provider} account unlinked successfully.` };
    }),

  getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getRequiredDb();
    const accounts = await db.select(safeAccountSelection).from(linkedAccounts)
      .where(eq(linkedAccounts.userId, ctx.user.id)).orderBy(desc(linkedAccounts.createdAt));
    return { accounts, total: accounts.length, message: `You have ${accounts.length} linked account(s).` };
  }),

  getProviderInfo: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .query(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [account] = await db.select({ ...safeAccountSelection, profileData: linkedAccounts.profileData })
        .from(linkedAccounts)
        .where(and(eq(linkedAccounts.userId, ctx.user.id), eq(linkedAccounts.provider, input.provider))).limit(1);
      if (!account) return { isLinked: false, provider: input.provider, message: `${input.provider} account is not linked.` };
      return { isLinked: true, provider: input.provider, linkedAccountId: account.id, providerUsername: account.providerUsername, profileData: account.profileData, isVerified: account.isVerified, linkedAt: account.createdAt, lastSyncedAt: account.lastSyncedAt };
    }),

  syncLinkedAccountData: protectedProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ input, ctx }) => {
      const db = await getRequiredDb();
      const [account] = await db.select().from(linkedAccounts)
        .where(and(eq(linkedAccounts.userId, ctx.user.id), eq(linkedAccounts.provider, input.provider))).limit(1);
      if (!account || !account.accessToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: `${input.provider} must be linked again before it can be synced.` });
      let profile;
      try {
        profile = await fetchProviderProfile(input.provider as SocialProvider, account.accessToken);
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Unable to sync provider data." });
      }
      const syncedAt = new Date();
      await db.update(linkedAccounts).set({ providerUsername: profile.username ?? profile.name, profileData: profile.raw, lastSyncedAt: syncedAt }).where(eq(linkedAccounts.id, account.id));
      await db.insert(accountLinkingRecords).values({ userId: ctx.user.id, linkedAccountId: account.id, action: "synced", details: { provider: input.provider, syncedAt: syncedAt.toISOString() } });
      return { success: true, provider: input.provider, syncedData: { profile: profile.raw }, syncedAt, message: `${input.provider} data synced from the provider.` };
    }),
});
