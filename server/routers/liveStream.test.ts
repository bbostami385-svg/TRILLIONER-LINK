import { describe, expect, it, vi } from "vitest";
import { getDb } from "../db";
import { liveStreamRouter } from "./liveStream";

vi.mock("../db", () => ({ getDb: vi.fn() }));

const dbMock = vi.mocked(getDb);
const user = { id: 7, name: "Creator" } as any;
const caller = () => liveStreamRouter.createCaller({ user } as any);

function selectChain(rows: any[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  return { from, where, limit };
}

describe("liveStreamRouter", () => {
  it("persists a new live stream and returns its database record", async () => {
    const createdAt = new Date();
    const streamRecord = { id: 11, streamId: "stream-7-x", creatorId: 7, status: "live", createdAt };
    const select = selectChain([streamRecord]);
    dbMock.mockResolvedValueOnce({
      insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
      select: vi.fn().mockReturnValue(select),
    } as any);

    const result = await caller().startLiveStream({ title: "Science live", isPublic: true });

    expect(result).toMatchObject({ creatorId: 7, status: "live" });
    expect(select.limit).toHaveBeenCalledWith(1);
  });

  it("rejects ending a stream owned by another creator", async () => {
    const select = selectChain([{ id: 11, creatorId: 99, status: "live" }]);
    dbMock.mockResolvedValueOnce({ select: vi.fn().mockReturnValue(select) } as any);

    await expect(caller().endLiveStream({ streamId: "stream-other" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects chat writes to a missing stream", async () => {
    const select = selectChain([]);
    dbMock.mockResolvedValueOnce({ select: vi.fn().mockReturnValue(select) } as any);

    await expect(caller().sendStreamChatMessage({ streamId: "missing", message: "Hello" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
