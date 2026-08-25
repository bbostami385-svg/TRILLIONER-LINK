// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { HlsVideoPlayer } from "./HlsVideoPlayer";

vi.mock("hls.js", () => ({
  default: class MockHls {
    static isSupported() { return false; }
    loadSource = vi.fn();
    attachMedia = vi.fn();
    on = vi.fn();
    destroy = vi.fn();
  },
}));

afterEach(() => cleanup());

describe("HlsVideoPlayer", () => {
  it("renders a controllable video element for an HLS source", () => {
    const { container } = render(<HlsVideoPlayer src="https://cdn.example.com/live/index.m3u8" autoPlay />);
    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(video?.controls).toBe(true);
    expect(video?.autoplay).toBe(true);
  });

  it("cleans up the video element when the source changes", () => {
    const { container, rerender } = render(<HlsVideoPlayer src="https://cdn.example.com/live/one.m3u8" />);
    const video = container.querySelector("video") as HTMLVideoElement;
    const loadSpy = vi.spyOn(video, "load");
    rerender(<HlsVideoPlayer src="https://cdn.example.com/live/two.m3u8" />);
    expect(loadSpy).toHaveBeenCalled();
    expect(video.getAttribute("src")).toBeNull();
  });
});
