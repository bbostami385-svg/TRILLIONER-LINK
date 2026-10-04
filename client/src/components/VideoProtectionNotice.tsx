import { useState } from "react";
import { Flag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { CopyrightReportDialog } from "./CopyrightReportDialog";

export function VideoProtectionNotice({ videoId }: { videoId: number }) {
  const [reportOpen, setReportOpen] = useState(false);
  const protection = trpc.copyright.getProtection.useQuery({ videoId }, { staleTime: 60_000 });
  const policy = protection.data;
  return <>
    <div className="pointer-events-none absolute inset-0 z-[2] select-none" onContextMenu={(event) => event.preventDefault()}>
      {policy?.watermarkEnabled && <div className="absolute inset-0 grid place-items-center -rotate-12 text-center text-lg font-semibold tracking-[0.25em] text-white/20 sm:text-2xl">{policy.watermarkText || "TRILLIONER LINK • ORIGINAL"}</div>}
      <div className="pointer-events-auto absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-xl border border-white/15 bg-black/60 px-3 py-2 text-xs text-white/85 backdrop-blur">
        <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-300" />
        <span>{policy?.allowDownload ? "Creator allows download" : "Protected viewing · downloads disabled"}</span>
        {policy?.screenshotRecordingNotice && <span className="hidden text-white/60 sm:inline">Do not screenshot or record private content.</span>}
        <Button type="button" variant="ghost" size="sm" onClick={() => setReportOpen(true)} className="ml-auto h-7 gap-1 px-2 text-white hover:bg-white/15 hover:text-white"><Flag className="h-3.5 w-3.5" />Report</Button>
      </div>
    </div>
    <CopyrightReportDialog open={reportOpen} onOpenChange={setReportOpen} targetVideoId={videoId} />
  </>;
}
