import { Heart, SmilePlus } from "lucide-react";

export const VIDEO_REACTIONS = ["👍", "🤣", "😂", "😅", "😭", "😁", "🥹", "😍", "🥰", "😘", "😚", "😏", "🤪", "😝", "🤔", "🤫", "😱", "😡", "🤬", "🤨", "🧐"] as const;

export function ReactionPicker({ selected, onSelect, onLike, compact = false }: { selected?: string; onSelect: (reaction: string) => void; onLike: () => void; compact?: boolean }) {
  return <div className={`relative flex items-center gap-2 ${compact ? "" : "rounded-full border border-white/10 bg-black/30 p-1 backdrop-blur"}`}>
    <button type="button" aria-label={selected ? `Reacted ${selected}; choose another reaction` : "Like video"} onClick={onLike} className={`grid h-10 w-10 place-items-center rounded-full transition ${selected ? "bg-rose-500 text-white" : "text-white hover:bg-white/15"}`}><Heart className={`h-5 w-5 ${selected ? "fill-current" : ""}`} /></button>
    <details className="group relative">
      <summary aria-label="Choose a video reaction" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full text-white transition hover:bg-white/15"><SmilePlus className="h-5 w-5" /></summary>
      <div role="menu" aria-label="Video reactions" className="absolute bottom-12 right-0 z-30 grid w-64 grid-cols-7 gap-1 rounded-2xl border border-white/15 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
        {VIDEO_REACTIONS.map((reaction) => <button type="button" role="menuitem" aria-label={`React ${reaction}`} key={reaction} onClick={() => onSelect(reaction)} className={`grid h-8 w-8 place-items-center rounded-lg text-lg transition hover:scale-110 hover:bg-white/15 ${selected === reaction ? "bg-cyan-400/20 ring-1 ring-cyan-300" : ""}`}>{reaction}</button>)}
      </div>
    </details>
  </div>;
}
