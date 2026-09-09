import { CheckCircle2, Circle, Clock3, ShieldAlert } from "lucide-react";
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
  const kyc = trpc.kyc.getKYCStatus.useQuery(undefined, { retry: false });
  const isLoading = liveness.isLoading || kyc.isLoading;
  const hasError = liveness.error || kyc.error;
  const ageState: StepState = "complete";
  const livenessState = stateFor(liveness.data?.lastAttemptStatus, Boolean(liveness.data?.isVerified));
  const kycState = stateFor(kyc.data?.status, Boolean(kyc.data?.isVerified));
  const monetizationState: StepState = kyc.data?.isVerified ? "complete" : kyc.data?.status === "pending" ? "pending" : "not_started";
  const steps = [
    { name: "Age eligibility", state: ageState, detail: "TRILLIONER LINK is for people aged 13 and over." },
    { name: "Human liveness", state: livenessState, detail: labels[livenessState].detail },
    { name: "Identity / KYC", state: kycState, detail: kyc.data?.status === "rejected" && kyc.data.lastDocument?.rejectionReason ? `Reason: ${kyc.data.lastDocument.rejectionReason}` : labels[kycState].detail },
    { name: "Monetization access", state: monetizationState, detail: monetizationState === "complete" ? "KYC is approved; monetization eligibility can now be assessed." : "KYC approval is required before payouts or monetization review." },
  ];
  const completed = steps.filter((step) => step.state === "complete").length;

  return <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="bg-gradient-to-r from-indigo-50 to-slate-50"><div className="flex items-start justify-between gap-4"><div><CardTitle>Verification status</CardTitle><CardDescription className="mt-1">Keep your account secure without mixing human verification with financial identity checks.</CardDescription></div><div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700 shadow-sm">{completed}/{steps.length}</div></div></CardHeader><CardContent className="p-5">{isLoading && <p className="text-sm text-slate-500">Loading your verification status…</p>}{hasError && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertDescription>Some status details are temporarily unavailable. Refresh to try again.</AlertDescription></Alert>}{!isLoading && <div className="space-y-4">{steps.map((step, index) => <div key={step.name} className="flex gap-3"><div className="flex flex-col items-center"><StepIcon state={step.state} />{index < steps.length - 1 && <span className="mt-1 h-full min-h-6 w-px bg-slate-200" />}</div><div className="pb-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{step.name}</p><span className={`text-xs font-medium ${step.state === "complete" ? "text-emerald-700" : step.state === "pending" ? "text-amber-700" : step.state === "needs_action" ? "text-rose-700" : "text-slate-500"}`}>{labels[step.state].title}</span></div><p className="mt-1 text-sm text-slate-500">{step.detail}</p></div></div>)}</div>}</CardContent></Card>;
}
