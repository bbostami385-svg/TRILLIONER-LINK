import { describe, expect, it } from "vitest";
import { creatorPlaylistsRouter } from "./routers/creatorPlaylists";
import { subscriptionCollectionsRouter } from "./routers/subscriptionCollections";

const authenticated = { user: { id: 1 } } as any;

describe("creator organization contracts", () => {
  it("rejects empty playlist names before database access", async () => {
    const caller = creatorPlaylistsRouter.createCaller(authenticated);
    await expect(caller.create({ name: "", isPublic: false })).rejects.toThrow();
  });

  it("rejects invalid public playlist identifiers", async () => {
    const caller = creatorPlaylistsRouter.createCaller({} as any);
    await expect(caller.publicItems({ playlistId: 0 })).rejects.toThrow();
  });

  it("requires a positive video identifier when adding a playlist item", async () => {
    const caller = creatorPlaylistsRouter.createCaller(authenticated);
    await expect(caller.addVideo({ playlistId: 1, videoId: 0 })).rejects.toThrow();
  });
});

describe("subscription topic contracts", () => {
  it("rejects empty topic names before database access", async () => {
    const caller = subscriptionCollectionsRouter.createCaller(authenticated);
    await expect(caller.create({ name: "", color: "cyan" })).rejects.toThrow();
  });

  it("rejects invalid collection identifiers before database access", async () => {
    const caller = subscriptionCollectionsRouter.createCaller(authenticated);
    await expect(caller.channels({ collectionId: 0 })).rejects.toThrow();
  });
});
