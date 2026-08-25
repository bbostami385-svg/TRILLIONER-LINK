// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

vi.mock("socket.io-client", () => ({ io: vi.fn() }));

import { resolveSocketUrl } from "./useWebSocket";

describe("resolveSocketUrl", () => {
  it("uses the deployment origin when no endpoint is configured", () => {
    expect(resolveSocketUrl(undefined, "https://trillionerlink.example")).toBe("https://trillionerlink.example");
  });

  it("accepts complete HTTPS endpoints and relative paths", () => {
    expect(resolveSocketUrl("https://api.example.com/", "https://trillionerlink.example")).toBe("https://api.example.com");
    expect(resolveSocketUrl("/api", "https://trillionerlink.example")).toBe("https://trillionerlink.example/api");
  });

  it("falls back safely for unsupported or malformed endpoints", () => {
    expect(resolveSocketUrl("javascript:alert(1)", "https://trillionerlink.example")).toBe("https://trillionerlink.example");
    expect(resolveSocketUrl("http://[invalid", "https://trillionerlink.example")).toBe("https://trillionerlink.example");
  });
});
