// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  setLocation: vi.fn(),
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { name: "Test User", email: "test@example.com" } }),
}));
vi.mock("wouter", () => ({ useLocation: () => ["/payment", mocks.setLocation] }));
vi.mock("@/lib/trpc", () => ({
  trpc: { payment: { initiatePayment: { useMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }) } } },
}));

import Payment from "./Payment";

describe("Payment SSLCommerz feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows an animated processing state while payment initiation is pending", async () => {
    let resolvePayment!: (value: unknown) => void;
    mocks.mutateAsync.mockReturnValue(new Promise((resolve) => { resolvePayment = resolve; }));
    render(<Payment />);

    fireEvent.click(screen.getAllByRole("button", { name: /subscribe now/i })[0]);
    expect(screen.getByText("Processing payment...")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /processing payment/i })[0]).toHaveProperty("disabled", true);

    resolvePayment({ redirectGatewayURL: "https://gateway.example/checkout" });
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalled());
  });

  it("shows an inline retryable error instead of using a browser alert", async () => {
    mocks.mutateAsync.mockRejectedValue(new Error("SSLCommerz is temporarily unavailable."));
    render(<Payment />);

    fireEvent.click(screen.getAllByRole("button", { name: /subscribe now/i })[0]);
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("SSLCommerz is temporarily unavailable.");
    expect(screen.getByRole("button", { name: /close/i })).toBeTruthy();
  });
});
