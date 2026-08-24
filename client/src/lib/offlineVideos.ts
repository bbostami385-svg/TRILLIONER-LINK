export type OfflineVideoRecord = {
  id: number;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  creatorName?: string | null;
  playlistName?: string | null;
  savedAt: string;
  qualityLabel?: string;
  sizeBytes?: number;
};

const CACHE_NAME = "trillioner-link-offline-videos-v1";
const STORAGE_KEY = "trillioner-link-offline-video-records";

function readRecords(): OfflineVideoRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is OfflineVideoRecord => Boolean(item && typeof item === "object" && typeof (item as OfflineVideoRecord).id === "number" && typeof (item as OfflineVideoRecord).videoUrl === "string")) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: OfflineVideoRecord[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export type OfflineSort = "date" | "size";
export function sortOfflineVideoRecords(records: OfflineVideoRecord[], sortBy: OfflineSort) { return [...records].sort((a, b) => sortBy === "date" ? new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime() : (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)); }
export function searchOfflineVideoRecords(records: OfflineVideoRecord[], query: string) { const normalized = query.trim().toLocaleLowerCase(); if (!normalized) return records; return records.filter((record) => [record.title, record.description, record.creatorName, record.playlistName].some((value) => value?.toLocaleLowerCase().includes(normalized))); }
export function getOfflineSuggestions(records: OfflineVideoRecord[], query: string, limit = 6) { const normalized = query.trim().toLocaleLowerCase(); const values = records.flatMap((record) => [record.creatorName, record.playlistName]).filter((value): value is string => Boolean(value && (!normalized || value.toLocaleLowerCase().includes(normalized)))); return Array.from(new Set(values)).slice(0, limit); }
export function getOfflineVideoRecords() { return readRecords(); }
export function isOfflineVideoSaved(videoId: number) { return readRecords().some((record) => record.id === videoId); }

export async function saveVideoForOffline(record: Omit<OfflineVideoRecord, "savedAt" | "sizeBytes">) {
  if (typeof window === "undefined" || !("caches" in window)) throw new Error("Offline saving is not supported in this browser.");
  const response = await fetch(record.videoUrl, { credentials: "omit" });
  if (!response.ok) throw new Error("The video could not be downloaded for offline viewing.");
  const cache = await window.caches.open(CACHE_NAME);
  await cache.put(record.videoUrl, response.clone());
  const blob = await response.blob();
  const next = [...readRecords().filter((item) => item.id !== record.id), { ...record, sizeBytes: blob.size, savedAt: new Date().toISOString() }];
  writeRecords(next);
  return next.find((item) => item.id === record.id)!;
}

export async function getOfflineVideoUrl(videoUrl: string) {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  const response = await (await window.caches.open(CACHE_NAME)).match(videoUrl);
  if (!response) return null;
  return URL.createObjectURL(await response.blob());
}

export async function removeOfflineVideo(videoId: number, videoUrl: string) {
  if (typeof window !== "undefined" && "caches" in window) await (await window.caches.open(CACHE_NAME)).delete(videoUrl);
  if (typeof window !== "undefined") writeRecords(readRecords().filter((record) => record.id !== videoId));
}
