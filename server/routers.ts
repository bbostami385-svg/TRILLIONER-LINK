import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { z } from "zod";
import { sdk } from "./_core/sdk";
import { upsertUser } from "./db";
import { firebaseServerConfigured, verifyFirebaseIdToken } from "./firebaseAuth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { feedRouter } from "./routers/feed";
import { messagesRouter } from "./routers/messages";
import { usersRouter } from "./routers/users";
import { videosRouter } from "./routers/videos";
import { storiesRouter } from "./routers/stories";
import { commentsRouter } from "./routers/comments";
import { searchRouter } from "./routers/search";
import { notificationsRouter } from "./routers/notifications";
import { paymentRouter } from "./routers/payment";
import { marketplaceRouter } from "./routers/marketplace";
import { liveStreamRouter } from "./routers/liveStream";
import { moderationRouter } from "./routers/moderation";
import { recommendationsRouter } from "./routers/recommendations";
import { profileEditRouter } from "./routers/profileEdit";
import { groupsRouter } from "./routers/groups";
import { eventsRouter } from "./routers/events";
import { reelsRouter } from "./routers/reels";
import { pollsRouter } from "./routers/polls";
import { reactionsRouter } from "./routers/reactions";
import { collectionsRouter } from "./routers/collections";
import { verificationRouter } from "./routers/verification";
import { mentionsRouter } from "./routers/mentions";
import { duetsRouter } from "./routers/duets";
import { challengesRouter } from "./routers/challenges";
import { adsRouter } from "./routers/ads";
import { arFiltersRouter } from "./routers/arFilters";
import { soundsRouter } from "./routers/sounds";
import { historyRouter } from "./routers/history";
import { pagesRouter } from "./routers/pages";
import { dualModeRouter } from "./routers/dualMode";
import { levelsRouter } from "./routers/levels";
import { ageVerificationRouter } from "./routers/ageVerification";
import { humanVerificationRouter } from "./routers/humanVerification";
import { kycRouter } from "./routers/kyc";
import { socialLinkingRouter } from "./routers/socialLinking";
import { creatorAnalyticsRouter } from "./routers/creatorAnalytics";
import { moderationAppealsRouter } from "./routers/moderationAppeals";
import { invitationRouter } from "./routers/invitations";
import { profileRewardsRouter } from "./routers/profileRewards";
import { creatorPlaylistsRouter } from "./routers/creatorPlaylists";
import { subscriptionCollectionsRouter } from "./routers/subscriptionCollections";
import { adminMediaRouter } from "./routers/adminMedia";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    exchangeFirebaseToken: publicProcedure
      .input(z.object({ idToken: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!firebaseServerConfigured) {
          throw new Error("Firebase server auth is not configured. Add FIREBASE_SERVICE_ACCOUNT_BASE64 before enabling Firebase sign-in.");
        }
        const decoded = await verifyFirebaseIdToken(input.idToken);
        const openId = `firebase:${decoded.uid}`;
        const name = decoded.name ?? decoded.email?.split("@")[0] ?? "TRILLIONER LINK member";
        await upsertUser({ openId, name, email: decoded.email ?? null, loginMethod: decoded.firebase?.sign_in_provider ?? "firebase", lastSignedIn: new Date() });
        const sessionToken = await sdk.signSession({ openId, appId: "firebase", name });
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(ctx.req), maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  feed: feedRouter,
  messages: messagesRouter,
  users: usersRouter,
  videos: videosRouter,
  stories: storiesRouter,
  comments: commentsRouter,
  search: searchRouter,
  notifications: notificationsRouter,
  payment: paymentRouter,
  marketplace: marketplaceRouter,
  liveStream: liveStreamRouter,
  moderation: moderationRouter,
  recommendations: recommendationsRouter,
  profileEdit: profileEditRouter,
  groups: groupsRouter,
  events: eventsRouter,
  reels: reelsRouter,
  polls: pollsRouter,
  reactions: reactionsRouter,
  collections: collectionsRouter,
  verification: verificationRouter,
  mentions: mentionsRouter,
  duets: duetsRouter,
  challenges: challengesRouter,
  ads: adsRouter,
  arFilters: arFiltersRouter,
  sounds: soundsRouter,
  history: historyRouter,
  pages: pagesRouter,
  dualMode: dualModeRouter,
  levels: levelsRouter,
  ageVerification: ageVerificationRouter,
  humanVerification: humanVerificationRouter,
  kyc: kycRouter,
  socialLinking: socialLinkingRouter,
  creatorAnalytics: creatorAnalyticsRouter,
  moderationAppeals: moderationAppealsRouter,
  invitations: invitationRouter,
  profileRewards: profileRewardsRouter,
  creatorPlaylists: creatorPlaylistsRouter,
  subscriptionCollections: subscriptionCollectionsRouter,
  adminMedia: adminMediaRouter,
});

export type AppRouter = typeof appRouter;
