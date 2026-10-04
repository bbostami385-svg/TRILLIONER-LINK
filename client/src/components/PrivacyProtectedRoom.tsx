import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";

export function PrivacyProtectedRoom({ children }: { children: ReactNode }) {
  const [pageHidden, setPageHidden] = useState(false);
  useEffect(() => {
    const onVisibilityChange = () => setPageHidden(document.visibilityState !== "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return <div className="select-none" onContextMenu={(event) => event.preventDefault()} onDragStart={(event) => event.preventDefault()}>
    {pageHidden && <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950 p-6 text-center text-white"><div><ShieldAlert className="mx-auto h-10 w-10 text-amber-300" /><p className="mt-3 font-semibold">Private meeting shield active</p><p className="mt-2 max-w-sm text-sm text-slate-300">The meeting is hidden while this page is not visible. Please return to the meeting to continue.</p></div></div>}
    <div className={pageHidden ? "pointer-events-none opacity-0" : ""}>{children}</div>
  </div>;
}
