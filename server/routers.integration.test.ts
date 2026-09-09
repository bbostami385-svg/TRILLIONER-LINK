import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("root router composition", () => {
  it("exposes the core social, creator, marketplace, and verification namespaces", () => {
    const record = (appRouter as any)._def.record;
    expect(record).toEqual(expect.objectContaining({
      marketplace: expect.any(Object),
      creatorAnalytics: expect.any(Object),
      humanVerification: expect.any(Object),
      dualMode: expect.any(Object),
      levels: expect.any(Object),
      pages: expect.any(Object),
      videos: expect.any(Object),
      comments: expect.any(Object),
    }));
  });
});
