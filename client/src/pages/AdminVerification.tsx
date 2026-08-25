import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, BarChart3, CheckCircle2, Clock, Download, ExternalLink, Eye, FileText, Filter, ShieldCheck, X, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePreviewModal } from "@/components/ImagePreviewModal";
import { trpc } from "@/lib/trpc";
import { downloadVerificationMetricsCsv, downloadVerificationMetricsPdf, type VerificationMetricsReport } from "@/lib/verificationReport";

type ReviewStatus = "all" | "pending" | "approved" | "rejected";
type ReviewSort = "newest" | "oldest";
type Tab = "liveness" | "kyc";
type RejectionTarget = { type: "liveness" | "kyc"; ids: number[]; label: string } | null;

function ErrorState({ message }: { message: string }) {
  return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{message}</AlertDescription></Alert>;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-rose-100 text-rose-800" };
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold capitalize ${styles[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

function SelectBox({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="space-y-1 text-sm font-medium">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500">{children}</select></label>;
}

export default function AdminVerification() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("liveness");
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [isBulkWorking, setIsBulkWorking] = useState(false);
  const [draftStatus, setDraftStatus] = useState<ReviewStatus>("pending");
  const [draftSort, setDraftSort] = useState<ReviewSort>("newest");
  const [draftSearch, setDraftSearch] = useState("");
  const [draftChallenge, setDraftChallenge] = useState("");
  const [draftDocumentType, setDraftDocumentType] = useState("");
  const [filters, setFilters] = useState({ status: "pending" as ReviewStatus, sort: "newest" as ReviewSort, search: "", challengeType: "", documentType: "" });
  const [selectedLiveness, setSelectedLiveness] = useState<Set<number>>(new Set());
  const [selectedKyc, setSelectedKyc] = useState<Set<number>>(new Set());
  const [preview, setPreview] = useState<{ url: string; label: string } | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<RejectionTarget>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const livenessInput = useMemo(() => ({ limit: 25, offset: 0, status: filters.status, sort: filters.sort, search: filters.search || undefined, challengeType: filters.challengeType ? filters.challengeType as "nod" | "turn_left" | "turn_right" | "blink" : undefined }), [filters]);
  const kycInput = useMemo(() => ({ limit: 25, offset: 0, status: filters.status, sort: filters.sort, search: filters.search || undefined, documentType: filters.documentType ? filters.documentType as "passport" | "driver_license" | "national_id" | "other" : undefined }), [filters]);
  const adminEnabled = Boolean(user?.role === "admin");
  const metricsQuery = trpc.humanVerification.getVerificationMetrics.useQuery(undefined, { enabled: adminEnabled, retry: false, refetchInterval: 30_000 });
  const livenessQuery = trpc.humanVerification.getPendingLiveness.useQuery(livenessInput, { enabled: adminEnabled, retry: false });
  const kycQuery = trpc.kyc.getPendingKYCSubmissions.useQuery(kycInput, { enabled: adminEnabled, retry: false });
  const approveLiveness = trpc.humanVerification.approveLiveness.useMutation();
  const rejectLiveness = trpc.humanVerification.rejectLiveness.useMutation();
  const bulkReviewLiveness = trpc.humanVerification.bulkReviewLiveness.useMutation();
  const approveKyc = trpc.kyc.approveKYC.useMutation();
  const rejectKyc = trpc.kyc.rejectKYC.useMutation();
  const bulkReviewKyc = trpc.kyc.bulkReviewKYC.useMutation();

  const applyFilters = () => {
    setSelectedLiveness(new Set());
    setSelectedKyc(new Set());
    setFilters({ status: draftStatus, sort: draftSort, search: draftSearch.trim(), challengeType: draftChallenge, documentType: draftDocumentType });
  };
  const clearFilters = () => {
    setDraftStatus("pending"); setDraftSort("newest"); setDraftSearch(""); setDraftChallenge(""); setDraftDocumentType(""); setSelectedLiveness(new Set()); setSelectedKyc(new Set());
    setFilters({ status: "pending", sort: "newest", search: "", challengeType: "", documentType: "" });
  };
  const refresh = async () => { await Promise.all([livenessQuery.refetch(), kycQuery.refetch()]); };
  const closeRejection = () => { setRejectionTarget(null); setRejectionReason(""); setRejectionError(null); };

  const reviewLiveness = async (recordId: number, action: "approve" | "reject") => {
    if (action === "reject") { setRejectionTarget({ type: "liveness", ids: [recordId], label: "this liveness submission" }); return; }
    setWorkingId(recordId);
    try { await approveLiveness.mutateAsync({ recordId }); await refresh(); } finally { setWorkingId(null); }
  };
  const reviewKyc = async (userId: number, action: "approve" | "reject") => {
    if (action === "reject") { setRejectionTarget({ type: "kyc", ids: [userId], label: "this KYC submission" }); return; }
    setWorkingId(userId);
    try { await approveKyc.mutateAsync({ userId }); await refresh(); } finally { setWorkingId(null); }
  };
  const submitRejection = async () => {
    const reason = rejectionReason.trim();
    if (reason.length < 3) { setRejectionError("Please provide at least 3 characters explaining the rejection."); return; }
    if (!rejectionTarget) return;
    setIsBulkWorking(rejectionTarget.ids.length > 1);
    try {
      if (rejectionTarget.type === "liveness") {
        if (rejectionTarget.ids.length === 1) await rejectLiveness.mutateAsync({ recordId: rejectionTarget.ids[0], reason });
        else await bulkReviewLiveness.mutateAsync({ recordIds: rejectionTarget.ids, action: "reject", reason });
      } else {
        if (rejectionTarget.ids.length === 1) await rejectKyc.mutateAsync({ userId: rejectionTarget.ids[0], rejectionReason: reason });
        else await bulkReviewKyc.mutateAsync({ documentIds: rejectionTarget.ids, action: "reject", reason });
      }
      closeRejection(); setSelectedLiveness(new Set()); setSelectedKyc(new Set()); await refresh();
    } finally { setIsBulkWorking(false); }
  };
  const bulkApprove = async (type: Tab) => {
    setIsBulkWorking(true);
    try {
      if (type === "liveness") await bulkReviewLiveness.mutateAsync({ recordIds: Array.from(selectedLiveness), action: "approve" });
      else await bulkReviewKyc.mutateAsync({ documentIds: Array.from(selectedKyc), action: "approve" });
      setSelectedLiveness(new Set()); setSelectedKyc(new Set()); await refresh();
    } finally { setIsBulkWorking(false); }
  };
  const openBulkReject = (type: Tab) => {
    const ids = type === "liveness" ? Array.from(selectedLiveness) : Array.from(selectedKyc);
    if (ids.length) setRejectionTarget({ type, ids, label: `${ids.length} selected ${type === "liveness" ? "liveness submissions" : "KYC submissions"}` });
  };
  const toggleLiveness = (id: number) => setSelectedLiveness((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleKyc = (id: number) => setSelectedKyc((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const livenessPendingIds = (livenessQuery.data?.records ?? []).filter((record) => record.status === "pending").map((record) => record.id);
  const kycPendingIds = (kycQuery.data?.documents ?? []).filter((document) => document.status === "pending").map((document) => document.id);
  const allLivenessSelected = livenessPendingIds.length > 0 && livenessPendingIds.every((id) => selectedLiveness.has(id));
  const allKycSelected = kycPendingIds.length > 0 && kycPendingIds.every((id) => selectedKyc.has(id));
  const metrics = metricsQuery.data as VerificationMetricsReport | undefined;
  const exportMetrics = (format: "csv" | "pdf") => {
    if (!metrics) return;
    if (format === "csv") downloadVerificationMetricsCsv(metrics);
    else downloadVerificationMetricsPdf(metrics);
  };

  if (authLoading) return <div className="min-h-screen grid place-items-center p-6">Loading verification console…</div>;
  if (!user) return <div className="min-h-screen grid place-items-center p-6"><ErrorState message="Please sign in to access the verification console." /></div>;
  if (user.role !== "admin") return <div className="min-h-screen grid place-items-center p-6"><ErrorState message="Administrator access is required to review verifications." /></div>;

  const livenessError = livenessQuery.error?.message;
  const kycError = kycQuery.error?.message;
  return <>
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-indigo-600"><ShieldCheck className="h-4 w-4" /> Trust & Safety</div><h1 className="text-3xl font-bold tracking-tight">Verification Review</h1><p className="mt-2 max-w-2xl text-slate-600">Review liveness and identity evidence separately. Select pending records for a faster bulk decision.</p></div><Button variant="outline" onClick={() => setLocation("/")}>Exit console</Button></header>
        <div className="grid gap-4 sm:grid-cols-2"><Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500">Matching human checks</p><p className="mt-1 text-3xl font-bold">{livenessQuery.data?.total ?? "—"}</p></div><Clock className="h-8 w-8 text-indigo-500" /></CardContent></Card><Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-slate-500">Matching KYC reviews</p><p className="mt-1 text-3xl font-bold">{kycQuery.data?.total ?? "—"}</p></div><ShieldCheck className="h-8 w-8 text-amber-500" /></CardContent></Card></div>
        <Card><CardHeader className="pb-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-indigo-600" /> Verification metrics</CardTitle><CardDescription>All persisted review records, separate from the active filters below. Refreshes every 30 seconds.</CardDescription></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!metrics || metricsQuery.isFetching} onClick={() => exportMetrics("csv")}><Download className="mr-2 h-4 w-4" />CSV</Button><Button variant="outline" size="sm" disabled={!metrics || metricsQuery.isFetching} onClick={() => exportMetrics("pdf")}><FileText className="mr-2 h-4 w-4" />PDF</Button></div></div></CardHeader><CardContent>{metricsQuery.error ? <ErrorState message={metricsQuery.error.message} /> : metricsQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2"><div className="h-24 animate-pulse rounded-xl bg-slate-100" /><div className="h-24 animate-pulse rounded-xl bg-slate-100" /></div> : <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-indigo-950">Human liveness</p><span className="text-2xl font-bold text-indigo-700">{metricsQuery.data?.liveness.total ?? 0}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Pending</p><p className="mt-1 text-lg font-bold text-amber-700">{metricsQuery.data?.liveness.pending ?? 0}</p></div><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Approved</p><p className="mt-1 text-lg font-bold text-emerald-700">{metricsQuery.data?.liveness.approved ?? 0}</p></div><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Rejected</p><p className="mt-1 text-lg font-bold text-rose-700">{metricsQuery.data?.liveness.rejected ?? 0}</p></div></div></div><div className="rounded-xl border border-amber-100 bg-amber-50 p-4"><div className="flex items-center justify-between"><p className="font-semibold text-amber-950">Identity / KYC</p><span className="text-2xl font-bold text-amber-700">{metricsQuery.data?.kyc.total ?? 0}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Pending</p><p className="mt-1 text-lg font-bold text-amber-700">{metricsQuery.data?.kyc.pending ?? 0}</p></div><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Approved</p><p className="mt-1 text-lg font-bold text-emerald-700">{metricsQuery.data?.kyc.approved ?? 0}</p></div><div className="rounded-lg bg-white/70 p-2"><p className="text-slate-500">Rejected</p><p className="mt-1 text-lg font-bold text-rose-700">{metricsQuery.data?.kyc.rejected ?? 0}</p></div></div></div></div>}</CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5 text-indigo-600" /> Filter and sort reviews</CardTitle><CardDescription>Search by user name or email. Use the status filter to review pending, approved, rejected, or all records.</CardDescription></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"><SelectBox label="Status" value={draftStatus} onChange={(value) => setDraftStatus(value as ReviewStatus)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All statuses</option></SelectBox><label className="space-y-1 text-sm font-medium">Search user<input value={draftSearch} onChange={(event) => setDraftSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && applyFilters()} placeholder="Name or email" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" /></label><SelectBox label="Date order" value={draftSort} onChange={(value) => setDraftSort(value as ReviewSort)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option></SelectBox>{activeTab === "liveness" ? <SelectBox label="Challenge" value={draftChallenge} onChange={setDraftChallenge}><option value="">All challenges</option><option value="nod">Nod</option><option value="turn_left">Turn left</option><option value="turn_right">Turn right</option><option value="blink">Blink</option></SelectBox> : <SelectBox label="Document type" value={draftDocumentType} onChange={setDraftDocumentType}><option value="">All document types</option><option value="passport">Passport</option><option value="driver_license">Driver license</option><option value="national_id">National ID</option><option value="other">Other</option></SelectBox>}<div className="flex items-end gap-2"><Button onClick={applyFilters} className="flex-1">Apply</Button><Button onClick={clearFilters} variant="outline">Reset</Button></div></div><p className="mt-3 text-xs text-slate-500">Active: <span className="font-medium capitalize">{filters.status}</span> · {filters.sort === "newest" ? "Newest first" : "Oldest first"}{filters.search ? ` · “${filters.search}”` : ""}</p></CardContent></Card>
        <div className="flex gap-2 border-b border-slate-200"><Button variant={activeTab === "liveness" ? "default" : "ghost"} onClick={() => setActiveTab("liveness")}>Human verification</Button><Button variant={activeTab === "kyc" ? "default" : "ghost"} onClick={() => setActiveTab("kyc")}>KYC documents</Button></div>

        {activeTab === "liveness" && <Card><CardHeader><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><CardTitle>Human verification queue</CardTitle><CardDescription>These recordings confirm a live person is present; they are not identity documents.</CardDescription></div>{selectedLiveness.size > 0 && <div className="flex flex-wrap gap-2"><Button disabled={isBulkWorking} onClick={() => bulkApprove("liveness")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve {selectedLiveness.size}</Button><Button disabled={isBulkWorking} onClick={() => openBulkReject("liveness")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject {selectedLiveness.size}</Button></div>}</div></CardHeader><CardContent className="space-y-4">{livenessError && <ErrorState message={livenessError} />}{!livenessError && livenessQuery.isLoading && <p className="text-slate-500">Loading queue…</p>}{!livenessError && !livenessQuery.isLoading && livenessQuery.data?.records.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-slate-500">No records match the current filters.</p>}{livenessPendingIds.length > 0 && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={allLivenessSelected} onChange={() => setSelectedLiveness(allLivenessSelected ? new Set() : new Set(livenessPendingIds))} />Select all pending records on this page</label>}{livenessQuery.data?.records.map((record) => <div key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3">{record.status === "pending" && <input aria-label={`Select liveness record ${record.id}`} type="checkbox" checked={selectedLiveness.has(record.id)} onChange={() => toggleLiveness(record.id)} className="mt-1 h-4 w-4" />}<div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{record.userName || "Unnamed user"}</p><StatusPill status={record.status} /></div><p className="text-sm text-slate-500">{record.userEmail || "No email"} · Challenge: {record.challengeType}</p><p className="mt-1 text-xs text-slate-400">Submitted {new Date(record.createdAt).toLocaleString()}</p></div></div><div className="flex flex-wrap gap-2"><a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm hover:bg-slate-50" href={record.videoUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open evidence</a>{record.status === "pending" && <><Button disabled={workingId === record.id} onClick={() => reviewLiveness(record.id, "reject")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button disabled={workingId === record.id} onClick={() => reviewLiveness(record.id, "approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button></>}</div></div></div>)}</CardContent></Card>}

        {activeTab === "kyc" && <Card><CardHeader><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><CardTitle>KYC review queue</CardTitle><CardDescription>Identity verification is requested only for monetization and payouts. Click any image to inspect it securely.</CardDescription></div>{selectedKyc.size > 0 && <div className="flex flex-wrap gap-2"><Button disabled={isBulkWorking} onClick={() => bulkApprove("kyc")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve {selectedKyc.size}</Button><Button disabled={isBulkWorking} onClick={() => openBulkReject("kyc")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject {selectedKyc.size}</Button></div>}</div></CardHeader><CardContent className="space-y-4">{kycError && <ErrorState message={kycError} />}{!kycError && kycQuery.isLoading && <p className="text-slate-500">Loading queue…</p>}{!kycError && !kycQuery.isLoading && kycQuery.data?.documents.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-slate-500">No documents match the current filters.</p>}{kycPendingIds.length > 0 && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={allKycSelected} onChange={() => setSelectedKyc(allKycSelected ? new Set() : new Set(kycPendingIds))} />Select all pending records on this page</label>}{kycQuery.data?.documents.map((document) => <div key={document.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="flex items-start gap-3">{document.status === "pending" && <input aria-label={`Select KYC document ${document.id}`} type="checkbox" checked={selectedKyc.has(document.id)} onChange={() => toggleKyc(document.id)} className="mt-1 h-4 w-4" />}<div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{document.userName || `User #${document.userId}`} · {document.documentType.replace("_", " ")}</p><StatusPill status={document.status} /></div><p className="text-sm text-slate-500">{document.userEmail || "No email"}</p><p className="mt-1 text-xs text-slate-400">Submitted {new Date(document.createdAt).toLocaleString()}</p><div className="mt-3 flex flex-wrap gap-2 text-sm"><Button variant="outline" className="h-9" onClick={() => setPreview({ url: document.frontImageUrl, label: "Front of identity document" })}><Eye className="mr-1 h-3 w-3" />Preview front</Button>{document.backImageUrl && <Button variant="outline" className="h-9" onClick={() => setPreview({ url: document.backImageUrl!, label: "Back of identity document" })}><Eye className="mr-1 h-3 w-3" />Preview back</Button>}{document.selfieImageUrl && <Button variant="outline" className="h-9" onClick={() => setPreview({ url: document.selfieImageUrl!, label: "Selfie with identity document" })}><Eye className="mr-1 h-3 w-3" />Preview selfie</Button>}</div></div></div><div className="flex flex-wrap gap-2">{document.status === "pending" && <><Button disabled={workingId === document.userId} onClick={() => reviewKyc(document.userId, "reject")} variant="outline" className="text-red-600"><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button disabled={workingId === document.userId} onClick={() => reviewKyc(document.userId, "approve")}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button></>}</div></div></div>)}</CardContent></Card>}
      </div>
    </main>
    <ImagePreviewModal open={Boolean(preview)} imageUrl={preview?.url ?? null} label={preview?.label ?? "Verification evidence"} onClose={() => setPreview(null)} />
    {rejectionTarget && <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="rejection-title"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 id="rejection-title" className="text-xl font-bold text-slate-950">Reject {rejectionTarget.label}</h2><p className="mt-1 text-sm text-slate-600">This reason will be saved with the review and shown to the user when applicable.</p></div><Button variant="ghost" size="icon" aria-label="Close rejection dialog" onClick={closeRejection}><X className="h-5 w-5" /></Button></div><label className="mt-5 block text-sm font-medium text-slate-800">Rejection reason<textarea value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); setRejectionError(null); }} rows={5} maxLength={1000} placeholder="Explain what needs to be corrected…" className="mt-2 w-full resize-y rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-indigo-500" /></label>{rejectionError && <p className="mt-2 text-sm text-red-600">{rejectionError}</p>}<div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={closeRejection}>Cancel</Button><Button disabled={isBulkWorking} onClick={submitRejection} className="bg-rose-600 hover:bg-rose-700">{isBulkWorking ? "Saving…" : "Confirm rejection"}</Button></div></div></div>}
  </>;
}
