import { RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function UpdateAppPrompt() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    let disposed = false;
    const watchRegistration = (registration: ServiceWorkerRegistration) => {
      const checkForUpdate = () => {
        if (registration.waiting && navigator.serviceWorker.controller) setWaitingWorker(registration.waiting);
      };
      checkForUpdate();
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (!disposed && worker.state === "installed" && navigator.serviceWorker.controller) setWaitingWorker(worker);
        });
      });
      const timer = window.setInterval(() => void registration.update(), 60_000);
      return () => window.clearInterval(timer);
    };
    const cleanupPromise = navigator.serviceWorker.ready.then(watchRegistration);
    return () => { disposed = true; void cleanupPromise; };
  }, []);

  const updateNow = () => {
    if (!waitingWorker) return;
    const onControllerChange = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange, { once: true });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  if (!waitingWorker || dismissed) return null;
  return <div className="fixed inset-x-4 bottom-4 z-[60] sm:left-auto sm:max-w-sm"><Card className="border-cyan-300/25 bg-[#101522]/95 p-4 shadow-2xl backdrop-blur-xl"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-200"><RefreshCw className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold text-white">New TRILLIONER LINK update</p><p className="mt-1 text-sm text-slate-400">A newer version is ready. Update now to use the latest features.</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={updateNow} className="bg-cyan-400 text-slate-950 hover:bg-cyan-300">Update now</Button><Button variant="outline" onClick={() => setDismissed(true)} className="border-white/15 bg-transparent text-white">Later</Button></div></div><button aria-label="Close update prompt" onClick={() => setDismissed(true)} className="rounded-full p-1 text-slate-500 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button></div></Card></div>;
}
