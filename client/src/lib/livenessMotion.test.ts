import { describe, expect, it } from "vitest";
import { getMotionFeedback, movementDelta, type FaceBounds } from "./livenessMotion";

const face = (x: number, y: number): FaceBounds => ({ x, y, width: 100, height: 100 });

describe("liveness motion feedback", () => {
  it("calculates face-center movement deltas", () => {
    expect(movementDelta(face(10, 10), face(30, 50))).toEqual({ x: 20, y: 40 });
  });

  it("guides the user when the face is not visible", () => {
    expect(getMotionFeedback("nod", null, null)).toContain("center your face");
  });

  it("recognizes challenge-specific movement without making an approval decision", () => {
    expect(getMotionFeedback("nod", face(10, 10), face(10, 30))).toContain("movement detected");
    expect(getMotionFeedback("turn_left", face(50, 10), face(30, 10))).toContain("Left movement detected");
    expect(getMotionFeedback("turn_right", face(10, 10), face(30, 10))).toContain("Right movement detected");
    expect(getMotionFeedback("blink", face(10, 10), face(10, 10))).toContain("blink naturally");
  });
});
