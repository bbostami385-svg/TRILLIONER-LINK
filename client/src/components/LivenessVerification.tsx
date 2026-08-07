import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Camera, RotateCw } from "lucide-react";
import { trpc } from "@/lib/trpc";

type VerificationStep = "instructions" | "recording" | "processing" | "success" | "failed";

export function LivenessVerification() {
  const [step, setStep] = useState<VerificationStep>("instructions");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startChallengeMutation = trpc.humanVerification.startLivenessChallenge.useMutation();
  const submitVideoMutation = trpc.humanVerification.submitLivenessVideo.useMutation();

  // Start liveness challenge
  const handleStartChallenge = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await startChallengeMutation.mutateAsync();
      setChallenges(result.challenges);
      setCurrentChallengeIndex(0);
      setStep("recording");
      startCamera();
    } catch (err: any) {
      setError(err.message || "Failed to start liveness challenge");
    } finally {
      setLoading(false);
    }
  };

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Setup media recorder
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "video/webm" });
          setRecordedVideo(blob);
        };

        mediaRecorder.start();
      }
    } catch (err: any) {
      setError("Unable to access camera. Please check permissions.");
    }
  };

  // Stop camera and recording
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  // Move to next challenge
  const handleNextChallenge = () => {
    if (currentChallengeIndex < challenges.length - 1) {
      setCurrentChallengeIndex(currentChallengeIndex + 1);
    } else {
      // All challenges completed
      stopCamera();
      submitVideo();
    }
  };

  // Submit video for verification
  const submitVideo = async () => {
    if (!recordedVideo) {
      setError("No video recorded");
      return;
    }

    setLoading(true);
    setStep("processing");
    setError(null);

    try {
      // Upload video to S3 (simulated with data URL for now)
      const reader = new FileReader();
      reader.onload = async () => {
        const videoUrl = reader.result as string;

        const result = await submitVideoMutation.mutateAsync({
          videoUrl,
          challengeType: challenges[currentChallengeIndex] as any,
          metadata: {
            totalChallenges: challenges.length,
            completedChallenges: currentChallengeIndex + 1,
            timestamp: new Date().toISOString(),
          },
        });

        if (result.success) {
          setStep("success");
        } else {
          setStep("failed");
          setError(result.reason || "Liveness verification failed");
        }
      };
      reader.readAsDataURL(recordedVideo);
    } catch (err: any) {
      setStep("failed");
      setError(err.message || "Failed to submit video");
    } finally {
      setLoading(false);
    }
  };

  // Retry verification
  const handleRetry = () => {
    setStep("instructions");
    setChallenges([]);
    setCurrentChallengeIndex(0);
    setRecordedVideo(null);
    setError(null);
  };

  // Get challenge instruction
  const getChallengeInstruction = (challenge: string) => {
    const instructions: Record<string, string> = {
      nod: "Please nod your head up and down",
      turn_left: "Please turn your head to the left",
      turn_right: "Please turn your head to the right",
      blink: "Please blink your eyes",
    };
    return instructions[challenge] || challenge;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (step === "success") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle>Liveness Verification Successful!</CardTitle>
          <CardDescription>Your account has been verified as human</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              ✓ Face liveness detection passed
              <br />
              ✓ All challenges completed successfully
            </p>
          </div>
          <Button onClick={() => window.location.href = "/"} className="w-full">
            Go to Home
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
          <CardTitle>Verification Failed</CardTitle>
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
            <RotateCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "processing") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Processing Verification</CardTitle>
          <CardDescription>Analyzing your video...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="animate-spin">
            <Camera className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "recording") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Face Liveness Verification</CardTitle>
          <CardDescription>
            Challenge {currentChallengeIndex + 1} of {challenges.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Video feed */}
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video"
            />
          </div>

          {/* Challenge instruction */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 text-center">
              {getChallengeInstruction(challenges[currentChallengeIndex])}
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{currentChallengeIndex + 1}/{challenges.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentChallengeIndex + 1) / challenges.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleNextChallenge}
              disabled={loading}
              className="flex-1"
            >
              {currentChallengeIndex === challenges.length - 1
                ? "Complete"
                : "Next Challenge"}
            </Button>
            <Button
              onClick={() => {
                stopCamera();
                setStep("instructions");
              }}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-900">
              <strong>Tip:</strong> Make sure you're in good lighting and your face is clearly visible in the camera.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Instructions step
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Liveness Verification
        </CardTitle>
        <CardDescription>
          Verify that you're a real person by completing face challenges
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">1</span>
              </div>
            </div>
            <div>
              <p className="font-medium">Good Lighting</p>
              <p className="text-sm text-gray-600">Find a well-lit area</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">2</span>
              </div>
            </div>
            <div>
              <p className="font-medium">Clear Face</p>
              <p className="text-sm text-gray-600">Position your face in the center</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                <span className="text-sm font-semibold text-blue-600">3</span>
              </div>
            </div>
            <div>
              <p className="font-medium">Follow Instructions</p>
              <p className="text-sm text-gray-600">Complete all head movement challenges</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleStartChallenge}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Starting..." : "Start Verification"}
        </Button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Note:</strong> This verification helps us confirm you're a real person and prevent bot accounts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
