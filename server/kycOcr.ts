import { invokeLLM, type MessageContent } from "./_core/llm";

export type KycExtractedFields = {
  fullName: string | null;
  dateOfBirth: string | null;
  documentNumber: string | null;
  expiryDate: string | null;
};

export type KycOcrSignals = {
  status: "completed" | "unavailable";
  documentTypeMatch: boolean | null;
  hasReadableDocument: boolean | null;
  expiryDate: string | null;
  documentNumberLast4: string | null;
  extractedFields: KycExtractedFields;
  note: string;
};

const documentTypes = ["passport", "driver_license", "national_id", "other"] as const;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim().slice(0, maxLength) : null;
}

function normalizeSignals(value: unknown, expectedDocumentType: string): KycOcrSignals {
  const result = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const detectedType = typeof result.documentType === "string" ? result.documentType : "other";
  const documentTypeMatch = expectedDocumentType === "other" || detectedType === "other" ? null : detectedType === expectedDocumentType;
  const expiryDate = typeof result.expiryDate === "string" && datePattern.test(result.expiryDate) ? result.expiryDate : null;
  const dateOfBirth = typeof result.dateOfBirth === "string" && datePattern.test(result.dateOfBirth) ? result.dateOfBirth : null;
  const documentNumber = cleanText(result.documentNumber, 64);
  return {
    status: "completed",
    documentTypeMatch,
    hasReadableDocument: typeof result.hasReadableDocument === "boolean" ? result.hasReadableDocument : null,
    expiryDate,
    documentNumberLast4: documentNumber?.slice(-4).match(/^\d{4}$/)?.[0] ?? null,
    extractedFields: {
      fullName: cleanText(result.fullName, 120),
      dateOfBirth,
      documentNumber,
      expiryDate,
    },
    note: "AI extraction is advisory only. Review and correct every field before submission; a trained reviewer must make the final identity decision.",
  };
}

export function sanitizeKycOcrForStorage(ocr: KycOcrSignals) {
  return {
    status: ocr.status,
    documentTypeMatch: ocr.documentTypeMatch,
    hasReadableDocument: ocr.hasReadableDocument,
    expiryDate: ocr.expiryDate,
    documentNumberLast4: ocr.documentNumberLast4,
    note: ocr.note,
  };
}

export async function extractKycOcrSignals(imageUrl: string, expectedDocumentType: string): Promise<KycOcrSignals> {
  const content: MessageContent[] = [
    { type: "text", text: `Read this identity document conservatively. Expected document type: ${expectedDocumentType}. Return only the requested structured fields. Do not infer missing values. The result is advisory and must never approve or reject the applicant.` },
    { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
  ];
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a privacy-conscious KYC OCR assistant. Extract only full name, date of birth, document number, expiry date, document readability, and broad document type. Never infer missing values. Do not extract address, nationality, gender, or unrelated personal data. Never approve or reject the applicant." },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kyc_ocr_prefill",
          strict: true,
          schema: {
            type: "object",
            properties: {
              documentType: { type: "string", enum: [...documentTypes] },
              hasReadableDocument: { type: ["boolean", "null"] },
              fullName: { type: ["string", "null"] },
              dateOfBirth: { type: ["string", "null"] },
              documentNumber: { type: ["string", "null"] },
              expiryDate: { type: ["string", "null"] },
            },
            required: ["documentType", "hasReadableDocument", "fullName", "dateOfBirth", "documentNumber", "expiryDate"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices[0]?.message?.content;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeSignals(parsed, expectedDocumentType);
  } catch (error) {
    console.warn("[KYC OCR] Advisory extraction unavailable; manual review remains required:", String(error));
    return {
      status: "unavailable",
      documentTypeMatch: null,
      hasReadableDocument: null,
      expiryDate: null,
      documentNumberLast4: null,
      extractedFields: { fullName: null, dateOfBirth: null, documentNumber: null, expiryDate: null },
      note: "AI extraction was unavailable. Manual review is required and no automated decision was made.",
    };
  }
}
