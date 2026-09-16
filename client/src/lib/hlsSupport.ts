export function canPlayHls(video: Pick<HTMLVideoElement, "canPlayType"> | null | undefined): boolean {
  if (!video) return false;
  return video.canPlayType("application/vnd.apple.mpegurl") !== "" || video.canPlayType("application/x-mpegURL") !== "";
}
