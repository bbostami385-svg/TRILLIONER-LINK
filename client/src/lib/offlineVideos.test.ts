import { describe, expect, it } from "vitest";
import { sortOfflineVideoRecords, type OfflineVideoRecord } from "./offlineVideos";

const records: OfflineVideoRecord[] = [
  { id: 1, title: "Older large", videoUrl: "https://cdn.example/one.mp4", savedAt: "2026-08-20T12:00:00.000Z", sizeBytes: 9_000 },
  { id: 2, title: "Newest small", videoUrl: "https://cdn.example/two.mp4", savedAt: "2026-08-24T12:00:00.000Z", sizeBytes: 1_000 },
  { id: 3, title: "Middle unknown", videoUrl: "https://cdn.example/three.mp4", savedAt: "2026-08-22T12:00:00.000Z" },
];

describe("offline video helpers", () => {
  it("sorts newest saved records first", () => {
    expect(sortOfflineVideoRecords(records, "date").map((record) => record.id)).toEqual([2, 3, 1]);
  });

  it("sorts the largest cached files first and treats unknown size as zero", () => {
    expect(sortOfflineVideoRecords(records, "size").map((record) => record.id)).toEqual([1, 2, 3]);
  });

  it("does not mutate the stored record array", () => {
    const original = [...records];
    sortOfflineVideoRecords(records, "date");
    expect(records).toEqual(original);
  });
});
