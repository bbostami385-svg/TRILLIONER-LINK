export type VerificationTrendPoint = { day: string; approved: number; rejected: number };
export type VerificationMetricsReport = {
  liveness: { total: number; pending: number; approved: number; rejected: number };
  kyc: { total: number; pending: number; approved: number; rejected: number };
  trends: { liveness: VerificationTrendPoint[]; kyc: VerificationTrendPoint[] };
  range: { from: string; to: string };
};

function escapeCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function verificationTrendCsv(metrics: VerificationMetricsReport) {
  const rows = [
    ["category", "day", "approved", "rejected"],
    ...metrics.trends.liveness.map((point) => ["Human liveness", point.day, point.approved, point.rejected]),
    ...metrics.trends.kyc.map((point) => ["Identity / KYC", point.day, point.approved, point.rejected]),
  ];
  return [`range_from,${escapeCell(metrics.range.from)}`, `range_to,${escapeCell(metrics.range.to)}`, ...rows.map((row) => row.map((cell) => escapeCell(cell)).join(","))].join("\n");
}

export function downloadVerificationTrendCsv(metrics: VerificationMetricsReport) {
  const blob = new Blob([`\uFEFF${verificationTrendCsv(metrics)}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `trillioner-link-verification-trends-${metrics.range.from}-to-${metrics.range.to}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
