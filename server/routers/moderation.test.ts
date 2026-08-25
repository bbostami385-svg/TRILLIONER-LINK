import { describe, expect, it, vi } from "vitest";
import { moderationRouter } from "./moderation";
import * as moderation from "../contentModeration";
import * as db from "../db";

vi.mock("../contentModeration");
vi.mock("../db", () => ({ getRequiredDb: vi.fn() }));

const caller = (user: { id: number; role: "user" | "admin" }) => moderationRouter.createCaller({ user } as any);
const selectChain = (value: unknown) => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(value), offset: vi.fn().mockResolvedValue(value) });

function dbStub(options: { selectValues?: unknown[]; insertId?: number } = {}) {
  const selectValues = [...(options.selectValues ?? [[]])];
  return {
    select: vi.fn(() => selectChain(selectValues.shift() ?? [])),
    insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue([{ insertId: options.insertId ?? 1 }]) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
    delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
  };
}

describe("moderation.scanContent", () => {
  it("returns a structured allow decision from the shared moderation service", async () => {
    vi.mocked(moderation.moderateContent).mockResolvedValue({ decision: "allow", category: "clean", confidence: 0.98, reason: "No policy issue detected." });
    const result = await caller({ id: 17, role: "user" }).scanContent({ content: "A science lesson" });
    expect(result).toEqual({ isClean: true, decision: "allow", category: "clean", flaggedKeywords: [], score: 98, reason: "No policy issue detected." });
  });

  it("exposes block category and reason without weakening the moderation result", async () => {
    vi.mocked(moderation.moderateContent).mockResolvedValue({ decision: "block", category: "violence", confidence: 1, reason: "Violent wrongdoing is not allowed." });
    await expect(caller({ id: 17, role: "user" }).scanContent({ content: "unsafe content" })).resolves.toMatchObject({ isClean: false, decision: "block", category: "violence", flaggedKeywords: ["violence"], score: 100 });
  });
});

describe("moderation persistence", () => {
  it("creates a durable report and deduplicates a pending report", async () => {
    const dbStubValue = dbStub({ selectValues: [[], [{ id: 9 }]], insertId: 9 });
    vi.mocked(db.getRequiredDb).mockResolvedValue(dbStubValue as never);
    const first = await caller({ id: 17, role: "user" }).reportContent({ contentType: "comment", contentId: 22, reason: "spam" });
    expect(first).toMatchObject({ success: true, reportId: 9, duplicate: false });
    const second = await caller({ id: 17, role: "user" }).reportContent({ contentType: "comment", contentId: 22, reason: "spam" });
    expect(second).toMatchObject({ success: true, reportId: 9, duplicate: true });
  });

  it("persists a block and prevents self-blocking", async () => {
    const database = dbStub({ selectValues: [[]] });
    vi.mocked(db.getRequiredDb).mockResolvedValue(database as never);
    await expect(caller({ id: 17, role: "user" }).blockUser({ userId: 22 })).resolves.toMatchObject({ success: true });
    expect(database.insert).toHaveBeenCalledTimes(1);
    await expect(caller({ id: 17, role: "user" }).blockUser({ userId: 17 })).rejects.toThrow("cannot block");
  });

  it("requires admin access to resolve reports and persists reviewer state", async () => {
    const database = dbStub({ selectValues: [[{ id: 9, status: "pending" }]] });
    vi.mocked(db.getRequiredDb).mockResolvedValue(database as never);
    await expect(caller({ id: 17, role: "user" }).resolveReport({ reportId: 9, action: "reject", reason: "Reviewed and rejected." })).rejects.toThrow("Administrator");
    await expect(caller({ id: 1, role: "admin" }).resolveReport({ reportId: 9, action: "reject", reason: "Reviewed and rejected." })).resolves.toMatchObject({ success: true, action: "reject" });
    expect(database.update).toHaveBeenCalledTimes(1);
  });
});
