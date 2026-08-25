// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaceVerificationForm } from "./FaceVerificationForm";

const mutateAsync = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: { ageVerification: { submitFaceVerification: { useMutation: () => ({ mutateAsync }) } } },
}));

describe("FaceVerificationForm", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mutateAsync.mockReset();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")) } });
  });

  it("shows a permission-specific error when camera access is denied", async () => {
    const { getByRole, findByText } = render(<FaceVerificationForm />);
    fireEvent.click(getByRole("button", { name: /start camera/i }));
    expect(await findByText(/unable to access camera/i)).toBeTruthy();
  });

  it("does not expose submission until a photo is available", () => {
    const { queryByRole } = render(<FaceVerificationForm />);
    expect(queryByRole("button", { name: /^submit$/i })).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
