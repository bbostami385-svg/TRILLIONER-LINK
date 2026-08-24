import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallEvent(event as InstallPromptEvent); setVisible(true); };
    const onInstalled = () => { setInstallEvent(null); setVisible(false); toast.success("TRILLIONER LINK is installed on this device."); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!visible) return null;

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
    if (choice.outcome === "dismissed") toast.message("You can install TRILLIONER LINK later from your browser menu.");
  };

  return <div className="fixed inset-x-4 bottom-4 z-50 sm:left-auto sm:max-w-sm"><Card className="border-cyan-300/25 bg-[#101522]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-200"><Download className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-white">Install TRILLIONER LINK</p><p className="mt-1 text-sm text-slate-400">Use it like an app from your home screen—no Play Store listing required.</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => void install()} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Install app</Button><Button variant="outline" onClick={() => { setVisible(false); setInstallEvent(null); }} className="border-white/15 bg-transparent text-white">Not now</Button></div></div><button aria-label="Close install prompt" onClick={() => { setVisible(false); setInstallEvent(null); }} className="rounded-full p-1 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button></div></Card></div>;
}
