import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, FileCheck2, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { validateVerificationImage } from "@/lib/verificationValidation";

type DocumentType = "passport" | "driver_license" | "national_id" | "other";
type SubmissionStep = "form" | "scanning" | "uploading" | "success" | "failed";
type ImageKind = "front" | "back" | "selfie";

export function KYCForm() {
  const [step, setStep] = useState<SubmissionStep>("form");
  const [documentType, setDocumentType] = useState<DocumentType>("passport");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const scanKYC = trpc.kyc.scanKYCDocument.useMutation();
  const submitKYC = trpc.kyc.submitKYCDocument.useMutation();

  const setImage = (kind: ImageKind, value: string) => {
    if (kind === "front") setFrontImage(value);
    else if (kind === "back") setBackImage(value);
    else setSelfieImage(value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, kind: ImageKind) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    const validationError = validateVerificationImage(file);
    if (validationError) { setFieldErrors((current) => ({ ...current, [kind]: validationError })); return; }
    setFieldErrors((current) => ({ ...current, [kind]: "" }));
    const reader = new FileReader();
    reader.onerror = () => setFieldErrors((current) => ({ ...current, [kind]: "This image could not be read. Please try another file." }));
    reader.onload = async () => {
      const imageData = String(reader.result ?? "");
      setImage(kind, imageData);
      if (kind !== "front") return;
      setStep("scanning");
      setScanMessage("Checking the document image for optional field suggestions…");
      try {
        const result = await scanKYC.mutateAsync({ documentType, imageUrl: imageData });
        const fields = result.extractedFields;
        if (fields.fullName) setFullName(fields.fullName);
        if (fields.dateOfBirth) setDateOfBirth(fields.dateOfBirth);
        if (fields.documentNumber) setDocumentNumber(fields.documentNumber);
        if (fields.expiryDate) setExpiryDate(fields.expiryDate);
        setScanMessage(result.status === "completed" ? "Suggestions added. Review every field against your document before submitting." : result.note);
      } catch {
        setScanMessage("Automatic scanning is unavailable right now. You can continue by entering the fields manually.");
      } finally {
        setStep("form");
      }
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!frontImage) next.front = "Upload the front of your document.";
    if (!selfieImage) next.selfie = "Upload a clear selfie with your document.";
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) next.dateOfBirth = "Use a valid date.";
    if (expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) next.expiryDate = "Use a valid date.";
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !frontImage || !selfieImage) return;
    setLoadingState(true);
    try {
      await submitKYC.mutateAsync({
        documentType,
        frontImageUrl: frontImage,
        backImageUrl: backImage || undefined,
        selfieImageUrl: selfieImage,
        metadata: {
          submittedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
          aiPrefill: { fullName: fullName || null, dateOfBirth: dateOfBirth || null, documentNumberLast4: documentNumber.slice(-4) || null, expiryDate: expiryDate || null },
        },
      });
      setStep("success");
    } catch (submissionError) {
      setStep("failed");
      setError(submissionError instanceof Error ? submissionError.message : "We could not submit your documents. Please try again.");
    } finally {
      setLoadingState(false);
    }
  };

  const [loading, setLoadingState] = useState(false);
  const reset = () => { setStep("form"); setError(null); setFieldErrors({}); setFrontImage(null); setBackImage(null); setSelfieImage(null); setScanMessage(null); };

  if (step === "success") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" /><CardTitle>KYC Submitted Successfully!</CardTitle><CardDescription>Your documents are under review.</CardDescription></CardHeader><CardContent className="space-y-4"><Alert className="border-green-200 bg-green-50 text-green-900"><FileCheck2 className="h-4 w-4" /><AlertDescription>We will notify you when the review status changes. AI suggestions never replace manual review.</AlertDescription></Alert><Button onClick={() => { window.location.href = "/"; }} className="w-full">Go to Home</Button></CardContent></Card>;
  if (step === "failed") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-600" /><CardTitle>Submission Failed</CardTitle><CardDescription>Review the message and try again.</CardDescription></CardHeader><CardContent className="space-y-4">{error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}<Button onClick={reset} className="w-full">Try Again</Button></CardContent></Card>;
  if (step === "scanning" || step === "uploading") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-blue-50"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div><CardTitle>{step === "scanning" ? "Checking document" : "Uploading documents"}</CardTitle><CardDescription>{step === "scanning" ? "Preparing optional suggestions. No decision is being made." : "Securely submitting your files. Please keep this page open."}</CardDescription></CardHeader><CardContent><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-blue-600" /></div></CardContent></Card>;

  const uploadBox = (kind: ImageKind, label: string, image: string | null, optional = false) => <div className="space-y-2"><label className="text-sm font-medium">{label}{optional ? " (Optional)" : ""}</label><div className={`rounded-lg border-2 border-dashed p-6 text-center ${fieldErrors[kind] ? "border-red-400 bg-red-50/40" : "border-gray-300"}`}>{image ? <div className="space-y-2"><img src={image} alt={label} className="h-40 w-full rounded object-cover" /><label className="block"><Button variant="outline" className="w-full" asChild><span><Upload className="mr-2 h-4 w-4" />Change</span></Button><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageUpload(event, kind)} className="hidden" /></label></div> : <label className="block cursor-pointer"><FileText className="mx-auto h-8 w-8 text-gray-400" /><p className="mt-2 text-sm text-gray-600">Click to upload {label.toLowerCase()}</p><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleImageUpload(event, kind)} className="hidden" /></label>}</div>{fieldErrors[kind] && <p className="text-xs text-red-600">{fieldErrors[kind]}</p>}</div>;

  return <Card className="mx-auto w-full max-w-2xl"><CardHeader><CardTitle>KYC Verification</CardTitle><CardDescription>Submit your identity documents to unlock monetization features.</CardDescription></CardHeader><CardContent className="space-y-6">{error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}{scanMessage && <Alert className="border-indigo-200 bg-indigo-50 text-indigo-950"><Sparkles className="h-4 w-4" /><AlertDescription>{scanKYC.isPending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{scanMessage}</AlertDescription></Alert>}<div className="space-y-2"><label className="text-sm font-medium">Document Type</label><select value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="passport">Passport</option><option value="driver_license">Driver License</option><option value="national_id">National ID</option><option value="other">Other</option></select></div><div className="grid gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:grid-cols-2"><div className="sm:col-span-2"><p className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><Sparkles className="h-4 w-4" />AI-assisted document details</p><p className="mt-1 text-xs text-indigo-800">Suggestions are editable and advisory only. A trained reviewer makes the final decision.</p></div><label className="space-y-1 text-sm font-medium">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" placeholder="As shown on document" /></label><label className="space-y-1 text-sm font-medium">Date of birth<input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" />{fieldErrors.dateOfBirth && <span className="text-xs text-red-600">{fieldErrors.dateOfBirth}</span>}</label><label className="space-y-1 text-sm font-medium">Document number<input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" /></label><label className="space-y-1 text-sm font-medium">Expiry date<input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" />{fieldErrors.expiryDate && <span className="text-xs text-red-600">{fieldErrors.expiryDate}</span>}</label></div>{uploadBox("front", "Document Front", frontImage)}{uploadBox("back", "Document Back", backImage, true)}{uploadBox("selfie", "Selfie with Document", selfieImage)}<div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Requirements:</strong><br />Clear, well-lit photos; all document corners visible; face clearly visible; recent document. Do not upload someone else’s document.</div><Button onClick={() => void handleSubmit()} disabled={loading || scanKYC.isPending || !frontImage || !selfieImage} className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting securely…</> : "Submit KYC Documents"}</Button></CardContent></Card>;
}
