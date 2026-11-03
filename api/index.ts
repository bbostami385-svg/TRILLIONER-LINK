import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "trillioner-link-api", environment: process.env.NODE_ENV ?? "production", timestamp: new Date().toISOString() });
});

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use((error: unknown, _req: Request, res: Response, _next: unknown) => {
  console.error("[API] Unhandled request error", error);
  if (res.headersSent) return;
  res.status(500).json({ error: "TRILLIONER LINK API request failed.", code: "INTERNAL_API_ERROR" });
});

export default function handler(req: Request, res: Response) {
  app(req, res);
}
