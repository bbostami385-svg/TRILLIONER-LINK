import { describe, expect, it } from "vitest";
import { toVerificationReportRows, verificationMetricsCsv, type VerificationMetricsReport } from "./verificationReport";

const metrics: VerificationMetricsReport = {
  liveness: { total: 10, pending: 2, approved: 6, rejected: 2 },
  kyc: { total: 5, pending: 1, approved: 3, rejected: 1 },
};

describe("verification metrics reports", () => {
  it("maps persisted counts into stable report rows", () => {
    expect(toVerificationReportRows(metrics)).toEqual([
      { category: "Human liveness", total: 10, pending: 2, approved: 6, rejected: 2 },
      { category: "Identity / KYC", total: 5, pending: 1, approved: 3, rejected: 1 },
    ]);
  });

  it("generates a spreadsheet-safe CSV with headers and both verification categories", () => {
    expect(verificationMetricsCsv(metrics)).toBe([
      "category,total,pending,approved,rejected",
      "Human liveness,10,2,6,2",
      "Identity / KYC,5,1,3,1",
    ].join("\n"));
  });
});
