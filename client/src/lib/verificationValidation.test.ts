import { describe, expect, it } from "vitest";
import { MAX_VERIFICATION_IMAGE_BYTES, validateVerificationImage } from "./verificationValidation";

describe("KYC verification image validation", () => {
  it("accepts the supported image types within the size limit", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(validateVerificationImage({ type, size: MAX_VERIFICATION_IMAGE_BYTES })).toBeNull();
    }
  });

  it("rejects unsupported image formats", () => {
    expect(validateVerificationImage({ type: "image/gif", size: 1024 })).toContain("JPG");
    expect(validateVerificationImage({ type: "application/pdf", size: 1024 })).toContain("JPG");
  });

  it("rejects images larger than 8 MB", () => {
    expect(validateVerificationImage({ type: "image/jpeg", size: MAX_VERIFICATION_IMAGE_BYTES + 1 })).toContain("8 MB");
  });
});
