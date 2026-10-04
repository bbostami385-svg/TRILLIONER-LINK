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

  it("composes a creator upload and rights report through the same persisted caller context", async () => {
    const video = { id: 77, userId: 17, title: "Original science lesson", videoUrl: "https://cdn.example.com/original.mp4", isPublic: false };
    vi.mocked(dbModule.createVideo).mockResolvedValue(video as never);
    const selectValues = [[video], []];
    const db = {
      select: vi.fn(() => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(selectValues.shift() ?? []) })),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 88 }]) })) })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const caller = appRouter.createCaller({ user: { id: 17, role: "user" } } as any);
    const created = await caller.videos.createVideo({ title: video.title, videoUrl: video.videoUrl, isPublic: false, hashtags: [] });
    const claimant = appRouter.createCaller({ user: { id: 23, role: "user" } } as any);
    const claim = await claimant.copyright.submitClaim({ targetVideoId: created.id, claimType: "unauthorized_reupload", description: "This original work was copied and uploaded without permission.", contactEmail: "owner@example.com", attestedOwnership: true });
    expect(created.id).toBe(77);
    expect(claim).toEqual({ success: true, claimId: 88, status: "pending" });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  it("composes a social post creation and public read through the root router", async () => {
    const post = { id: 91, userId: 17, content: "A persisted community update", createdAt: new Date() };
    vi.mocked(dbModule.createPost).mockResolvedValue(post as never);
    vi.mocked(dbModule.getPostById).mockResolvedValue(post as never);
    const caller = appRouter.createCaller({ user: { id: 17, role: "user" } } as any);
    const created = await caller.feed.createPost({ content: post.content });
    const readBack = await appRouter.createCaller({ user: null } as any).feed.getPost({ postId: created.id });
    expect(readBack).toMatchObject({ id: 91, content: post.content });
  });

  it("persists mode selection and initializes both mode preference records", async () => {
    const updateWhere = vi.fn().mockResolvedValue({});
    const insertValues = vi.fn().mockResolvedValue({});
    const db = {
      update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
      select: vi.fn(() => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([]) })),
      insert: vi.fn(() => ({ values: insertValues })),
    };
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await appRouter.createCaller({ user: { id: 17, role: "user" } } as any).dualMode.initializeModePreferences({ selectedMode: "creator" });
    expect(result).toMatchObject({ success: true, mode: "creator" });
    expect(updateWhere).toHaveBeenCalledTimes(1);
    expect(insertValues).toHaveBeenCalledTimes(2);
  });
});
