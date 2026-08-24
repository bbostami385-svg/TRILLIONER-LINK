export type WatchLaterMediaType = "short" | "long";

export type WatchLaterItem = {
  id: number;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  creatorName?: string | null;
  mediaType: WatchLaterMediaType;
  savedAt: string;
};

const STORAGE_KEY = "trillioner-link-watch-later-v1";

function readItems(): WatchLaterItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is WatchLaterItem => Boolean(item && typeof item === "object" && typeof (item as WatchLaterItem).id === "number" && typeof (item as WatchLaterItem).title === "string" && ((item as WatchLaterItem).mediaType === "short" || (item as WatchLaterItem).mediaType === "long"))) : [];
  } catch { return []; }
}

export function getWatchLaterItems() { return readItems().sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()); }
export function isWatchLaterSaved(id: number, mediaType: WatchLaterMediaType) { return readItems().some((item) => item.id === id && item.mediaType === mediaType); }
export function toggleWatchLater(item: Omit<WatchLaterItem, "savedAt">) { const current = readItems(); const existing = current.findIndex((entry) => entry.id === item.id && entry.mediaType === item.mediaType); const next = existing >= 0 ? current.filter((_, index) => index !== existing) : [{ ...item, savedAt: new Date().toISOString() }, ...current]; if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return { saved: existing < 0, items: next }; }
export function removeWatchLater(id: number, mediaType: WatchLaterMediaType) { const next = readItems().filter((item) => !(item.id === id && item.mediaType === mediaType)); if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); return next; }
