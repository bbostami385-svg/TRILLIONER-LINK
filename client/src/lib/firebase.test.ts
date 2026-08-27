// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { getFirebaseErrorMessage, normalizeFirebaseAuthDomain } from "./firebase";

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

describe("getFirebaseErrorMessage", () => {
  it("turns common Google popup failures into actionable messages", () => {
    expect(getFirebaseErrorMessage({ code: "auth/popup-blocked" })).toContain("blocked the Google sign-in window");
    expect(getFirebaseErrorMessage({ code: "auth/popup-closed-by-user" })).toContain("cancelled");
    expect(getFirebaseErrorMessage({ code: "auth/unauthorized-domain" })).toContain("authorized");
  });

  it("handles email, network, and unknown failures without exposing Firebase internals", () => {
    expect(getFirebaseErrorMessage({ code: "auth/wrong-password" })).toContain("password is incorrect");
    expect(getFirebaseErrorMessage({ code: "auth/network-request-failed" })).toContain("internet connection");
    expect(getFirebaseErrorMessage({ code: "auth/unknown" }, "Try again later.")).toBe("Try again later.");
  });
});
