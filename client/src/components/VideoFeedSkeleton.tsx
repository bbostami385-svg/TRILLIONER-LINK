type VideoFeedSkeletonProps = { variant?: "long" | "short" };

export default function VideoFeedSkeleton({ variant = "long" }: VideoFeedSkeletonProps) {
  const short = variant === "short";
  return (
    <div className={`${short ? "mx-auto max-w-md rounded-3xl" : "min-h-[650px]"} animate-pulse bg-[#101522]`} aria-label={`Loading ${short ? "Shorts" : "video"} feed`} role="status">
      <span className="sr-only">Loading {short ? "Shorts" : "videos"}…</span>
      <div className={`${short ? "min-h-[560px]" : "min-h-[650px] sm:min-h-[720px]"} relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/70`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(99,102,241,0.24),transparent_34%)]" />
        {short ? <div className="absolute inset-x-0 bottom-0 space-y-3 p-5"><div className="h-5 w-28 rounded-full bg-white/10" /><div className="h-7 w-4/5 rounded-xl bg-white/10" /><div className="h-4 w-full rounded bg-white/10" /><div className="h-4 w-2/3 rounded bg-white/10" /></div> : <div className="absolute inset-x-0 bottom-0 space-y-4 p-5 sm:p-7"><div className="h-6 w-32 rounded-full bg-white/10" /><div className="h-9 w-4/5 rounded-xl bg-white/10" /><div className="h-4 w-full max-w-md rounded bg-white/10" /><div className="h-4 w-3/4 max-w-sm rounded bg-white/10" /><div className="h-3 w-40 rounded bg-white/10" /></div>}
        <div className="absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-4"><div className="h-12 w-12 rounded-full bg-white/10" /><div className="h-12 w-12 rounded-full bg-white/10" /><div className="h-12 w-12 rounded-full bg-white/10" /></div>
      </div>
    </div>
  );
}
