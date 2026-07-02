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
});

export type AppRouter = typeof appRouter;
