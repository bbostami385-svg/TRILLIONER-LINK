// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignUp from "./SignUp";

const { signInWithGoogle, mutateAsync, setLocation } = vi.hoisted(() => ({
  signInWithGoogle: vi.fn(),
  mutateAsync: vi.fn(),
  setLocation: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({ firebaseConfigured: true, signInWithGoogle }));
vi.mock("@/lib/trpc", () => ({ trpc: { auth: { exchangeFirebaseToken: { useMutation: () => ({ mutateAsync, isPending: false }) } } } }));
vi.mock("wouter", () => ({ useLocation: () => ["/signup", setLocation] }));

describe("SignUp", () => {
  beforeEach(() => {
    signInWithGoogle.mockReset();
    mutateAsync.mockReset();
    setLocation.mockReset();
    signInWithGoogle.mockResolvedValue({ user: { getIdToken: vi.fn().mockResolvedValue("firebase-id-token") } });
    mutateAsync.mockResolvedValue({ success: true });
  });

  it("exchanges a Firebase Google token and routes new users to verification", async () => {
    render(<SignUp />);
    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ idToken: "firebase-id-token" }));
    expect(setLocation).toHaveBeenCalledWith("/verify");
  });
});
