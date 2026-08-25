import { describe, expect, it } from "vitest";
import { adsListState, shouldRefreshAdsAfterMutation } from "./adsDashboard";

describe("AdsDashboard state policy", () => {
  it("distinguishes loading, error, empty, and ready states", () => {
    expect(adsListState({ isLoading: true, hasError: false })).toBe("loading");
    expect(adsListState({ isLoading: false, hasError: true })).toBe("error");
    expect(adsListState({ isLoading: false, hasError: false, count: 0 })).toBe("empty");
    expect(adsListState({ isLoading: false, hasError: false, count: 2 })).toBe("ready");
  });

  it("requires an ads query refresh after every catalog mutation", () => {
    expect(shouldRefreshAdsAfterMutation("create")).toBe(true);
    expect(shouldRefreshAdsAfterMutation("update")).toBe(true);
    expect(shouldRefreshAdsAfterMutation("delete")).toBe(true);
  });
});
