// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  signInWithGoogle: vi.fn(),
  mutateAsync: vi.fn(),
}));

vi.mock("wouter", () => ({ useLocation: () => ["/login", mocks.navigate] }));
vi.mock("@/lib/firebase", () => ({
  firebaseConfigured: true,
  signInWithGoogle: mocks.signInWithGoogle,
  signInWithFirebaseEmail: vi.fn(),
  createFirebaseAccount: vi.fn(),
  requestFirebasePasswordReset: vi.fn(),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: { auth: { exchangeFirebaseToken: { useMutation: () => ({ mutateAsync: mocks.mutateAsync }) } } },
}));

import Login from "./Login";

describe("Login Google flow", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.signInWithGoogle.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue("firebase-id-token") } });
    mocks.mutateAsync.mockResolvedValue({ success: true });
  });

  it("shows an accessible loading state while Google authentication is pending", async () => {
    let resolveLogin!: (value: unknown) => void;
    mocks.signInWithGoogle.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
    render(<Login />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Google$/ })[0]);
    const loadingButton = screen.getByRole("button", { name: /signing in with google/i });
    expect(loadingButton.getAttribute("aria-busy")).toBe("true");
    expect((loadingButton as HTMLButtonElement).disabled).toBe(true);

    await act(async () => resolveLogin({ user: { getIdToken: vi.fn().mockResolvedValue("token") } }));
  });

  it("renders the Firebase error message when Google authentication fails", async () => {
    mocks.signInWithGoogle.mockRejectedValue(new Error("Google sign-in was cancelled."));
    render(<Login />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Google$/ })[0]);
    await waitFor(() => expect(screen.getAllByText("Google sign-in was cancelled.").length).toBeGreaterThan(0));
  });

  it("redirects to the profile dashboard after a successful Google session exchange", async () => {
    render(<Login />);

    fireEvent.click(screen.getAllByRole("button", { name: /^Google$/ })[0]);
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({ idToken: "firebase-id-token" }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith("/profile"), { timeout: 1500 });
  });
});
