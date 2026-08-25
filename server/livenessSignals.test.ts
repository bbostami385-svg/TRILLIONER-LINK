import { describe, expect, it } from "vitest";
import { assessLivenessRisk } from "./livenessSignals";

describe("assessLivenessRisk", () => {
  it("flags missing metadata as review signals", () => {
    expect(assessLivenessRisk(undefined)).toEqual(["missing_capture_source", "missing_motion_evidence"]);
  });

  it("flags automation and non-camera capture claims", () => {
    expect(assessLivenessRisk({ automationDetected: true, captureSource: "screen", durationMs: 800, motionDetected: false })).toEqual([
      "automation_flag",
      "non_camera_capture",
      "short_recording",
      "missing_motion_evidence",
    ]);
  });

  it("returns no risk signals for complete camera evidence", () => {
    expect(assessLivenessRisk({ captureSource: "camera", durationMs: 4_000, motionDetected: true })).toEqual([]);
  });
});
