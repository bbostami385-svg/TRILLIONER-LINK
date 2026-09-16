import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as dbModule from "./db";

vi.mock("./db");

describe("root app router integration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("routes a protected recommendation interaction through the composed app router", async () => {
    const values = vi.fn().mockResolvedValue({ insertId: 44 });
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue({ insert: vi.fn(() => ({ values })) } as never);

    const result = await appRouter.createCaller({ user: { id: 17, role: "user" } } as any).recommendations.trackInteraction({
      contentId: 33,
      contentType: "video",
      interactionType: "view",
      duration: 12,
    });

    expect(result).toEqual({ success: true, message: "Interaction tracked" });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 17, contentId: 33, contentType: "video", interactionType: "view", duration: 12 }));
  });
});
