import { describe, expect, it } from "vitest";
import { getCameraPermissionMessage } from "./cameraPermission";

describe("camera permission messaging", () => {
  it("explains how to recover from a blocked camera", () => {
    expect(getCameraPermissionMessage(new DOMException("blocked", "NotAllowedError"))).toContain("Allow camera permission");
  });

  it("distinguishes missing and busy cameras", () => {
    expect(getCameraPermissionMessage(new DOMException("missing", "NotFoundError"))).toContain("No camera was found");
    expect(getCameraPermissionMessage(new DOMException("busy", "NotReadableError"))).toContain("camera is busy");
  });

  it("provides a safe fallback for unknown errors", () => {
    expect(getCameraPermissionMessage(new Error("unknown"))).toContain("Camera access is needed");
  });
});
