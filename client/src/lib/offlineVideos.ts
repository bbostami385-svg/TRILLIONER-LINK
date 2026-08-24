export type OfflineVideoRecord = {
  id: number;
  title: string;
  description?: string | null;
  videoUrl: string;
  thumbnailUrl?: string | null;
  creatorName?: string | null;
  savedAt: string;
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

export function getOfflineVideoRecords() { return readRecords(); }
export function isOfflineVideoSaved(videoId: number) { return readRecords().some((record) => record.id === videoId); }

export async function saveVideoForOffline(record: Omit<OfflineVideoRecord, "savedAt">) {
  if (typeof window === "undefined" || !("caches" in window)) throw new Error("Offline saving is not supported in this browser.");
  const response = await fetch(record.videoUrl, { credentials: "omit" });
  if (!response.ok) throw new Error("The video could not be downloaded for offline viewing.");
  const cache = await window.caches.open(CACHE_NAME);
  await cache.put(record.videoUrl, response.clone());
  const next = [...readRecords().filter((item) => item.id !== record.id), { ...record, savedAt: new Date().toISOString() }];
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
