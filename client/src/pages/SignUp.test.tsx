// @vitest-environment jsdom
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignUp from "./SignUp";

const { getLoginUrl } = vi.hoisted(() => ({ getLoginUrl: vi.fn(() => "https://auth.example.com/login") }));
vi.mock("@/const", () => ({ getLoginUrl }));

describe("SignUp", () => {
  beforeEach(() => {
    getLoginUrl.mockClear();
    Object.defineProperty(window, "location", { configurable: true, value: { href: "" } });
  });

  it("starts authentication with the verification return path", () => {
    const { getByRole } = render(<SignUp />);
    fireEvent.click(getByRole("button", { name: /sign up with trillioner link/i }));
    expect(getLoginUrl).toHaveBeenCalledWith("/verify");
  });
});
