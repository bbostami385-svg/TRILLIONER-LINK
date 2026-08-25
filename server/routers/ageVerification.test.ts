import { describe, expect, it } from "vitest";
import { ageVerificationRouter, calculateAge, validateDateOfBirth } from "./ageVerification";

const caller = () => ageVerificationRouter.createCaller({} as any);

describe("age verification rules", () => {
  it("calculates the exact birthday boundary correctly", () => {
    const now = new Date();
    const birthday = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());
    expect(calculateAge(birthday)).toBe(13);
    expect(calculateAge(new Date(now.getFullYear() - 12, now.getMonth(), now.getDate() + 1))).toBe(11);
  });

  it("rejects a date of birth in the future", () => {
    expect(() => validateDateOfBirth(new Date(Date.now() + 86_400_000).toISOString())).toThrow("valid date of birth");
  });

  it("rejects accounts younger than thirteen", async () => {
    const youngDob = new Date();
    youngDob.setFullYear(youngDob.getFullYear() - 12);
    await expect(caller().verifyAge({ dateOfBirth: youngDob.toISOString(), verificationMethod: "manual_dob" })).rejects.toThrow("at least 13");
  });

  it("keeps adult age approval separate from universal human-liveness verification", async () => {
    const adultDob = new Date();
    adultDob.setFullYear(adultDob.getFullYear() - 18);
    await expect(caller().verifyAge({ dateOfBirth: adultDob.toISOString(), verificationMethod: "manual_dob" })).resolves.toMatchObject({ ageVerified: true, faceVerificationRequired: false });
  });
});
