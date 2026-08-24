import { describe, expect, it } from "vitest";
import { clearOfflineSearchHistory, getOfflineSearchHistory, getOfflineSuggestions, getSuggestedOfflineVideoRecords, rememberOfflineSearch, searchOfflineVideoRecords, sortOfflineVideoRecords, type OfflineVideoRecord } from "./offlineVideos";

const records: OfflineVideoRecord[] = [
  { id: 1, title: "Older large", videoUrl: "https://cdn.example/one.mp4", savedAt: "2026-08-20T12:00:00.000Z", sizeBytes: 9_000, creatorName: "Dr. Nova", playlistName: "Science" },
  { id: 2, title: "Newest small", videoUrl: "https://cdn.example/two.mp4", savedAt: "2026-08-24T12:00:00.000Z", sizeBytes: 1_000, creatorName: "Lumen Studio", playlistName: "Music" },
  { id: 3, title: "Middle unknown", videoUrl: "https://cdn.example/three.mp4", savedAt: "2026-08-22T12:00:00.000Z" },
];

describe("offline video helpers", () => {
  it("sorts newest saved records first", () => {
    expect(sortOfflineVideoRecords(records, "date").map((record) => record.id)).toEqual([2, 3, 1]);
  });

  it("sorts the largest cached files first and treats unknown size as zero", () => {
    expect(sortOfflineVideoRecords(records, "size").map((record) => record.id)).toEqual([1, 2, 3]);
  });

  it("searches titles, creators, and playlists", () => {
    expect(searchOfflineVideoRecords(records, "nova").map((record) => record.id)).toEqual([1]);
    expect(searchOfflineVideoRecords(records, "music").map((record) => record.id)).toEqual([2]);
  });

  it("returns unique creator and playlist suggestions", () => {
    expect(getOfflineSuggestions(records, "")).toEqual(["Dr. Nova", "Science", "Lumen Studio", "Music"]);
    expect(getOfflineSuggestions(records, "sci")).toEqual(["Science"]);
  });

  it("returns recent saved videos as the no-result fallback", () => {
    expect(getSuggestedOfflineVideoRecords(records, 2).map((record) => record.id)).toEqual([2, 3]);
  });

  it("stores recent searches newest-first, deduplicates case-insensitively, and clears them", () => {
    const originalWindow = globalThis.window;
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) } } });
    try {
      rememberOfflineSearch("Science");
      rememberOfflineSearch("Music");
      rememberOfflineSearch("science");
      expect(getOfflineSearchHistory()).toEqual(["science", "Music"]);
      clearOfflineSearchHistory();
      expect(getOfflineSearchHistory()).toEqual([]);
    } finally {
      Object.defineProperty(globalThis, "window", { configurable: true, value: originalWindow });
    }
  });

  it("does not mutate the stored record array", () => {
    const original = [...records];
    sortOfflineVideoRecords(records, "date");
    searchOfflineVideoRecords(records, "nova");
    expect(records).toEqual(original);
  });
});
