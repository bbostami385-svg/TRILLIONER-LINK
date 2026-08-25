// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const statusQuery = { isLoading: false, error: null, data: { status: "rejected", isVerified: false, documentType: "national_id", verifiedAt: null, lastDocument: { rejectionReason: "The document image is blurry." } } };
const historyQuery = { isLoading: false, error: null, data: [{ id: 1, documentType: "national_id", status: "rejected", createdAt: new Date("2026-08-01T12:00:00Z"), rejectionReason: "The document image is blurry." }] };
vi.mock("@/lib/trpc", () => ({ trpc: { kyc: { getKYCStatus: { useQuery: () => statusQuery }, getKYCHistory: { useQuery: () => historyQuery } } } }));

import { KycStatusHistory } from "./KycStatusHistory";

describe("KycStatusHistory", () => {
  it("shows the current status, rejection reason, and submission history", () => {
    render(<KycStatusHistory />);
    expect(screen.getAllByText("Needs resubmission").length).toBeGreaterThan(0);
    expect(screen.getAllByText("The document image is blurry.").length).toBeGreaterThan(0);
    expect(screen.getByText(/1 submission/)).toBeTruthy();
    expect(screen.getAllByText(/national id/i).length).toBeGreaterThan(0);
  });
});
