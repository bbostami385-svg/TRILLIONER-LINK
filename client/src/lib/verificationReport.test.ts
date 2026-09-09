import { describe, expect, it } from "vitest";
import { toVerificationReportRows, verificationMetricsCsv, verificationTrendCsv, type VerificationMetricsReport } from "./verificationReport";

const metrics: VerificationMetricsReport = {
  liveness: { total: 10, pending: 2, approved: 6, rejected: 2 },
  kyc: { total: 5, pending: 1, approved: 3, rejected: 1 },
  trends: {
    liveness: [{ day: "2026-08-02", approved: 2, rejected: 1 }],
    kyc: [{ day: "2026-08-01", approved: 1, rejected: 0 }],
  },
  range: { from: "2026-08-01", to: "2026-08-03" },
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
      "range_from,2026-08-01",
      "range_to,2026-08-03",
      "category,total,pending,approved,rejected",
      "Human liveness,10,2,6,2",
      "Identity / KYC,5,1,3,1",
    ].join("\n"));
  });

  it("exports daily approval and rejection trend rows in stable date order", () => {
    expect(verificationTrendCsv(metrics)).toBe([
      "range_from,2026-08-01",
      "range_to,2026-08-03",
      "category,day,approved,rejected",
      "Identity / KYC,2026-08-01,1,0",
      "Human liveness,2026-08-02,2,1",
    ].join("\n"));
  });
});
