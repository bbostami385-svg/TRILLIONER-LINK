import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Upload, FileText, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type DocumentType = "passport" | "driver_license" | "national_id" | "other";
type SubmissionStep = "form" | "uploading" | "success" | "failed";

export function KYCForm({ isResubmission = false, onComplete }: { isResubmission?: boolean; onComplete?: () => void }) {
  const [step, setStep] = useState<SubmissionStep>("form");
  const [documentType, setDocumentType] = useState<DocumentType>("passport");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const submitKYCMutation = trpc.kyc.submitKYCDocument.useMutation();
  const scanKYCMutation = trpc.kyc.scanKYCDocument.useMutation();
  const retryKYCMutation = trpc.kyc.retryKYCSubmission.useMutation();
  const activeMutation = isResubmission ? retryKYCMutation : submitKYCMutation;

  const scanFrontDocument = async (imageData: string) => {
    setScanMessage("Scanning the front of your document…");
    try {
      const result = await scanKYCMutation.mutateAsync({ documentType, imageUrl: imageData });
      const fields = result.extractedFields;
      if (fields.fullName) setFullName(fields.fullName);
      if (fields.dateOfBirth) setDateOfBirth(fields.dateOfBirth);
      if (fields.documentNumber) setDocumentNumber(fields.documentNumber);
      if (fields.expiryDate) setExpiryDate(fields.expiryDate);
      setScanMessage(result.status === "completed" ? "Suggested fields added. Check every value against the document before submitting." : result.note);
    } catch {
      setScanMessage("Automatic scanning was unavailable. You can enter the fields manually and continue.");
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        if (type === "front") {
          setFrontImage(imageData);
          void scanFrontDocument(imageData);
        } else if (type === "back") setBackImage(imageData);
        else setSelfieImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!frontImage || !selfieImage) {
      setError("Please upload front image and selfie");
      return;
    }

    setLoading(true);
    setStep("uploading");
    setError(null);

    try {
      await activeMutation.mutateAsync({
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
    } catch (err: any) {
      setStep("failed");
      setError(err.message || "Failed to submit KYC documents");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("form");
    setFrontImage(null);
    setBackImage(null);
    setSelfieImage(null);
    setError(null);
    setScanMessage(null);
    setFullName("");
    setDateOfBirth("");
    setDocumentNumber("");
    setExpiryDate("");
  };

  if (step === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle>KYC Submitted Successfully!</CardTitle>
          <CardDescription>Your documents are under review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✓ Documents submitted successfully
              <br />
              ✓ Review typically takes 24-48 hours
              <br />
              ✓ You'll receive a notification when approved
            </p>
          </div>
          <Button onClick={() => onComplete ? onComplete() : window.location.href = "/"} className="w-full">
            {onComplete ? "Back to Profile" : "Go to Home"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "failed") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
          <CardTitle>Submission Failed</CardTitle>
          <CardDescription>Please try again</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "uploading") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Uploading Documents</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin">
            <Upload className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>KYC Verification</CardTitle>
        <CardDescription>
          Submit your identity documents to unlock monetization features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Document Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="passport">Passport</option>
            <option value="driver_license">Driver License</option>
            <option value="national_id">National ID</option>
            <option value="other">Other</option>
          </select>
        </div>

        {scanMessage && <Alert className="border-indigo-200 bg-indigo-50 text-indigo-950"><Sparkles className="h-4 w-4" /><AlertDescription>{scanKYCMutation.isPending && <Loader2 className="mr-1 inline h-3 w-3 animate-spin" />}{scanMessage}</AlertDescription></Alert>}

        <div className="grid gap-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="flex items-center gap-2 text-sm font-semibold text-indigo-950"><Sparkles className="h-4 w-4" />AI-assisted document details</p><p className="mt-1 text-xs text-indigo-800">These are suggestions only. Review and correct them; they never approve your KYC.</p></div>
          <label className="space-y-1 text-sm font-medium">Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" placeholder="As shown on document" /></label>
          <label className="space-y-1 text-sm font-medium">Date of birth<input type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" /></label>
          <label className="space-y-1 text-sm font-medium">Document number<input value={documentNumber} onChange={(event) => setDocumentNumber(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" placeholder="Check carefully" /></label>
          <label className="space-y-1 text-sm font-medium">Expiry date<input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="h-10 w-full rounded-md border border-indigo-200 bg-white px-3 font-normal" /></label>
        </div>

        {/* Front Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Front</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {frontImage ? (
              <div className="space-y-2">
                <img
                  src={frontImage}
                  alt="Front"
                  className="w-full h-40 object-cover rounded"
                />
                <label className="block">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Change
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "front")}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload front image</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "front")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Back Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Document Back (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {backImage ? (
              <div className="space-y-2">
                <img
                  src={backImage}
                  alt="Back"
                  className="w-full h-40 object-cover rounded"
                />
                <label className="block">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Change
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "back")}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload back image</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "back")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Selfie Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Selfie with Document</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {selfieImage ? (
              <div className="space-y-2">
                <img
                  src={selfieImage}
                  alt="Selfie"
                  className="w-full h-40 object-cover rounded"
                />
                <label className="block">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Change
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "selfie")}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="space-y-2">
                  <FileText className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload selfie</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "selfie")}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Requirements:</strong>
            <br />
            • Clear, well-lit photos
            <br />
            • All four corners of document visible
            <br />
            • Your face clearly visible in selfie
            <br />
            • Recent documents (issued within 10 years)
          </p>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !frontImage || !selfieImage}
          className="w-full"
        >
          {loading ? "Submitting..." : "Submit KYC Documents"}
        </Button>
      </CardContent>
    </Card>
  );
}
