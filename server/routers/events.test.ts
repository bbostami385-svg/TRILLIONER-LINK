import { describe, expect, it } from "vitest";
import { shouldNotifyEventCreator } from "./events";

describe("Event RSVP notifications", () => {
  it("notifies a creator when a new attendee responds", () => {
    expect(shouldNotifyEventCreator(undefined, "going", 10, 20)).toBe(true);
  });

  it("does not notify the creator about their own RSVP", () => {
    expect(shouldNotifyEventCreator(undefined, "going", 10, 10)).toBe(false);
  });

  it("does not notify again when the RSVP status is unchanged", () => {
    expect(shouldNotifyEventCreator("interested", "interested", 10, 20)).toBe(false);
    expect(shouldNotifyEventCreator("interested", "going", 10, 20)).toBe(true);
  });
});
