export type WatchLaterMediaType = "short" | "long";
export type WatchLaterItem = { id: number; title: string; description?: string | null; videoUrl?: string | null; thumbnailUrl?: string | null; creatorName?: string | null; mediaType: WatchLaterMediaType; savedAt: string; folderId?: string; };
export type WatchLaterFolder = { id: string; name: string; createdAt: string; };

const STORAGE_KEY = "trillioner-link-watch-later-v1";
const FOLDERS_KEY = "trillioner-link-watch-later-folders-v1";

function readItems(): WatchLaterItem[] { if (typeof window === "undefined") return []; try { const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((item): item is WatchLaterItem => Boolean(item && typeof item === "object" && typeof (item as WatchLaterItem).id === "number" && typeof (item as WatchLaterItem).title === "string" && ((item as WatchLaterItem).mediaType === "short" || (item as WatchLaterItem).mediaType === "long"))) : []; } catch { return []; } }
function writeItems(items: WatchLaterItem[]) { if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function readFolders(): WatchLaterFolder[] { if (typeof window === "undefined") return []; try { const parsed: unknown = JSON.parse(window.localStorage.getItem(FOLDERS_KEY) ?? "[]"); return Array.isArray(parsed) ? parsed.filter((folder): folder is WatchLaterFolder => Boolean(folder && typeof folder === "object" && typeof (folder as WatchLaterFolder).id === "string" && typeof (folder as WatchLaterFolder).name === "string")) : []; } catch { return []; } }

export function getWatchLaterItems() { return readItems(); }
export function isWatchLaterSaved(id: number, mediaType: WatchLaterMediaType) { return readItems().some((item) => item.id === id && item.mediaType === mediaType); }
export function toggleWatchLater(item: Omit<WatchLaterItem, "savedAt">) { const current = readItems(); const existing = current.findIndex((entry) => entry.id === item.id && entry.mediaType === item.mediaType); const next = existing >= 0 ? current.filter((_, index) => index !== existing) : [{ ...item, savedAt: new Date().toISOString() }, ...current]; writeItems(next); return { saved: existing < 0, items: next }; }
export function removeWatchLater(id: number, mediaType: WatchLaterMediaType) { const next = readItems().filter((item) => !(item.id === id && item.mediaType === mediaType)); writeItems(next); return next; }
export function reorderWatchLater(fromIndex: number, toIndex: number) { const next = readItems(); if (fromIndex < 0 || toIndex < 0 || fromIndex >= next.length || toIndex >= next.length || fromIndex === toIndex) return next; const [moved] = next.splice(fromIndex, 1); next.splice(toIndex, 0, moved); writeItems(next); return next; }
export function getWatchLaterFolders() { return readFolders(); }
export function createWatchLaterFolder(name: string) { const normalized = name.trim(); if (!normalized) return readFolders(); const current = readFolders(); if (current.some((folder) => folder.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())) return current; const next = [...current, { id: `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: normalized, createdAt: new Date().toISOString() }]; if (typeof window !== "undefined") window.localStorage.setItem(FOLDERS_KEY, JSON.stringify(next)); return next; }
export function moveWatchLaterToFolder(id: number, mediaType: WatchLaterMediaType, folderId?: string) { const next = readItems().map((item) => item.id === id && item.mediaType === mediaType ? { ...item, folderId } : item); writeItems(next); return next; }
