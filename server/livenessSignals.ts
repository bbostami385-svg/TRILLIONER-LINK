export type LivenessRiskSignal =
  | "automation_flag"
  | "missing_capture_source"
  | "non_camera_capture"
  | "short_recording"
  | "missing_motion_evidence";

export function assessLivenessRisk(metadata: unknown): LivenessRiskSignal[] {
  if (!metadata || typeof metadata !== "object") {
    return ["missing_capture_source", "missing_motion_evidence"];
  }
  const value = metadata as Record<string, unknown>;
  const signals: LivenessRiskSignal[] = [];
  if (value.automationDetected === true || value.isAutomated === true) signals.push("automation_flag");
  if (typeof value.captureSource !== "string") signals.push("missing_capture_source");
  else if (value.captureSource !== "camera") signals.push("non_camera_capture");
  if (typeof value.durationMs === "number" && value.durationMs < 1_500) signals.push("short_recording");
  if (value.motionDetected !== true) signals.push("missing_motion_evidence");
  return signals;
}
