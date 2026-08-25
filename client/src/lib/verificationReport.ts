import { jsPDF } from "jspdf";

export interface VerificationMetricCounts {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface VerificationMetricsReport {
  liveness: VerificationMetricCounts;
  kyc: VerificationMetricCounts;
  range?: { from: string | null; to: string | null };
}

export interface VerificationReportRow {
  category: "Human liveness" | "Identity / KYC";
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export function toVerificationReportRows(metrics: VerificationMetricsReport): VerificationReportRow[] {
  return [
    { category: "Human liveness", ...metrics.liveness },
    { category: "Identity / KYC", ...metrics.kyc },
  ];
}

function escapeCsvCell(value: string | number): string {
  const stringValue = String(value);
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

export function verificationMetricsCsv(metrics: VerificationMetricsReport): string {
  const headers = ["category", "total", "pending", "approved", "rejected"];
  const range = metrics.range ? `range_from,${metrics.range.from ?? ""}\nrange_to,${metrics.range.to ?? ""}\n` : "";
  const rows = toVerificationReportRows(metrics).map((row) => headers.map((header) => escapeCsvCell(row[header as keyof VerificationReportRow] as string | number)).join(","));
  return `${range}${[headers.join(","), ...rows].join("\n")}`;
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadVerificationMetricsCsv(metrics: VerificationMetricsReport, filename = "trillioner-link-verification-metrics.csv") {
  downloadBlob(`\uFEFF${verificationMetricsCsv(metrics)}`, filename, "text/csv;charset=utf-8");
}

export function downloadVerificationMetricsPdf(metrics: VerificationMetricsReport, filename = "trillioner-link-verification-metrics.pdf") {
  const document = new jsPDF();
  document.setFontSize(18);
  document.text("TRILLIONER LINK", 20, 22);
  document.setFontSize(13);
  document.text("Verification metrics report", 20, 32);
  document.setFontSize(10);
  document.text(`Generated ${new Date().toLocaleString()}`, 20, 40);
  if (metrics.range?.from || metrics.range?.to) document.text(`Range: ${metrics.range.from ?? "start"} to ${metrics.range.to ?? "now"}`, 20, 47);
  const columns = ["Category", "Total", "Pending", "Approved", "Rejected"];
  const x = [20, 95, 120, 148, 178];
  columns.forEach((column, index) => document.text(column, x[index], 56));
  toVerificationReportRows(metrics).forEach((row, rowIndex) => {
    const y = 68 + rowIndex * 12;
    [row.category, row.total, row.pending, row.approved, row.rejected].forEach((value, index) => document.text(String(value), x[index], y));
  });
  document.save(filename);
}
