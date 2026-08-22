import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, Clock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgeVerificationForm } from "@/components/AgeVerificationForm";
import { LivenessVerification } from "@/components/LivenessVerification";
import { trpc } from "@/lib/trpc";

type Step = "age" | "human" | "complete";

export default function VerificationFlowPage() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("age");
  const [age, setAge] = useState<number | null>(null);
  const ageStatus = trpc.ageVerification.getAgeVerificationStatus.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const humanStatus = trpc.humanVerification.isHumanVerified.useQuery(undefined, { enabled: Boolean(user), retry: false });

  useEffect(() => {
    if (!user) return;
    if (ageStatus.data?.ageVerified && humanStatus.data?.isVerified) setStep("complete");
    else if (ageStatus.data?.ageVerified) setStep("human");
  }, [user, ageStatus.data, humanStatus.data]);

  if (authLoading) return <div className="min-h-screen grid place-items-center p-6">Loading verification…</div>;
  if (!user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 p-6">
        <Card className="w-full max-w-md"><CardHeader><CardTitle>Sign in required</CardTitle><CardDescription>Sign in before completing account verification.</CardDescription></CardHeader><CardContent><Button className="w-full" onClick={() => setLocation("/login")}>Go to sign in</Button></CardContent></Card>
      </div>
    );
  }

  const ageError = ageStatus.error?.message;
  const humanError = humanStatus.error?.message;
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-white/10"><ShieldCheck className="h-7 w-7 text-indigo-300" /></div>
          <h1 className="text-3xl font-bold tracking-tight">Secure account verification</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">We use age eligibility and human-liveness checks to keep automated accounts out. Identity/KYC is a separate step used only for monetization and payouts.</p>
        </header>

        <div className="grid gap-3 sm:grid-cols-3">
          {(["age", "human", "complete"] as const).map((item, index) => (
            <div key={item} className={`rounded-xl border p-4 ${step === item ? "border-indigo-300 bg-indigo-500/20" : "border-white/10 bg-white/5"}`}>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</p>
              <p className="mt-1 font-semibold">{item === "age" ? "Age eligibility" : item === "human" ? "Human liveness" : "Account ready"}</p>
            </div>
          ))}
        </div>

        {(ageError || humanError) && (
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{ageError || humanError}</AlertDescription></Alert>
        )}

        {step === "age" && (
          <AgeVerificationForm
            onSuccess={(result) => {
              setAge(result.age);
              setStep("human");
              void ageStatus.refetch();
            }}
            onError={() => undefined}
          />
        )}

        {step === "human" && (
          <div className="space-y-4">
            <Card className="border-indigo-300/20 bg-white text-slate-950">
              <CardHeader><CardTitle>Human verification</CardTitle><CardDescription>Follow the on-screen movement prompts. This confirms that a real person is creating the account; it does not identify you.</CardDescription></CardHeader>
              <CardContent><LivenessVerification /></CardContent>
            </Card>
            <Alert className="border-white/10 bg-white/5 text-slate-200"><Clock className="h-4 w-4" /><AlertDescription>Recordings are submitted for secure review. KYC documents are not requested in this flow.</AlertDescription></Alert>
          </div>
        )}

        {step === "complete" && (
          <Card className="border-emerald-300/30 bg-white text-slate-950">
            <CardHeader className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" /><CardTitle className="mt-3">Verification complete</CardTitle><CardDescription>{age ? `Age ${age} confirmed and human verification completed.` : "Age and human verification completed."}</CardDescription></CardHeader>
            <CardContent><Button className="w-full" onClick={() => setLocation("/feed")}>Continue to TRILLIONER LINK</Button></CardContent>
          </Card>
        )}

        <div className="text-center"><Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => setLocation("/")}>Return home</Button></div>
      </div>
    </main>
  );
}
