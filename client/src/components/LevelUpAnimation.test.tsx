// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LevelUpAnimation } from "./LevelUpAnimation";

describe("LevelUpAnimation", () => {
  it("renders the celebration dialog and confetti for an open level transition", () => {
    render(<LevelUpAnimation isOpen newLevel={4} previousLevel={3} onClose={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /congratulations/i })).toBeInTheDocument();
    expect(document.body.textContent).toContain("You've advanced from Level 3 to");
    expect(screen.getByRole("heading", { name: "Level 4 reached" })).toBeInTheDocument();
    expect(screen.getByText("Level 4")).toBeInTheDocument();
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(50);
  });

  it("calls onClose from the continuation action", () => {
    const onClose = vi.fn();
    render(<LevelUpAnimation isOpen newLevel={2} previousLevel={1} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /awesome.*continue/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
