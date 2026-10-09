import { describe, expect, it } from "vitest";
import { validateApiResponse } from "./apiResponse";

describe("validateApiResponse", () => {
  it("reads the network body once and returns a fresh JSON response", async () => {
    const response = new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
    const validated = await validateApiResponse(response);
    await expect(validated.json()).resolves.toEqual({ ok: true });
    expect(response.bodyUsed).toBe(true);
  });

  it("rejects an HTML fallback after consuming it once", async () => {
    const response = new Response("<!doctype html><html><body>Not found</body></html>", { status: 404, headers: { "content-type": "text/html" } });
    await expect(validateApiResponse(response)).rejects.toThrow("backend API is unavailable");
    expect(response.bodyUsed).toBe(true);
  });

  it("rejects malformed non-JSON API responses", async () => {
    const response = new Response("The page could not be found", { status: 404, headers: { "content-type": "text/plain" } });
    await expect(validateApiResponse(response)).rejects.toThrow("non-JSON response");
  });
});
