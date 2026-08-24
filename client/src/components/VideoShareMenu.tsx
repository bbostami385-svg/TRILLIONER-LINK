import { Facebook, Linkedin, MessageCircle, Send, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { getSocialShareUrl, shareOrCopy, type ShareTarget } from "@/lib/share";

const targets: Array<{ id: ShareTarget; label: string; Icon: typeof Facebook }> = [
  { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
  { id: "facebook", label: "Facebook", Icon: Facebook },
  { id: "x", label: "X", Icon: Twitter },
  { id: "telegram", label: "Telegram", Icon: Send },
  { id: "linkedin", label: "LinkedIn", Icon: Linkedin },
];

export default function VideoShareMenu({ title, text, url }: { title: string; text?: string; url: string }) {
  const payload = { title, text, url };
  const copy = async () => { try { const result = await shareOrCopy(payload); toast.success(result === "copied" ? "Video link copied to your clipboard." : "Video share sheet opened."); } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; toast.error("We could not share this video link."); } };
  return <details className="relative">
    <summary aria-label="Share video" className="grid h-12 w-12 cursor-pointer list-none place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"><Share2 className="h-5 w-5" /></summary>
    <div role="menu" aria-label="Video sharing options" className="absolute bottom-14 right-0 z-30 w-56 rounded-2xl border border-white/15 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">
      <button type="button" role="menuitem" onClick={() => void copy()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white hover:bg-white/10"><span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/15 text-cyan-200">⌁</span>Copy or share link</button>
      <div className="my-1 border-t border-white/10" />
      {targets.map(({ id, label, Icon }) => <a key={id} role="menuitem" href={getSocialShareUrl(id, payload)} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"><Icon className="h-4 w-4" />Share to {label}</a>)}
    </div>
  </details>;
}
