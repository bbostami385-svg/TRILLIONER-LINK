import type { Express, Request, Response } from "express";
import { z } from "zod";
import { appRouter } from "./routers";
import { createContext } from "./_core/context";

const providerSchema = z.enum(["google", "youtube", "facebook", "instagram", "tiktok"]);

function queryString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function registerSocialOAuthRoutes(app: Express) {
  app.get("/api/social/callback", async (req: Request, res: Response) => {
    const providerResult = providerSchema.safeParse(queryString(req.query.provider));
    const code = queryString(req.query.code);
    const state = queryString(req.query.state);
    if (!providerResult.success || !code || !state) {
      res.status(400).send("Invalid social authorization callback.");
      return;
    }

    try {
      const ctx = await createContext({ req: req as any, res: res as any, info: {} as any });
      if (!ctx.user) {
        res.status(401).send("Please sign in before linking a social account.");
        return;
      }
      const result = await appRouter.createCaller(ctx).socialLinking.handleOAuthCallback({
        provider: providerResult.data,
        code,
        state,
      });
      const destination = new URL("/settings", result.redirectOrigin);
      destination.searchParams.set("verification", "accounts");
      destination.searchParams.set("linked", result.provider);
      res.redirect(destination.toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Social account linking failed.";
      res.status(400).send(message);
    }
  });
}
