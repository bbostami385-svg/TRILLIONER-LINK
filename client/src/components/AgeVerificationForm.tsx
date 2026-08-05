import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AgeVerificationFormProps {
  onSuccess?: (data: { age: number; faceVerificationRequired: boolean }) => void;
  onError?: (error: string) => void;
}

export function AgeVerificationForm({ onSuccess, onError }: AgeVerificationFormProps) {
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"manual_dob" | "id_document" | "email_verification">("manual_dob");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const verifyAgeMutation = trpc.ageVerification.verifyAge.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!dateOfBirth) {
      setError("Please select your date of birth");
      setLoading(false);
      return;
    }

    try {
      const result = await verifyAgeMutation.mutateAsync({
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        verificationMethod,
      });

      onSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err?.message || "Age verification failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Calculate max date (today) and min date (13 years ago)
  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];
  
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 13);
  const minDateString = minDate.toISOString().split("T")[0];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Age Verification
        </CardTitle>
        <CardDescription>
          Verify your age to create an account. You must be at least 13 years old.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              min={minDateString}
              max={maxDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500">
              You must be at least 13 years old
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Verification Method</label>
            <select
              value={verificationMethod}
              onChange={(e) => setVerificationMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="manual_dob">Date of Birth</option>
              <option value="id_document">ID Document</option>
              <option value="email_verification">Email Verification</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> If you're 18 or older, you'll need to complete face verification after age verification.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !dateOfBirth}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Age"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
