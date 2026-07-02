import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
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

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
});

export type AppRouter = typeof appRouter;

export { playlistsRouter } from "./routers/playlists";
export { subscriptionsRouter } from "./routers/subscriptions";
export { reportingRouter } from "./routers/reporting";
export { blockingRouter } from "./routers/blocking";
export { storyHighlightsRouter } from "./routers/storyHighlights";
export { shoppingRouter } from "./routers/shopping";
