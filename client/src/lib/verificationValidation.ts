export const MAX_VERIFICATION_IMAGE_BYTES = 8 * 1024 * 1024;

const SUPPORTED_VERIFICATION_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateVerificationImage(file: Pick<File, "type" | "size">): string | null {
  if (!SUPPORTED_VERIFICATION_IMAGE_TYPES.has(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }
  if (file.size > MAX_VERIFICATION_IMAGE_BYTES) {
    return "Image must be 8 MB or smaller.";
  }
  return null;
}
