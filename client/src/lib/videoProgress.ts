const STORAGE_KEY = "trillioner-link-video-progress-v1";

type ProgressMap = Record<string, number>;

function readProgress(): ProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "number" && value >= 0 && value <= 1));
  } catch { return {}; }
}

export function getVideoWatchProgress(id: number, mediaType: "short" | "long" = "long") { return readProgress()[`${mediaType}:${id}`] ?? 0; }
export function getAllVideoWatchProgress() { return readProgress(); }
export function setVideoWatchProgress(id: number, progress: number, mediaType: "short" | "long" = "long") { const next = { ...readProgress(), [`${mediaType}:${id}`]: Math.min(1, Math.max(0, progress)) }; if (typeof window !== "undefined") { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent("trillioner-video-progress")); } return next; }
export function isVideoWatched(id: number, mediaType: "short" | "long" = "long") { return getVideoWatchProgress(id, mediaType) >= 0.9; }
