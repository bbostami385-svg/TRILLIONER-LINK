import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    AndroidSecureScreen?: { enable: () => void; disable?: () => void };
    webkit?: { messageHandlers?: { secureScreen?: { postMessage: (message: unknown) => void } } };
  }
}

export function CaptureProtection({ children, showStatus = false }: { children: ReactNode; showStatus?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [nativeSecure, setNativeSecure] = useState(false);
  useEffect(() => {
    const android = window.AndroidSecureScreen;
    const ios = window.webkit?.messageHandlers?.secureScreen;
    if (android?.enable) { android.enable(); setNativeSecure(true); }
    else if (ios) { ios.postMessage({ enabled: true }); setNativeSecure(true); }
    const onVisibilityChange = () => setHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (android?.disable) android.disable();
      else if (ios) ios.postMessage({ enabled: false });
    };
  }, []);
  return <div className="select-none" onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}>
    {showStatus && <div className="mb-3 flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"><ShieldCheck className="h-4 w-4" />{nativeSecure ? "Native capture protection active" : "Browser protection active; device-level screenshot blocking requires the native app"}</div>}
    {hidden && <div className="fixed inset-0 z-[100] grid place-items-center bg-black p-6 text-center text-white"><div><ShieldCheck className="mx-auto h-10 w-10 text-cyan-300" /><p className="mt-3 font-semibold">Protected content hidden</p><p className="mt-2 text-sm text-slate-300">Return to the app to continue viewing.</p></div></div>}
    <div className={hidden ? "pointer-events-none opacity-0" : ""}>{children}</div>
  </div>;
}
