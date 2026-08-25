export type FaceBounds = { x: number; y: number; width: number; height: number };
export type LivenessChallenge = "nod" | "turn_left" | "turn_right" | "blink";

export function movementDelta(previous: FaceBounds, current: FaceBounds) {
  return {
    x: current.x + current.width / 2 - (previous.x + previous.width / 2),
    y: current.y + current.height / 2 - (previous.y + previous.height / 2),
  };
}

export function getMotionFeedback(challenge: LivenessChallenge, previous: FaceBounds | null, current: FaceBounds | null) {
  if (!current) return "Move closer and center your face in the guide.";
  if (!previous) return "Face detected — follow the movement prompt.";
  const delta = movementDelta(previous, current);
  const threshold = Math.max(current.width, current.height) * 0.08;
  if (challenge === "nod" && Math.abs(delta.y) >= threshold) return "Head movement detected — continue the nod slowly.";
  if (challenge === "turn_left" && delta.x <= -threshold) return "Left movement detected — return to center when ready.";
  if (challenge === "turn_right" && delta.x >= threshold) return "Right movement detected — return to center when ready.";
  if (challenge === "blink") return "Face detected — blink naturally while looking at the camera.";
  return "Face detected — follow the movement prompt slowly.";
}
