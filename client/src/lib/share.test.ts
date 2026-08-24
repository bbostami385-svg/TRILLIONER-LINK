import { describe, expect, it } from "vitest";
import { getSocialShareUrl, shareOrCopy } from "./share";

describe("social sharing helpers", () => {
  const payload = { title: "Science playlist", text: "Watch this playlist", url: "https://trillioner.example/playlist/7" };

  it("creates encoded WhatsApp and Facebook share URLs", () => {
    expect(getSocialShareUrl("whatsapp", payload)).toContain("wa.me/?text=");
    expect(getSocialShareUrl("facebook", payload)).toContain("sharer.php?u=https%3A%2F%2Ftrillioner.example%2Fplaylist%2F7");
  });

  it("reports a successful clipboard copy when native sharing is unavailable", async () => {
    const originalNavigator = globalThis.navigator;
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: { clipboard: { writeText: async () => undefined } } });
    await expect(shareOrCopy(payload)).resolves.toBe("copied");
    Object.defineProperty(globalThis, "navigator", { configurable: true, value: originalNavigator });
  });

  it("supports the remaining social targets", () => {
    expect(getSocialShareUrl("x", payload)).toContain("twitter.com/intent/tweet");
    expect(getSocialShareUrl("telegram", payload)).toContain("t.me/share/url");
    expect(getSocialShareUrl("linkedin", payload)).toContain("linkedin.com/sharing/share-offsite");
  });
});
