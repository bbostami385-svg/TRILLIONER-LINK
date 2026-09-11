import { describe, expect, it } from "vitest";
import { sanitizeKycOcrForStorage, type KycOcrSignals } from "./kycOcr";

describe("KYC OCR privacy contract", () => {
  it("stores minimized signals and never stores full extracted identity fields", () => {
    const signals: KycOcrSignals = {
      status: "completed",
      documentTypeMatch: true,
      hasReadableDocument: true,
      expiryDate: "2030-01-02",
      documentNumberLast4: "1234",
      extractedFields: { fullName: "Test Applicant", dateOfBirth: "1990-01-02", documentNumber: "ABC1234", expiryDate: "2030-01-02" },
      note: "advisory",
    };
    const stored = sanitizeKycOcrForStorage(signals);
    expect(stored).toEqual({ status: "completed", documentTypeMatch: true, hasReadableDocument: true, expiryDate: "2030-01-02", documentNumberLast4: "1234", note: "advisory" });
    expect(stored).not.toHaveProperty("extractedFields");
  });
});
