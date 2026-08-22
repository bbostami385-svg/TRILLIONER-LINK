import { describe, expect, it } from "vitest";
import {
  challengeSchema,
  reviewSortSchema as livenessSortSchema,
  reviewStatusSchema as livenessStatusSchema,
} from "./routers/humanVerification";
import {
  documentTypeSchema,
  reviewSortSchema as kycSortSchema,
  reviewStatusSchema as kycStatusSchema,
} from "./routers/kyc";

describe("admin verification review filters", () => {
  it("accepts every supported review status", () => {
    for (const status of ["all", "pending", "approved", "rejected"] as const) {
      expect(livenessStatusSchema.parse(status)).toBe(status);
      expect(kycStatusSchema.parse(status)).toBe(status);
    }
  });

  it("accepts both chronological sort directions", () => {
    expect(livenessSortSchema.parse("newest")).toBe("newest");
    expect(livenessSortSchema.parse("oldest")).toBe("oldest");
    expect(kycSortSchema.parse("newest")).toBe("newest");
    expect(kycSortSchema.parse("oldest")).toBe("oldest");
  });

  it("restricts liveness filters to known challenge types", () => {
    expect(challengeSchema.parse("nod")).toBe("nod");
    expect(challengeSchema.parse("turn_left")).toBe("turn_left");
    expect(() => challengeSchema.parse("smile")).toThrow();
  });

  it("restricts KYC filters to supported document types", () => {
    expect(documentTypeSchema.parse("passport")).toBe("passport");
    expect(documentTypeSchema.parse("national_id")).toBe("national_id");
    expect(() => documentTypeSchema.parse("utility_bill")).toThrow();
  });
});
