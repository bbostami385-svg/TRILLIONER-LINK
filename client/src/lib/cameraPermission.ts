export function getCameraPermissionMessage(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access is blocked. Allow camera permission for TRILLIONER LINK, then try again.";
  }
  if (name === "NotFoundError") {
    return "No camera was found. Connect a camera and try again.";
  }
  if (name === "NotReadableError") {
    return "Your camera is busy in another app. Close it and try again.";
  }
  return "Camera access is needed for human verification. Check your camera settings, then try again.";
}
