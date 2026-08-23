export function getModerationToastMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : typeof error === "object" && error !== null && "message" in error ? String((error as { message?: unknown }).message ?? "") : String(error ?? "");
  if (message.includes("cannot be published") || message.includes("violates the platform safety policy")) return "This content was blocked because it violates the platform safety policy.";
  if (message.includes("pending safety review") || message.includes("Automated review is temporarily unavailable")) return "This content is pending safety review and is not public yet.";
  return null;
}
