import { useEffect, useRef, useState } from "react";
import { canPlayHls } from "@/lib/hlsSupport";

type Props = {
  src: string;
  poster?: string | null;
  title: string;
  className?: string;
};

export function HlsVideoPlayer({ src, poster, title, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const isHls = /\.m3u8(?:$|\?)/i.test(src);
    if (isHls && !canPlayHls(video)) {
      setSupported(false);
      return;
    }
    setSupported(true);
    video.load();
  }, [src]);

  if (!supported) {
    return (
      <div className={`flex aspect-video items-center justify-center bg-slate-950 px-6 text-center text-sm text-slate-300 ${className}`} role="status">
        This browser cannot play the live HLS stream natively. Try Safari or use a compatible streaming client.
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster ?? undefined}
      title={title}
      controls
      playsInline
      autoPlay
      className={`aspect-video w-full bg-black object-contain ${className}`}
      onError={() => setSupported(false)}
    />
  );
}
