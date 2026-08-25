// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FaceVerificationForm } from "./FaceVerificationForm";

const mutateAsync = vi.fn();
vi.mock("@/lib/trpc", () => ({
  trpc: { ageVerification: { submitFaceVerification: { useMutation: () => ({ mutateAsync }) } } },
}));

class MockFileReader {
  result = "data:image/jpeg;base64,uploaded";
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
  readAsDataURL() { queueMicrotask(() => this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>)); }
}

describe("FaceVerificationForm", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    mutateAsync.mockReset();
    Object.defineProperty(window, "FileReader", { configurable: true, writable: true, value: MockFileReader });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")) } });
  });

  it("shows a permission-specific error when camera access is denied", async () => {
    const { getByRole, findByText } = render(<FaceVerificationForm />);
    fireEvent.click(getByRole("button", { name: /start camera/i }));
    expect(await findByText(/camera permission was denied/i)).toBeTruthy();
  });

  it("accepts an uploaded image and exposes submit and retake actions", async () => {
    const { container, findByRole, getByRole } = render(<FaceVerificationForm />);
    const file = new File(["face"], "face.jpg", { type: "image/jpeg" });
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    expect(await findByRole("img", { name: /captured face/i })).toBeTruthy();
    expect(getByRole("button", { name: /^submit$/i })).toBeTruthy();
    fireEvent.click(getByRole("button", { name: /retake/i }));
    expect(container.querySelector('input[type="file"]')).toBeTruthy();
    expect(() => getByRole("button", { name: /^submit$/i })).toThrow();
  });

  it("captures a camera frame and stops the camera stream", async () => {
    const stop = vi.fn();
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) } });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,captured");
    const { container, getByRole } = render(<FaceVerificationForm />);
    fireEvent.click(getByRole("button", { name: /start camera/i }));
    const video = await waitFor(() => {
      const element = container.querySelector("video");
      if (!element) throw new Error("camera video has not mounted");
      return element;
    });
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 640 });
    Object.defineProperty(video, "videoHeight", { configurable: true, value: 480 });
    fireEvent.click(getByRole("button", { name: /capture photo/i }));
    await waitFor(() => expect(container.querySelector('img[alt="Captured face"]')).toBeTruthy());
    expect(stop).toHaveBeenCalled();
  });

  it("submits the captured image, exposes loading state, and calls onSuccess", async () => {
    let resolveMutation!: (value: unknown) => void;
    mutateAsync.mockImplementation(() => new Promise((resolve) => { resolveMutation = resolve; }));
    const onSuccess = vi.fn();
    const { container, findByRole, getByRole } = render(<FaceVerificationForm onSuccess={onSuccess} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["face"], "face.jpg", { type: "image/jpeg" })] } });
    await findByRole("button", { name: /^submit$/i });
    fireEvent.click(getByRole("button", { name: /^submit$/i }));
    expect(getByRole("button", { name: /submitting/i })).toHaveProperty("disabled", true);
    expect(mutateAsync).toHaveBeenCalledWith({ imageUrl: "data:image/jpeg;base64,uploaded", verificationProvider: "aws_rekognition" });
    resolveMutation({ success: false, status: "pending" });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it("shows a submission error and calls onError when the mutation fails", async () => {
    mutateAsync.mockRejectedValue(new Error("Review service unavailable"));
    const onError = vi.fn();
    const { container, findByRole, getByRole, findByText } = render(<FaceVerificationForm onError={onError} />);
    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [new File(["face"], "face.jpg", { type: "image/jpeg" })] } });
    await findByRole("button", { name: /^submit$/i });
    fireEvent.click(getByRole("button", { name: /^submit$/i }));
    expect(await findByText(/review service unavailable/i)).toBeTruthy();
    expect(onError).toHaveBeenCalledWith("Review service unavailable");
  });

  it("does not expose submission until a photo is available", () => {
    const { queryByRole } = render(<FaceVerificationForm />);
    expect(queryByRole("button", { name: /^submit$/i })).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
