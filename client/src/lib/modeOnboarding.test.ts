import { describe, expect, it } from "vitest";
import { selectModeStatistics, shouldRedirectToWelcome } from "./modeOnboarding";

describe("dual-mode onboarding contracts", () => {
  it("redirects authenticated users with an explicitly unselected mode", () => {
    expect(shouldRedirectToWelcome({ isAuthenticated: true, location: "/feed", modeSelected: false })).toBe(true);
    expect(shouldRedirectToWelcome({ isAuthenticated: true, location: "/feed", modeSelected: true })).toBe(false);
  });

  it("does not redirect public or onboarding routes", () => {
    expect(shouldRedirectToWelcome({ isAuthenticated: true, location: "/welcome", modeSelected: false })).toBe(false);
    expect(shouldRedirectToWelcome({ isAuthenticated: false, location: "/feed", modeSelected: false })).toBe(false);
  });

  it("selects the matching mode statistics record", () => {
    const preferences = [{ mode: "social" as const, followers: 12 }, { mode: "creator" as const, subscribers: 34 }];
    expect(selectModeStatistics(preferences, "social")).toEqual(preferences[0]);
    expect(selectModeStatistics(preferences, "creator")).toEqual(preferences[1]);
    expect(selectModeStatistics(undefined, "social")).toBeNull();
  });
});
