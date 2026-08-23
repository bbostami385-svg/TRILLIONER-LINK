import { TRPCError } from "@trpc/server";
import { invokeLLM, type MessageContent } from "./_core/llm";

const DISALLOWED_TERMS = [
  "child sexual abuse",
  "sexual exploitation of a minor",
  "terrorist recruitment",
  "how to build a bomb",
  "graphic gore",
];

export type ModerationResult = {
  decision: "allow" | "block" | "review";
  category: "clean" | "hate" | "harassment" | "sexual" | "violence" | "self_harm" | "illegal" | "spam" | "unknown";
  reason: string;
  confidence: number;
};

function deterministicTextCheck(text: string): ModerationResult | null {
  const normalized = text.toLocaleLowerCase();
  const term = DISALLOWED_TERMS.find((candidate) => normalized.includes(candidate));
  if (!term) return null;
  return { decision: "block", category: "illegal", reason: "The content contains a prohibited safety term.", confidence: 1 };
}

function normalizeResult(value: unknown): ModerationResult {
  const result = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const decision = result.decision === "block" || result.decision === "review" ? result.decision : "allow";
  const categories = ["clean", "hate", "harassment", "sexual", "violence", "self_harm", "illegal", "spam", "unknown"] as const;
  const category = categories.includes(result.category as (typeof categories)[number]) ? result.category as ModerationResult["category"] : "unknown";
  const confidence = typeof result.confidence === "number" ? Math.max(0, Math.min(1, result.confidence)) : 0;
  return { decision, category, confidence, reason: typeof result.reason === "string" ? result.reason.slice(0, 240) : "Automated safety review completed." };
}

export async function moderateContent(options: { text?: string; mediaUrl?: string; mediaType?: "image" | "video" }): Promise<ModerationResult> {
  const text = options.text?.trim() ?? "";
  const deterministic = deterministicTextCheck(text);
  if (deterministic) return deterministic;

  const content: MessageContent[] = [{ type: "text", text: `Review this user-generated content for platform safety. Text: ${text || "(none)"}` }];
  if (options.mediaUrl && options.mediaType === "image") content.push({ type: "image_url", image_url: { url: options.mediaUrl, detail: "auto" } });
  if (options.mediaUrl && options.mediaType === "video") content.push({ type: "file_url", file_url: { url: options.mediaUrl, mime_type: "video/mp4" } });

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a strict trust-and-safety classifier. Block sexual exploitation, credible violent wrongdoing, graphic gore, hate, and illegal instruction. Allow ordinary disagreement, news, education, and non-graphic discussion. Return JSON only." },
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
              category: { type: "string", enum: ["clean", "hate", "harassment", "sexual", "violence", "self_harm", "illegal", "spam", "unknown"] },
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
