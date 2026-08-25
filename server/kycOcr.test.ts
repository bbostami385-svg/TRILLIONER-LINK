import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractKycOcrSignals } from "./kycOcr";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

const llm = vi.mocked(invokeLLM);

describe("KYC OCR signals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes structured OCR fields and never returns a full document number", async () => {
    llm.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ documentType: "passport", hasReadableDocument: true, expiryDate: "2030-01-02", documentNumberLast4: "1234" }) } }] } as never);
    const result = await extractKycOcrSignals("https://cdn.example/id.jpg", "passport");
    expect(result).toMatchObject({ status: "completed", documentTypeMatch: true, hasReadableDocument: true, expiryDate: "2030-01-02", documentNumberLast4: "1234" });
    expect(JSON.stringify(result)).not.toContain("full");
  });

  it("returns a non-blocking manual-review fallback when OCR is unavailable", async () => {
    llm.mockRejectedValue(new Error("OCR unavailable"));
    const result = await extractKycOcrSignals("https://cdn.example/id.jpg", "national_id");
    expect(result).toMatchObject({ status: "unavailable", documentTypeMatch: null, hasReadableDocument: null, expiryDate: null, documentNumberLast4: null });
    expect(result.note).toContain("Manual review");
  });
});
