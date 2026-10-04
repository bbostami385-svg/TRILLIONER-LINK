import { describe, expect, it, vi } from "vitest";
import { copyrightRouter } from "./copyright";
import * as db from "../db";

vi.mock("../db", () => ({ getRequiredDb: vi.fn() }));

const caller = (user: { id: number; role: "user" | "admin" }) => copyrightRouter.createCaller({ user } as any);
const chain = (value: unknown) => ({ from: vi.fn().mockReturnThis(), where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue(value) });

function database(selectValues: unknown[] = []) {
  const selects = [...selectValues];
  const updateWhere = vi.fn().mockResolvedValue({});
  const database = {
    select: vi.fn(() => chain(selects.shift() ?? [])),
    insert: vi.fn(() => ({ values: vi.fn(() => ({ $returningId: vi.fn().mockResolvedValue([{ id: 44 }]) })) })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
  };
  return { database, updateWhere };
}

describe("copyright protection", () => {
  it("requires the original uploader to change protection settings", async () => {
    const fixture = database([[{ id: 7, userId: 22, isPublic: true }]]);
    vi.mocked(db.getRequiredDb).mockResolvedValue(fixture.database as never);
    await expect(caller({ id: 17, role: "user" }).updateProtection({ videoId: 7 })).rejects.toThrow("original uploader");
    expect(fixture.database.update).not.toHaveBeenCalled();
  });

  it("requires an ownership attestation for copyright claims", async () => {
    vi.mocked(db.getRequiredDb).mockResolvedValue(database().database as never);
    await expect(caller({ id: 17, role: "user" }).submitClaim({ claimType: "copyright", targetVideoId: 7, description: "This is an original work copied without permission.", contactEmail: "owner@example.com" })).rejects.toThrow("ownership attestation");
  });

  it("persists a privacy claim with an optional target video", async () => {
    const fixture = database([[{ id: 7, userId: 22, isPublic: true }], []]);
    vi.mocked(db.getRequiredDb).mockResolvedValue(fixture.database as never);
    const result = await caller({ id: 17, role: "user" }).submitClaim({ claimType: "privacy_recording", targetVideoId: 7, description: "A private call was recorded and redistributed without consent.", contactEmail: "member@example.com" });
    expect(result).toEqual({ success: true, claimId: 44, status: "pending" });
    expect(fixture.database.insert).toHaveBeenCalledTimes(1);
  });

  it("lets an admin action a claim and hides the reported video", async () => {
    const fixture = database([[{ id: 44, targetVideoId: 7, status: "pending" }]]);
    vi.mocked(db.getRequiredDb).mockResolvedValue(fixture.database as never);
    const result = await caller({ id: 1, role: "admin" }).admin.resolveClaim({ claimId: 44, status: "actioned", resolutionNote: "Confirmed unauthorized re-upload." });
    expect(result).toMatchObject({ success: true, hiddenTargetVideo: true });
    expect(fixture.database.update).toHaveBeenCalledTimes(2);
  });
});
