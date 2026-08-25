import { describe, expect, it, vi, beforeEach } from "vitest";
import { pollsRouter } from "./polls";
import * as dbModule from "../db";

vi.mock("../db");

function selectChain<T>(result: T) {
  const chain = {
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async () => result),
  };
  return chain;
}

describe("Polls Router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns recent polls with their options", async () => {
    const recent = [{ id: 4, question: "Best format?", createdAt: new Date(), expiresAt: null }];
    const options = [{ id: 8, pollId: 4, text: "Shorts", votes: 3 }];
    const fakeDb = {
      select: vi.fn()
        .mockReturnValueOnce(selectChain(recent))
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(async () => options) })) }),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(fakeDb as any);

    const result = await pollsRouter.createCaller({} as any).getRecentPolls({ limit: 20 });

    expect(result).toEqual([{ ...recent[0], options }]);
  });

  it("rejects an invalid option instead of returning success", async () => {
    const fakeDb = { select: vi.fn().mockReturnValue(selectChain([])) };
    vi.mocked(dbModule.getDb).mockResolvedValue(fakeDb as any);

    await expect(pollsRouter.createCaller({ user: { id: 1 } } as any).votePoll({ optionId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects voting after a poll expires", async () => {
    const fakeDb = {
      select: vi.fn().mockReturnValue(selectChain([{ id: 8, votes: 2, expiresAt: new Date(Date.now() - 1_000) }])),
    };
    vi.mocked(dbModule.getDb).mockResolvedValue(fakeDb as any);

    await expect(pollsRouter.createCaller({ user: { id: 1 } } as any).votePoll({ optionId: 8 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
