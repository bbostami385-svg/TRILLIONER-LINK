import { describe, expect, it } from "vitest";
import {
  TEEN_SAFETY_DEFAULTS,
  decideTeenContact,
  deriveAgeCategory,
  getDefaultTeenSafetySettings,
  isWithinQuietHours,
} from "./childSafety";

const settings = {
  id: 1,
  userId: 2,
  ...TEEN_SAFETY_DEFAULTS,
  updatedAt: new Date(),
  createdAt: new Date(),
} as any;

describe("child safety policy", () => {
  it("classifies verified users into teen and adult categories", () => {
    expect(deriveAgeCategory(13)).toBe("teen");
    expect(deriveAgeCategory(17)).toBe("teen");
    expect(deriveAgeCategory(18)).toBe("adult");
  });

  it("rejects under-13 classification", () => {
    expect(() => deriveAgeCategory(12)).toThrow("at least 13");
  });

  it("provisions privacy-by-default settings for teen accounts", () => {
    expect(getDefaultTeenSafetySettings(42)).toMatchObject({ userId: 42, profileVisibility: "followers", followPermission: "approved_only", messagePermission: "approved_requests", quietHoursEnabled: true });
  });

  it("restricts adult-to-teen contact unless the teen policy permits it", () => {
    const decision = decideTeenContact({ actorAgeCategory: "adult", targetAgeCategory: "teen", eventType: "message_attempt", settings, actorFollowsTarget: false, alreadyBlocked: false, recentAttempts: 0 });
    expect(decision).toMatchObject({ allowed: false, outcome: "warned" });
    expect(decision.reason).toContain("Adult-to-teen");
  });

  it("flags repeated contact attempts before delivery", () => {
    const decision = decideTeenContact({ actorAgeCategory: "adult", targetAgeCategory: "teen", eventType: "message_attempt", settings, actorFollowsTarget: false, alreadyBlocked: false, recentAttempts: 5 });
    expect(decision).toMatchObject({ allowed: false, outcome: "flagged" });
  });

  it("recognizes quiet hours across midnight", () => {
    expect(isWithinQuietHours(new Date("2026-08-27T23:00:00"), "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(new Date("2026-08-27T06:30:00"), "22:00", "07:00")).toBe(true);
    expect(isWithinQuietHours(new Date("2026-08-27T12:00:00"), "22:00", "07:00")).toBe(false);
  });
});
