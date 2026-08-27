import { TRPCError } from "@trpc/server";
import { invokeLLM, type MessageContent } from "./_core/llm";

const DISALLOWED_TERMS = [
  "child sexual abuse",
  "sexual exploitation of a minor",
  "terrorist recruitment",
  "how to build a bomb",
  "graphic gore",
];

const CHILD_SAFETY_TERMS: Array<{ pattern: RegExp; category: ModerationResult["category"] }> = [
  { pattern: /(?:(?:minor|underage|child|kid).{0,40}(?:sexual|nude|explicit|exploit)|(?:sexual|nude|explicit|exploit).{0,40}(?:minor|underage|child|kid))/i, category: "sexual_exploitation" },
  { pattern: /(?:secret|don't tell|meet me alone|send a photo).{0,40}(?:minor|underage|child|kid)/i, category: "grooming" },
  { pattern: /(?:recruit|join|build|make).{0,40}(?:bomb|weapon|explosive|terror)/i, category: "dangerous_content" },
];

function normalizeModerationText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .toLocaleLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[$5]/g, "s")
    .replace(/[^a-z0-9_\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ModerationResult = {
  decision: "allow" | "block" | "review";
  category: "clean" | "hate" | "harassment" | "sexual" | "sexual_exploitation" | "grooming" | "violence" | "dangerous_content" | "self_harm" | "illegal" | "spam" | "unknown";
  reason: string;
  confidence: number;
};

function deterministicTextCheck(text: string): ModerationResult | null {
  const normalized = normalizeModerationText(text);
  const term = DISALLOWED_TERMS.find((candidate) => normalized.includes(candidate));
  if (term) {
    return { decision: "block", category: "illegal", reason: "The content contains a prohibited safety term.", confidence: 1 };
  }
  const childSafetyMatch = CHILD_SAFETY_TERMS.find(({ pattern }) => pattern.test(normalized));
  if (childSafetyMatch) {
    return { decision: "block", category: childSafetyMatch.category, reason: "The content matches a child-safety risk pattern and cannot be published.", confidence: 0.99 };
  }

  const urlCount = text.toLocaleLowerCase().split("://").length - 1;
  const repeatedCharacters = /(.)\1{7,}/.test(text);
  if (urlCount >= 4 || repeatedCharacters) {
    return { decision: "review", category: "spam", reason: "The comment resembles automated or repetitive spam and requires review.", confidence: 0.98 };
  }
  return null;
}

function normalizeResult(value: unknown): ModerationResult {
  const result = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const decision = result.decision === "block" || result.decision === "review" ? result.decision : "allow";
  const categories = ["clean", "hate", "harassment", "sexual", "sexual_exploitation", "grooming", "violence", "dangerous_content", "self_harm", "illegal", "spam", "unknown"] as const;
  const category = categories.includes(result.category as (typeof categories)[number]) ? result.category as ModerationResult["category"] : "unknown";
  const confidence = typeof result.confidence === "number" ? Math.max(0, Math.min(1, result.confidence)) : 0;
  return { decision, category, confidence, reason: typeof result.reason === "string" ? result.reason.slice(0, 240) : "Automated safety review completed." };
}

export async function moderateContent(options: { text?: string; mediaUrl?: string; mediaType?: "image" | "video"; subjectAgeCategory?: "teen" | "adult" }): Promise<ModerationResult> {
  const text = options.text?.trim() ?? "";
  const deterministic = deterministicTextCheck(text);
  if (deterministic) return deterministic;

  const content: MessageContent[] = [{ type: "text", text: `Review this user-generated content for platform safety. Text: ${text || "(none)"}` }];
  if (options.mediaUrl && options.mediaType === "image") content.push({ type: "image_url", image_url: { url: options.mediaUrl, detail: "auto" } });
  if (options.mediaUrl && options.mediaType === "video") content.push({ type: "file_url", file_url: { url: options.mediaUrl, mime_type: "video/mp4" } });

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: `You are a strict trust-and-safety classifier. Block grooming, sexual exploitation, child sexual abuse material, credible violent wrongdoing, dangerous instructions, graphic gore, hate, and illegal instruction. Allow ordinary disagreement, news, education, and non-graphic discussion. ${options.subjectAgeCategory === "teen" ? "This content involves a teen account: apply heightened protection against adult sexualization, coercion, grooming, and dangerous contact." : ""} Return JSON only.` },
        { role: "user", content },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "moderation_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              decision: { type: "string", enum: ["allow", "block", "review"] },
              category: { type: "string", enum: ["clean", "hate", "harassment", "sexual", "sexual_exploitation", "grooming", "violence", "dangerous_content", "self_harm", "illegal", "spam", "unknown"] },
              reason: { type: "string" },
              confidence: { type: "number" },
            },
            required: ["decision", "category", "reason", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = response.choices[0]?.message?.content;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return normalizeResult(parsed);
  } catch (error) {
    console.warn("[Moderation] AI review unavailable; sending content to review:", String(error));
    return { decision: "review", category: "unknown", reason: "Automated review is temporarily unavailable. Content requires review before publishing.", confidence: 0 };
  }
}

export async function assertPublishable(options: Parameters<typeof moderateContent>[0]) {
  const result = await moderateContent(options);
  if (result.decision === "block") throw new TRPCError({ code: "BAD_REQUEST", message: "This content cannot be published because it violates the platform safety policy." });
  if (result.decision === "review") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This content is pending safety review and is not public yet." });
  return result;
}
