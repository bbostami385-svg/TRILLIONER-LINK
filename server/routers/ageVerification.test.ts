import { describe, expect, it } from "vitest";
import { ageVerificationRouter } from "./ageVerification";

describe("age verification enforcement", () => {
  it("rejects account creation for users under 13", async () => {
    const caller = ageVerificationRouter.createCaller({} as any);
    await expect(caller.verifyAge({ dateOfBirth: "2018-01-01T00:00:00.000Z", verificationMethod: "manual_dob" })).rejects.toThrow("at least 13");
  });

  it("accepts an adult while leaving legacy adult-only face enforcement disabled", async () => {
    const caller = ageVerificationRouter.createCaller({} as any);
    const result = await caller.verifyAge({ dateOfBirth: "1990-01-01T00:00:00.000Z", verificationMethod: "id_document" });
    expect(result.ageVerified).toBe(true);
    expect(result.faceVerificationRequired).toBe(false);
    expect(result.message).toContain("successfully");
  });
});
