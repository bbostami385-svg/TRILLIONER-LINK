import { invokeLLM, type MessageContent } from "./_core/llm";

export type KycOcrSignals = {
  status: "completed" | "unavailable";
  documentTypeMatch: boolean | null;
  hasReadableDocument: boolean | null;
  expiryDate: string | null;
  documentNumberLast4: string | null;
  note: string;
};

const documentTypes = ["passport", "driver_license", "national_id", "other"] as const;

function normalizeSignals(value: unknown, expectedDocumentType: string): KycOcrSignals {
  const result = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const detectedType = typeof result.documentType === "string" ? result.documentType : "other";
  const documentTypeMatch = expectedDocumentType === "other" || detectedType === "other" ? null : detectedType === expectedDocumentType;
  const expiryDate = typeof result.expiryDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result.expiryDate) ? result.expiryDate : null;
  const last4 = typeof result.documentNumberLast4 === "string" && /^\d{4}$/.test(result.documentNumberLast4) ? result.documentNumberLast4 : null;
  return {
    status: "completed",
    documentTypeMatch,
    hasReadableDocument: typeof result.hasReadableDocument === "boolean" ? result.hasReadableDocument : null,
    expiryDate,
    documentNumberLast4: last4,
    note: "OCR is advisory only. A trained reviewer must make the final identity decision.",
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
        { role: "system", content: "You are a privacy-conscious KYC OCR assistant. Extract only document readability, broad document type, expiry date, and the last four digits of the document number. Never return a full document number, address, or other unnecessary personal data." },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "kyc_ocr_signals",
          strict: true,
          schema: {
            type: "object",
            properties: {
              documentType: { type: "string", enum: [...documentTypes] },
              hasReadableDocument: { type: ["boolean", "null"] },
              expiryDate: { type: ["string", "null"] },
              documentNumberLast4: { type: ["string", "null"] },
            },
            required: ["documentType", "hasReadableDocument", "expiryDate", "documentNumberLast4"],
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
      note: "OCR was unavailable. Manual review is required and no automated decision was made.",
    };
  }
}
