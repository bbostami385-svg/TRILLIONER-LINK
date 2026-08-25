import { describe, expect, it } from "vitest";
import { historyRouter } from "./routers/history";

describe("watch history router", () => {
  it("rejects anonymous history reads", async () => {
    const caller = historyRouter.createCaller({ user: null } as any);
    await expect(caller.getWatchHistory({ limit: 20 })).rejects.toThrow();
  });

  it("rejects invalid history limits before database access", async () => {
    const caller = historyRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.getWatchHistory({ limit: 0 })).rejects.toThrow();
  });

  it("rejects invalid history item identifiers", async () => {
    const caller = historyRouter.createCaller({ user: { id: 1 } } as any);
    await expect(caller.removeFromHistory({ historyId: 0 })).rejects.toThrow();
  });
});
