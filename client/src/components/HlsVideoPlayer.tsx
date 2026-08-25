import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface HlsVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
}

export function HlsVideoPlayer({ src, poster, className, autoPlay = false }: HlsVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError(null);
    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 90 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError("This live stream is temporarily unavailable.");
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      setError("This browser cannot play HLS streams.");
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  return (
    <div className="relative h-full w-full">
      <video ref={videoRef} className={className} poster={poster} controls autoPlay={autoPlay} playsInline muted={autoPlay} />
      {error && <div className="absolute inset-0 grid place-items-center bg-slate-950/85 p-4 text-center text-sm text-white">{error}</div>}
    </div>
  );
}
