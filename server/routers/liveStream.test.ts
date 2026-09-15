import { beforeEach, describe, expect, it, vi } from "vitest";
import { liveStreamRouter } from "./liveStream";
import * as dbModule from "../db";

vi.mock("../db");

function createDb() {
  const values = vi.fn().mockResolvedValue([{ insertId: 1 }]);
  const where = vi.fn().mockResolvedValue([{ id: 1 }]);
  const limit = vi.fn().mockResolvedValue([{ id: 1 }]);
  const from = vi.fn(() => ({ where: vi.fn(() => ({ limit })), limit }));
  const select = vi.fn(() => ({ from }));
  const insert = vi.fn(() => ({ values }));
  const set = vi.fn(() => ({ where: vi.fn().mockResolvedValue({ affectedRows: 1 }) }));
  const update = vi.fn(() => ({ set }));
  return { select, insert, update, values, where, limit, set };
}

describe("live stream persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists a creator stream with generated transport metadata", async () => {
    const db = createDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await liveStreamRouter.createCaller({ user: { id: 9 } } as any).startLiveStream({ title: "Science live", isPublic: true });
    expect(result.status).toBe("ready");
    expect(result.streamId).toContain("stream-9-");
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ creatorId: 9, title: "Science live", status: "ready" }));
  });

  it("ends only a stream owned by the authenticated creator", async () => {
    const db = createDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await liveStreamRouter.createCaller({ user: { id: 9 } } as any).endLiveStream({ streamId: "stream-9-1" });
    expect(result.success).toBe(true);
    expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ status: "ended" }));
  });

  it("persists chat messages for an active stream", async () => {
    const db = createDb();
    vi.mocked(dbModule.getRequiredDb).mockResolvedValue(db as never);
    const result = await liveStreamRouter.createCaller({ user: { id: 9 } } as any).sendStreamChatMessage({ streamId: "stream-9-1", message: "Hello live" });
    expect(result.success).toBe(true);
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ streamId: "stream-9-1", userId: 9, message: "Hello live" }));
  });
});
