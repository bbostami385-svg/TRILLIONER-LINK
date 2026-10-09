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
  mediaType?: "short" | "long";
  cacheKey?: string;
};

const CACHE_VERSION = "v2";
const CACHE_PREFIX = "trillioner-link-offline-videos";
const RECORDS_PREFIX = "trillioner-link-offline-video-records";
const SEARCH_HISTORY_KEY = "trillioner-link-offline-search-history";
const SEARCH_HISTORY_LIMIT = 8;
const MAX_OFFLINE_VIDEO_BYTES = 512 * 1024 * 1024;
export const OFFLINE_STORAGE_SCOPE = "account-scoped-app-private-cache" as const;

function scopeToken(ownerId = "anonymous") {
  let hash = 2166136261;
  for (const character of ownerId) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

export function getOfflineStorageScope(ownerId: string) { return scopeToken(ownerId); }

function cacheName(ownerId = "anonymous") { return `${CACHE_PREFIX}-${CACHE_VERSION}-${scopeToken(ownerId)}`; }
function recordsKey(ownerId = "anonymous") { return `${RECORDS_PREFIX}-${scopeToken(ownerId)}`; }
function cacheRequest(ownerId: string, record: Pick<OfflineVideoRecord, "id" | "qualityLabel">) {
  const quality = encodeURIComponent(record.qualityLabel || "Original");
  return `${window.location.origin}/__trillioner_offline__/${scopeToken(ownerId)}/${record.id}/${quality}`;
}

function readRecords(ownerId = "anonymous"): OfflineVideoRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(recordsKey(ownerId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is OfflineVideoRecord => Boolean(item && typeof item === "object" && typeof (item as OfflineVideoRecord).id === "number" && typeof (item as OfflineVideoRecord).videoUrl === "string")) : [];
  } catch { return []; }
}

function writeRecords(records: OfflineVideoRecord[], ownerId = "anonymous") {
  window.localStorage.setItem(recordsKey(ownerId), JSON.stringify(records));
}

export type OfflineSort = "date" | "size";
export function sortOfflineVideoRecords(records: OfflineVideoRecord[], sortBy: OfflineSort) { return [...records].sort((a, b) => sortBy === "date" ? new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime() : (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0)); }
export function filterOfflineVideoRecords(records: OfflineVideoRecord[], mediaType: "all" | "short" | "long") { return mediaType === "all" ? records : records.filter((record) => (record.mediaType ?? "long") === mediaType); }
export function searchOfflineVideoRecords(records: OfflineVideoRecord[], query: string) { const normalized = query.trim().toLocaleLowerCase(); if (!normalized) return records; return records.filter((record) => [record.title, record.description, record.creatorName, record.playlistName].some((value) => value?.toLocaleLowerCase().includes(normalized))); }
export function getOfflineSuggestions(records: OfflineVideoRecord[], query: string, limit = 6) { const normalized = query.trim().toLocaleLowerCase(); const values = records.flatMap((record) => [record.creatorName, record.playlistName]).filter((value): value is string => Boolean(value && (!normalized || value.toLocaleLowerCase().includes(normalized)))); return Array.from(new Set(values)).slice(0, limit); }
export function getSuggestedOfflineVideoRecords(records: OfflineVideoRecord[], limit = 3) { return sortOfflineVideoRecords(records, "date").slice(0, limit); }
export function getOfflineVideoRecords(ownerId = "anonymous") { return readRecords(ownerId); }
export function getOfflineSearchHistory() { if (typeof window === "undefined") return []; try { const parsed: unknown = JSON.parse(window.localStorage.getItem(SEARCH_HISTORY_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, SEARCH_HISTORY_LIMIT) : []; } catch { return []; } }
export function rememberOfflineSearch(query: string) { if (typeof window === "undefined") return getOfflineSearchHistory(); const normalized = query.trim(); if (!normalized) return getOfflineSearchHistory(); const next = [normalized, ...getOfflineSearchHistory().filter((item) => item.toLocaleLowerCase() !== normalized.toLocaleLowerCase())].slice(0, SEARCH_HISTORY_LIMIT); window.localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)); return next; }
export function clearOfflineSearchHistory() { if (typeof window !== "undefined") window.localStorage.removeItem(SEARCH_HISTORY_KEY); }
export function isOfflineVideoSaved(videoId: number, ownerId = "anonymous") { return readRecords(ownerId).some((record) => record.id === videoId); }
export function supportsAppOnlyOfflineStorage() { return typeof window !== "undefined" && "caches" in window; }

async function requestPersistentAppStorage() {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    try { await navigator.storage.persist(); } catch { /* Browser may decline; the cache remains app-scoped. */ }
  }
}

async function ensureStorageCapacity(expectedBytes?: number) {
  if (!expectedBytes || expectedBytes <= 0 || typeof navigator === "undefined" || !navigator.storage?.estimate) return;
  if (expectedBytes > MAX_OFFLINE_VIDEO_BYTES) throw new Error("This video is too large for app-only offline storage. Choose a lower quality.");
  const estimate = await navigator.storage.estimate();
  if (estimate.quota && (estimate.usage ?? 0) + expectedBytes > estimate.quota * 0.95) throw new Error("Not enough app storage remains for this video. Remove an offline video or choose a lower quality.");
}

export async function getOfflineStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usageBytes: estimate.usage ?? 0, quotaBytes: estimate.quota ?? null, availableBytes: estimate.quota ? Math.max(0, estimate.quota - (estimate.usage ?? 0)) : null };
}

async function removeLegacyCaches(ownerId: string) {
  if (typeof window === "undefined" || !window.caches.keys) return;
  const names = await window.caches.keys();
  await Promise.all(names.filter((name) => name.startsWith(`${CACHE_PREFIX}-`) && !name.includes(`-${CACHE_VERSION}-`)).map((name) => window.caches.delete(name)));
}

export async function saveVideoForOffline(ownerId: string, record: Omit<OfflineVideoRecord, "savedAt" | "sizeBytes" | "cacheKey">) {
  if (!ownerId) throw new Error("A signed-in account is required for offline storage.");
  if (!supportsAppOnlyOfflineStorage()) throw new Error("App-only offline saving is not supported in this browser.");
  await removeLegacyCaches(ownerId);
  await requestPersistentAppStorage();
  const response = await fetch(record.videoUrl, { credentials: "omit" });
  if (!response.ok) throw new Error("The video could not be downloaded for offline viewing.");
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.startsWith("video/") && !contentType.includes("application/octet-stream") && !contentType.includes("application/vnd.apple.mpegurl")) throw new Error("The downloaded resource is not a valid video.");
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  await ensureStorageCapacity(declaredSize);
  const blob = await response.clone().blob();
  await ensureStorageCapacity(blob.size);
  const cache = await window.caches.open(cacheName(ownerId));
  const nextRecord: OfflineVideoRecord = { ...record, mediaType: record.mediaType ?? "long", sizeBytes: blob.size, savedAt: new Date().toISOString(), cacheKey: cacheRequest(ownerId, record) };
  const previous = readRecords(ownerId).filter((item) => item.id === record.id);
  try {
    for (const old of previous) await cache.delete(old.cacheKey ?? old.videoUrl);
    await cache.put(nextRecord.cacheKey!, response.clone());
    writeRecords([...readRecords(ownerId).filter((item) => item.id !== record.id), nextRecord], ownerId);
  } catch (error) {
    await cache.delete(nextRecord.cacheKey!);
    for (const old of previous) {
      const oldResponse = await fetch(old.videoUrl, { credentials: "omit" }).catch(() => null);
      if (oldResponse?.ok) await cache.put(old.cacheKey ?? old.videoUrl, oldResponse);
    }
    throw error instanceof Error ? error : new Error("The offline video could not be saved.");
  }
  return nextRecord;
}

export async function reconcileOfflineVideoRecords(ownerId: string) {
  if (!ownerId || !supportsAppOnlyOfflineStorage()) return [];
  await removeLegacyCaches(ownerId);
  const records = readRecords(ownerId);
  const cache = await window.caches.open(cacheName(ownerId));
  const valid: OfflineVideoRecord[] = [];
  for (const record of records) if (await cache.match(record.cacheKey ?? record.videoUrl)) valid.push(record);
  if (valid.length !== records.length) writeRecords(valid, ownerId);
  return valid;
}

export async function getOfflineVideoUrl(ownerId: string, record: Pick<OfflineVideoRecord, "id" | "videoUrl" | "qualityLabel" | "cacheKey">) {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  const response = await (await window.caches.open(cacheName(ownerId))).match(record.cacheKey ?? cacheRequest(ownerId, record));
  if (!response) return null;
  return URL.createObjectURL(await response.blob());
}

export async function removeOfflineVideo(ownerId: string, videoId: number, videoUrl: string, cacheKey?: string) {
  if (typeof window !== "undefined" && "caches" in window) await (await window.caches.open(cacheName(ownerId))).delete(cacheKey ?? videoUrl);
  if (typeof window !== "undefined") writeRecords(readRecords(ownerId).filter((record) => record.id !== videoId), ownerId);
}

export async function clearOfflineVideoStorage(ownerId: string) {
  if (typeof window !== "undefined" && "caches" in window) await window.caches.delete(cacheName(ownerId));
  if (typeof window !== "undefined") window.localStorage.removeItem(recordsKey(ownerId));
}
