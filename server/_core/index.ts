import "dotenv/config";
import express from "express";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSocialOAuthRoutes } from "../socialCallback";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { setupWebSocket } from "../websocket";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { getDb, getUserByOpenId, upsertUser } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = setupWebSocket(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  registerSocialOAuthRoutes(app);
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "trillioner-link-api", environment: process.env.NODE_ENV ?? "development", timestamp: new Date().toISOString() });
  });
  if (process.env.ENABLE_E2E_AUTH_BOOTSTRAP === "1" && process.env.NODE_ENV !== "production") {
    app.post("/api/e2e/session", async (req, res) => {
      if (!process.env.E2E_TEST_SECRET || req.header("x-e2e-secret") !== process.env.E2E_TEST_SECRET) {
        res.status(404).end();
        return;
      }
      const email = typeof req.body?.email === "string" ? req.body.email.trim().slice(0, 190) : "e2e@example.com";
      const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 120) : "E2E Member";
      const openId = `e2e:${email.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "member"}`;
      try {
        await upsertUser({ openId, name, email, role: "user", loginMethod: "e2e" });
        const db = await getDb();
        const user = await getUserByOpenId(openId);
        if (!db || !user) throw new Error("E2E database is unavailable.");
        await db.update(users).set({ age: 30, ageVerified: true, livenessVerified: true, livenessVerificationAt: new Date(), faceVerificationRequired: false, faceVerificationStatus: "not_required", accountMode: "social", modeSelected: true }).where(eq(users.id, user.id));
        const sessionToken = await sdk.signSession({ openId, appId: "e2e", name });
        const sessionCookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...sessionCookieOptions, sameSite: req.protocol === "https" ? "none" : "lax", maxAge: ONE_YEAR_MS });
        res.json({ success: true, userId: user.id });
      } catch (error) {
        console.error("[E2E] Failed to bootstrap session", error);
        res.status(503).json({ error: "E2E database is unavailable." });
      }
    });
  }
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
