import { describe, expect, it } from "vitest";
import { verificationTrendCsv, type VerificationMetricsReport } from "./verificationTrendReport";

describe("verification trend CSV", () => {
  it("includes the selected range and both daily categories", () => {
    const metrics: VerificationMetricsReport = {
      range: { from: "2026-09-01", to: "2026-09-03" },
      liveness: { total: 2, pending: 0, approved: 1, rejected: 1 },
      kyc: { total: 3, pending: 1, approved: 1, rejected: 1 },
      trends: {
        liveness: [{ day: "2026-09-01", approved: 1, rejected: 0 }],
        kyc: [{ day: "2026-09-02", approved: 0, rejected: 1 }],
      },
    };
    const csv = verificationTrendCsv(metrics);
    expect(csv).toContain("range_from,2026-09-01");
    expect(csv).toContain("Human liveness,2026-09-01,1,0");
    expect(csv).toContain("Identity / KYC,2026-09-02,0,1");
  });
});
