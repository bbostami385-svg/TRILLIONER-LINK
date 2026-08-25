import React from "react";
import { AlertCircle, CheckCircle2, Clock3, FileText, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const statusCopy = {
  pending: { label: "Under review", className: "text-amber-700", icon: Clock3 },
  approved: { label: "Approved", className: "text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Needs resubmission", className: "text-rose-700", icon: ShieldAlert },
} as const;

export function KycStatusHistory() {
  const status = trpc.kyc.getKYCStatus.useQuery(undefined, { retry: false });
  const history = trpc.kyc.getKYCHistory.useQuery(undefined, { retry: false });
  const isLoading = status.isLoading || history.isLoading;
  const hasError = status.error || history.error;

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-amber-600" /> Identity verification history</CardTitle>
        <CardDescription>KYC is separate from human verification and is used only for monetization and payouts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <div className="space-y-2" aria-label="Loading KYC history"><div className="h-10 animate-pulse rounded-lg bg-slate-100" /><div className="h-14 animate-pulse rounded-lg bg-slate-100" /></div>}
        {hasError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>KYC details are temporarily unavailable. Please refresh and try again.</AlertDescription></Alert>}
        {!isLoading && !hasError && (
          <>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Current status</p><p className="mt-1 text-lg font-semibold text-amber-950">{status.data?.status === "approved" ? "Approved" : status.data?.status === "pending" ? "Under review" : status.data?.status === "rejected" ? "Needs resubmission" : "Not submitted"}</p></div>
                {status.data?.documentType && <span className="rounded-full bg-white px-3 py-1 text-xs font-medium capitalize text-amber-800">{status.data.documentType.replace("_", " ")}</span>}
              </div>
              {status.data?.status === "rejected" && status.data.lastDocument?.rejectionReason && <p className="mt-3 text-sm text-rose-800">Reason: {status.data.lastDocument.rejectionReason}</p>}
              {status.data?.verifiedAt && <p className="mt-2 text-xs text-amber-800">Approved on {new Date(status.data.verifiedAt).toLocaleDateString()}</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-slate-900">Submission history</p><span className="text-xs text-slate-500">{history.data?.length ?? 0} submission{history.data?.length === 1 ? "" : "s"}</span></div>
              {history.data?.length ? <div className="space-y-2">{history.data.map((item) => { const copy = statusCopy[item.status as keyof typeof statusCopy]; const Icon = copy?.icon ?? FileText; return <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 p-3"><div className="flex min-w-0 items-start gap-2"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${copy?.className ?? "text-slate-500"}`} /><div className="min-w-0"><p className="font-medium capitalize text-slate-800">{item.documentType.replace("_", " ")}</p><p className="text-xs text-slate-500">Submitted {new Date(item.createdAt).toLocaleString()}</p>{item.rejectionReason && <p className="mt-1 text-xs text-rose-700">{item.rejectionReason}</p>}</div></div><span className={`shrink-0 text-xs font-semibold ${copy?.className ?? "text-slate-600"}`}>{copy?.label ?? item.status}</span></div>; })}</div> : <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">No KYC submissions yet.</p>}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
