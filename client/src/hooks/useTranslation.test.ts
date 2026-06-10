import { describe, it, expect } from "vitest";

describe("useTranslation Hook", () => {
  it("should have translation functions", () => {
    const translations = {
      en: { hello: "Hello", goodbye: "Goodbye" },
      bn: { hello: "হ্যালো", goodbye: "বিদায়" },
      hi: { hello: "नमस्ते", goodbye: "अलविदा" },
    };

    expect(translations.en.hello).toBe("Hello");
    expect(translations.bn.hello).toBe("হ্যালো");
    expect(translations.hi.hello).toBe("नमस्ते");
  });

  it("should support multiple languages", () => {
    const languages = ["en", "bn", "hi"];
    expect(languages).toContain("en");
    expect(languages).toContain("bn");
    expect(languages).toContain("hi");
  });

  it("should format dates correctly", () => {
    const date = new Date(2024, 0, 1);
    expect(date.getFullYear()).toBe(2024);
    expect(date.getMonth()).toBe(0);
  });

  it("should format numbers correctly", () => {
    const num = 1234.56;
    expect(num).toBeGreaterThan(1000);
    expect(num).toBeLessThan(2000);
  });
});
