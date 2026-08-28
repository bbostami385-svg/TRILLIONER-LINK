import { AlertCircle, CheckCircle2, Circle, Clock3, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";

type StepState = "complete" | "pending" | "needs_action" | "not_started";

export function stateFor(status: string | null | undefined, verified = false): StepState {
  if (verified || status === "approved") return "complete";
  if (status === "pending") return "pending";
  if (status === "rejected") return "needs_action";
  return "not_started";
}

const labels: Record<StepState, { title: string; detail: string }> = {
  complete: { title: "Complete", detail: "This step has been verified." },
  pending: { title: "Under review", detail: "Our trust team is reviewing your submission." },
  needs_action: { title: "Action needed", detail: "Please review the feedback and submit again." },
  not_started: { title: "Not started", detail: "Complete this step when it is requested." },
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "complete") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (state === "pending") return <Clock3 className="h-5 w-5 text-amber-600" />;
  if (state === "needs_action") return <ShieldAlert className="h-5 w-5 text-rose-600" />;
  return <Circle className="h-5 w-5 text-slate-400" />;
}

export function VerificationStatusTracker() {
  const liveness = trpc.humanVerification.getLivenessStatus.useQuery(undefined, { retry: false });
  const history = trpc.humanVerification.getLivenessHistory.useQuery(undefined, { retry: false });
  const kyc = trpc.kyc.getKYCStatus.useQuery(undefined, { retry: false });
  const isLoading = liveness.isLoading || history.isLoading || kyc.isLoading;
  const hasError = liveness.error || history.error || kyc.error;
  const livenessState = stateFor(liveness.data?.lastAttemptStatus, Boolean(liveness.data?.isVerified));
  const kycState = stateFor(kyc.data?.status, Boolean(kyc.data?.isVerified));
  const monetizationState: StepState = kyc.data?.isVerified ? "complete" : kyc.data?.status === "pending" ? "pending" : "not_started";
  const steps = [
    { name: "Age eligibility", state: "complete" as StepState, detail: "TRILLIONER LINK is for people aged 13 and over." },
    { name: "Human liveness", state: livenessState, detail: labels[livenessState].detail },
    { name: "Identity / KYC", state: kycState, detail: kyc.data?.status === "rejected" && kyc.data.lastDocument?.rejectionReason ? `Reason: ${kyc.data.lastDocument.rejectionReason}` : labels[kycState].detail },
    { name: "Monetization access", state: monetizationState, detail: monetizationState === "complete" ? "KYC is approved; monetization eligibility can now be assessed." : "KYC approval is required before payouts or monetization review." },
  ];
  const completed = steps.filter((step) => step.state === "complete").length;
  const attempts = history.data ?? [];
  const approved = attempts.filter((item) => item.status === "approved").length;
  const rejected = attempts.filter((item) => item.status === "rejected").length;
  const rejectionReason = kyc.data?.status === "rejected" ? kyc.data.lastDocument?.rejectionReason : null;
  const kycProgress = kycState === "complete" ? 100 : kycState === "pending" ? 66 : kycState === "needs_action" ? 50 : 0;
  const reminder = livenessState === "needs_action" ? "Your latest human-verification attempt needs attention. Review the rejection reason and submit a new liveness challenge." : livenessState === "not_started" ? "Complete human liveness verification to protect your account before using sensitive creator features." : livenessState === "pending" ? "Your verification is under review. We will notify you when the trust team finishes." : null;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div><CardTitle>Verification status</CardTitle><CardDescription className="mt-1">Keep your account secure without mixing human verification with financial identity checks.</CardDescription></div>
            <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700 shadow-sm">{completed}/{steps.length}</div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {isLoading && <p className="text-sm text-slate-500">Loading your verification status…</p>}
          {hasError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>Some status details are temporarily unavailable. Refresh to try again.</AlertDescription></Alert>}
          {!isLoading && <div className="space-y-4">{steps.map((step, index) => <div key={step.name} className="flex gap-3"><div className="flex flex-col items-center"><StepIcon state={step.state} />{index < steps.length - 1 && <span className="mt-1 h-full min-h-6 w-px bg-slate-200" />}</div><div className="pb-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{step.name}</p><span className={`text-xs font-medium ${step.state === "complete" ? "text-emerald-700" : step.state === "pending" ? "text-amber-700" : step.state === "needs_action" ? "text-rose-700" : "text-slate-500"}`}>{labels[step.state].title}</span></div><p className="mt-1 text-sm text-slate-500">{step.detail}</p></div></div>)}</div>}
        </CardContent>
      </Card>

      {!isLoading && !hasError && <Card className={`border shadow-sm ${kycState === "needs_action" ? "border-rose-200 bg-rose-50/60" : "border-amber-200 bg-amber-50/60"}`}>
        <CardHeader className="pb-3"><CardTitle className="text-base">Identity / KYC stage</CardTitle><CardDescription>Required only for monetization, payouts, and other financial benefits.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3"><span className={`text-sm font-semibold ${kycState === "complete" ? "text-emerald-700" : kycState === "pending" ? "text-amber-700" : kycState === "needs_action" ? "text-rose-700" : "text-slate-600"}`}>{labels[kycState].title}</span><span className="text-xs text-slate-500">{kycProgress}% complete</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-label="KYC verification progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={kycProgress}><div className={`h-full rounded-full transition-all ${kycState === "complete" ? "bg-emerald-500" : kycState === "needs_action" ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${kycProgress}%` }} /></div>
          {rejectionReason && <div className="rounded-lg border border-rose-200 bg-white/80 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-rose-700">Why action is needed</p><p className="mt-1 text-sm text-rose-900">{rejectionReason}</p><p className="mt-2 text-xs text-rose-700">Open the KYC history section below to resubmit corrected documents.</p></div>}
        </CardContent>
      </Card>}

      {reminder && <Alert className="border-indigo-200 bg-indigo-50 text-indigo-950"><ShieldAlert className="h-4 w-4" /><AlertDescription>{reminder}</AlertDescription></Alert>}
      <Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-base">Verification metrics</CardTitle><CardDescription>Private account-level activity, shown only to you.</CardDescription></CardHeader><CardContent className="grid grid-cols-3 gap-3 pt-0"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Attempts</p><p className="mt-1 text-xl font-semibold text-slate-900">{attempts.length}</p></div><div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Approved</p><p className="mt-1 text-xl font-semibold text-emerald-900">{approved}</p></div><div className="rounded-xl bg-rose-50 p-3"><p className="text-xs text-rose-700">Needs action</p><p className="mt-1 text-xl font-semibold text-rose-900">{rejected}</p></div></CardContent></Card>
    </div>
  );
}
