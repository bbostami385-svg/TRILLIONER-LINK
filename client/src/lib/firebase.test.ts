// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { normalizeFirebaseAuthDomain } from "./firebase";

describe("normalizeFirebaseAuthDomain", () => {
  it("accepts the Firebase Console hostname and strips an accidental scheme", () => {
    expect(normalizeFirebaseAuthDomain("trillioner-link.firebaseapp.com")).toBe("trillioner-link.firebaseapp.com");
    expect(normalizeFirebaseAuthDomain("https://trillioner-link.firebaseapp.com/")).toBe("trillioner-link.firebaseapp.com");
  });

  it("rejects empty and malformed auth-domain values", () => {
    expect(normalizeFirebaseAuthDomain(undefined)).toBeUndefined();
    expect(normalizeFirebaseAuthDomain("   ")).toBeUndefined();
    expect(normalizeFirebaseAuthDomain("http://[invalid")).toBeUndefined();
  });
});
