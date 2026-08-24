import { z } from "zod";

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;
const handlePattern = /^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$/;
const reservedHandles = new Set(["admin", "administrator", "api", "help", "login", "logout", "support", "trillioner", "trillionerlink", "official", "null", "undefined", "settings", "notifications", "creator", "videos"]);

export function normalizeHandle(value: string) { return value.trim().replace(/^@+/, "").toLocaleLowerCase("en-US"); }
export function isReservedHandle(value: string) { return reservedHandles.has(normalizeHandle(value)); }
export function validateHandle(value: string) {
  const normalized = normalizeHandle(value);
  if (normalized.length < HANDLE_MIN_LENGTH || normalized.length > HANDLE_MAX_LENGTH) return { valid: false as const, normalized, message: `Handle must be ${HANDLE_MIN_LENGTH}-${HANDLE_MAX_LENGTH} characters.` };
  if (!handlePattern.test(normalized)) return { valid: false as const, normalized, message: "Use lowercase letters, numbers, dots, underscores, or hyphens; start and end with a letter or number." };
  if (isReservedHandle(normalized)) return { valid: false as const, normalized, message: "This handle is reserved. Choose another one." };
  return { valid: true as const, normalized, message: "Handle format is valid." };
}
export const handleSchema = z.string().trim().min(HANDLE_MIN_LENGTH).max(HANDLE_MAX_LENGTH).transform(normalizeHandle).superRefine((value, ctx) => { const result = validateHandle(value); if (!result.valid) ctx.addIssue({ code: "custom", message: result.message }); });
