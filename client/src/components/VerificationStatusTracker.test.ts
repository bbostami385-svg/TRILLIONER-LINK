import { describe, expect, it } from "vitest";
import { stateFor } from "./VerificationStatusTracker";

describe("VerificationStatusTracker state mapping", () => {
  it("maps each KYC stage to the intended visual state", () => {
    expect(stateFor(undefined)).toBe("not_started");
    expect(stateFor("pending")).toBe("pending");
    expect(stateFor("rejected")).toBe("needs_action");
    expect(stateFor("approved")).toBe("complete");
    expect(stateFor("pending", true)).toBe("complete");
  });
});
