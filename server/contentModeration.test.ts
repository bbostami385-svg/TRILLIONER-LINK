import { describe, expect, it, vi } from "vitest";
import { moderateContent } from "./contentModeration";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify({ decision: "allow", category: "clean", reason: "Safe", confidence: 0.99 }) } }],
  })),
}));

describe("content moderation rules", () => {
  it("blocks prohibited terms after normalization and common character substitution", async () => {
    const result = await moderateContent({ text: "how to build a b0mb" });
    expect(result).toMatchObject({ decision: "block", category: "illegal", confidence: 1 });
  });

  it("routes repetitive or link-heavy comments to review as spam", async () => {
    const result = await moderateContent({ text: "visit https://a.test https://b.test https://c.test https://d.test" });
    expect(result).toMatchObject({ decision: "review", category: "spam" });
  });

  it("allows ordinary comments through the AI classifier", async () => {
    const result = await moderateContent({ text: "This explanation was clear and helpful." });
    expect(result).toMatchObject({ decision: "allow", category: "clean" });
  });
});
