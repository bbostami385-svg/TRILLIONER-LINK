import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export default function AdminVerification() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"liveness" | "kyc">("liveness");
  const [workingId, setWorkingId] = useState<number | null>(null);

  const livenessQuery = trpc.humanVerification.getPendingLiveness.useQuery(
    { limit: 25, offset: 0 },
    { enabled: Boolean(user?.role === "admin"), retry: false },
  );
  const kycQuery = trpc.kyc.getPendingKYCSubmissions.useQuery(
    { limit: 25, offset: 0 },
    { enabled: Boolean(user?.role === "admin"), retry: false },
  );
  const approveLiveness = trpc.humanVerification.approveLiveness.useMutation();
  const rejectLiveness = trpc.humanVerification.rejectLiveness.useMutation();
  const approveKyc = trpc.kyc.approveKYC.useMutation();
  const rejectKyc = trpc.kyc.rejectKYC.useMutation();
  const utils = trpc.useUtils();

  const refresh = async () => {
    await Promise.all([livenessQuery.refetch(), kycQuery.refetch()]);
  };

  const reviewLiveness = async (recordId: number, action: "approve" | "reject") => {
    const reason = action === "reject" ? window.prompt("Reason for rejecting this liveness recording:") : undefined;
    if (action === "reject" && !reason?.trim()) return;
    setWorkingId(recordId);
    try {
      if (action === "approve") await approveLiveness.mutateAsync({ recordId });
      else await rejectLiveness.mutateAsync({ recordId, reason: reason!.trim() });
      await refresh();
    } finally {
      setWorkingId(null);
    }
  };

  const reviewKyc = async (userId: number, action: "approve" | "reject") => {
    const reason = action === "reject" ? window.prompt("Reason for rejecting this KYC submission:") : undefined;
    if (action === "reject" && !reason?.trim()) return;
    setWorkingId(userId);
    try {
      if (action === "approve") await approveKyc.mutateAsync({ userId });
      else await rejectKyc.mutateAsync({ userId, rejectionReason: reason!.trim() });
      await refresh();
    } finally {
      setWorkingId(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen grid place-items-center p-6">Loading verification console…</div>;
  }
  if (!user) {
    return <div className="min-h-screen grid place-items-center p-6"><ErrorState message="Please sign in to access the verification console." /></div>;
  }
  if (user.role !== "admin") {
    return <div className="min-h-screen grid place-items-center p-6"><ErrorState message="Administrator access is required to review verifications." /></div>;
  }

  const livenessError = livenessQuery.error?.message;
  const kycError = kycQuery.error?.message;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600"><ShieldCheck className="h-4 w-4" /> Trust & Safety</div>
            <h1 className="text-3xl font-bold tracking-tight">Verification Review</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Review human-liveness submissions separately from identity documents. Approve only when the evidence meets your review policy.</p>
          </div>
          <Button variant="outline" onClick={() => setLocation("/")}>Exit console</Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500">Pending human checks</p><p className="mt-1 text-3xl font-bold">{livenessQuery.data?.total ?? "—"}</p></div><Clock className="h-8 w-8 text-indigo-500" /></CardContent></Card>
          <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500">Pending KYC reviews</p><p className="mt-1 text-3xl font-bold">{kycQuery.data?.total ?? "—"}</p></div><ShieldCheck className="h-8 w-8 text-amber-500" /></CardContent></Card>
        </div>

        <div className="flex gap-2 border-b border-slate-200">
          <Button variant={activeTab === "liveness" ? "default" : "ghost"} onClick={() => setActiveTab("liveness")}>Human verification</Button>
          <Button variant={activeTab === "kyc" ? "default" : "ghost"} onClick={() => setActiveTab("kyc")}>KYC documents</Button>
        </div>

        {activeTab === "liveness" && (
          <Card>
            <CardHeader><CardTitle>Human verification queue</CardTitle><CardDescription>These recordings are for bot prevention, not identity verification.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {livenessError && <ErrorState message={livenessError} />}
              {!livenessError && livenessQuery.isLoading && <p className="text-slate-500">Loading queue…</p>}
              {!livenessError && !livenessQuery.isLoading && livenessQuery.data?.records.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-slate-500">No pending human-verification records.</p>}
              {livenessQuery.data?.records.map((record) => (
                <div key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold">{record.userName || "Unnamed user"}</p>
                      <p className="text-sm text-slate-500">{record.userEmail || "No email"} · Challenge: {record.challengeType}</p>
                      <p className="mt-1 text-xs text-slate-400">Submitted {new Date(record.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm hover:bg-slate-50" href={record.videoUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open evidence</a>
                      <Button disabled={workingId === record.id} onClick={() => reviewLiveness(record.id, "reject")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                      <Button disabled={workingId === record.id} onClick={() => reviewLiveness(record.id, "approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === "kyc" && (
          <Card>
            <CardHeader><CardTitle>KYC review queue</CardTitle><CardDescription>Identity verification is requested only for monetization and payouts.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {kycError && <ErrorState message={kycError} />}
              {!kycError && kycQuery.isLoading && <p className="text-slate-500">Loading queue…</p>}
              {!kycError && !kycQuery.isLoading && kycQuery.data?.documents.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-slate-500">No pending KYC submissions.</p>}
              {kycQuery.data?.documents.map((document) => (
                <div key={document.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="font-semibold">User #{document.userId} · {document.documentType.replace("_", " ")}</p>
                      <p className="mt-1 text-xs text-slate-400">Submitted {new Date(document.createdAt).toLocaleString()}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm">
                        <a className="inline-flex items-center gap-1 text-indigo-600 hover:underline" href={document.frontImageUrl} target="_blank" rel="noreferrer">Front <ExternalLink className="h-3 w-3" /></a>
                        {document.backImageUrl && <a className="inline-flex items-center gap-1 text-indigo-600 hover:underline" href={document.backImageUrl} target="_blank" rel="noreferrer">Back <ExternalLink className="h-3 w-3" /></a>}
                        {document.selfieImageUrl && <a className="inline-flex items-center gap-1 text-indigo-600 hover:underline" href={document.selfieImageUrl} target="_blank" rel="noreferrer">Selfie <ExternalLink className="h-3 w-3" /></a>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={workingId === document.userId} onClick={() => reviewKyc(document.userId, "reject")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                      <Button disabled={workingId === document.userId} onClick={() => reviewKyc(document.userId, "approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
