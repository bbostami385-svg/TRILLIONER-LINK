import { describe, expect, it } from "vitest";
import { calculateAge, validateDateOfBirth } from "./routers/ageVerification";
import { calculateLevel } from "./routers/levels";
import { getLevelProgress } from "../client/src/lib/levelUtils";

describe("verification rules", () => {
  it("rejects a future date of birth", () => {
    expect(() => validateDateOfBirth("2099-01-01T00:00:00.000Z")).toThrow("valid date of birth");
  });

  it("calculates an age without counting an upcoming birthday", () => {
    const today = new Date();
    const upcomingBirthday = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() + 1);
    expect(calculateAge(upcomingBirthday)).toBe(17);
  });
});

describe("follower levels", () => {
  it("uses the exact threshold boundaries", () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(50)).toBe(2);
    expect(calculateLevel(500)).toBe(4);
    expect(calculateLevel(5_000_000_000)).toBe(20);
  });

  it("does not exceed level 20", () => {
    expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBe(20);
  });

  it("calculates progress between two levels", () => {
    expect(getLevelProgress(25, 1)).toBe(50);
    expect(getLevelProgress(50, 2)).toBe(0);
    expect(getLevelProgress(5_000_000_000, 20)).toBe(100);
  });
});
