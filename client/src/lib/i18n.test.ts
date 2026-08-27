// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { getLanguage, setLanguage, t, translateStaticText } from "./i18n";

describe("application translations", () => {
  afterEach(() => setLanguage("en"));

  it("supports English, Bengali, and Hindi with the TRILLIONER LINK brand", () => {
    setLanguage("en");
    expect(t("common.appName")).toBe("TRILLIONER LINK");
    setLanguage("bn");
    expect(t("common.appName")).toBe("TRILLIONER LINK");
    expect(t("payment.paymentHistory")).toBe("পেমেন্টের ইতিহাস");
    setLanguage("hi");
    expect(t("common.appName")).toBe("TRILLIONER LINK");
    expect(t("payment.paymentHistory")).toBe("भुगतान इतिहास");
  });

  it("updates the active language and translates shared static labels", () => {
    setLanguage("bn");
    expect(getLanguage()).toBe("bn");
    expect(translateStaticText("  Payment history ")).toBe("  পেমেন্টের ইতিহাস ");
    setLanguage("hi");
    expect(translateStaticText("Followers")).toBe("फॉलोअर्स");
  });

  it("translates shared labels used by additional major routed pages", () => {
    setLanguage("bn");
    expect(translateStaticText("Trending")).toBe("ট্রেন্ডিং");
    expect(translateStaticText("Settings")).toBe("সেটিংস");
    setLanguage("hi");
    expect(translateStaticText("Followers")).toBe("फॉलोअर्स");
    expect(translateStaticText("Videos")).toBe("वीडियो");
  });

  it("falls back to English for an unknown key and preserves the supplied default", () => {
    setLanguage("en");
    expect(t("payment.notARealKey", "Fallback copy")).toBe("Fallback copy");
    expect(translateStaticText("A creator-specific sentence")).toBe("A creator-specific sentence");
  });
});
