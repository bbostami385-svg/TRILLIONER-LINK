import { useState, useEffect } from "react";
import { useNavigate } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { AgeVerificationForm } from "@/components/AgeVerificationForm";
import { FaceVerificationForm } from "@/components/FaceVerificationForm";
import { trpc } from "@/lib/trpc";

type VerificationStep = "age" | "face" | "pending" | "complete";

export function VerificationFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<VerificationStep>("age");
  const [faceVerificationRequired, setFaceVerificationRequired] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: verificationStatus } = trpc.ageVerification.getAgeVerificationStatus.useQuery(
    undefined,
    { retry: false }
  );

  // Check if user already completed verification
  useEffect(() => {
    if (verificationStatus?.accountActive) {
      setStep("complete");
    } else if (verificationStatus?.ageVerified) {
      if (verificationStatus?.faceVerificationRequired && !verificationStatus?.faceVerified) {
        setStep("face");
        setFaceVerificationRequired(true);
      } else {
        setStep("complete");
      }
    }
  }, [verificationStatus]);

  const handleAgeVerificationSuccess = (data: {
    age: number;
    faceVerificationRequired: boolean;
  }) => {
    setAge(data.age);
    setFaceVerificationRequired(data.faceVerificationRequired);

    if (data.faceVerificationRequired) {
      setStep("face");
    } else {
      setStep("complete");
    }
  };

  const handleFaceVerificationSuccess = () => {
    setStep("complete");
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle>Verification Complete!</CardTitle>
            <CardDescription>Your account is now fully activated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                ✓ Age verified{age && ` (Age: ${age})`}
                <br />
                {faceVerificationRequired && "✓ Face verification completed"}
              </p>
            </div>
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-16 w-16 text-blue-600 animate-spin" />
            </div>
            <CardTitle>Verification Pending</CardTitle>
            <CardDescription>Your face verification is being reviewed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your face verification has been submitted. This usually takes a few minutes. You'll receive a notification once it's approved.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step === "age" ? "bg-blue-600 text-white" : "bg-green-600 text-white"}`}>
              {step === "age" ? "1" : "✓"}
            </div>
            <div className={`flex-1 h-1 mx-2 ${step === "face" ? "bg-blue-600" : "bg-gray-300"}`}></div>
            <div className={`flex items-center justify-center h-10 w-10 rounded-full ${step === "face" ? "bg-blue-600 text-white" : faceVerificationRequired ? "bg-gray-300 text-gray-600" : "bg-green-600 text-white"}`}>
              {step === "face" ? "2" : faceVerificationRequired ? "2" : "✓"}
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className={step === "age" ? "font-semibold text-blue-600" : "text-gray-600"}>
              Age Verification
            </span>
            {faceVerificationRequired && (
              <span className={step === "face" ? "font-semibold text-blue-600" : "text-gray-600"}>
                Face Verification
              </span>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === "age" && (
          <AgeVerificationForm
            onSuccess={handleAgeVerificationSuccess}
            onError={handleError}
          />
        )}

        {step === "face" && (
          <FaceVerificationForm
            onSuccess={handleFaceVerificationSuccess}
            onError={handleError}
          />
        )}

        {/* Skip button for testing (remove in production) */}
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-sm"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
