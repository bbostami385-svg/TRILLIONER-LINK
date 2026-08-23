import { useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  open: boolean;
  imageUrl: string | null;
  label: string;
  onClose: () => void;
}

export function ImagePreviewModal({ open, imageUrl, label, onClose }: ImagePreviewModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || !imageUrl) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${label} preview`} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="relative flex max-h-[92vh] max-w-[min(96vw,1100px)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white"><div className="flex items-center gap-2 text-sm font-medium"><Maximize2 className="h-4 w-4 text-indigo-300" />{label}</div><Button variant="ghost" size="icon" aria-label="Close image preview" onClick={onClose} className="text-white hover:bg-white/10 hover:text-white"><X className="h-5 w-5" /></Button></div>
        <div className="overflow-auto p-3 sm:p-6"><img src={imageUrl} alt={label} className="mx-auto max-h-[78vh] max-w-full object-contain" /></div>
        <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-400">Press Escape or click outside to close. Do not download or share identity documents outside approved review workflows.</p>
      </div>
    </div>
  );
}
