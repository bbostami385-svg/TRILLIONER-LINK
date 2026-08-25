import { useState, useRef, useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Camera, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FaceVerificationFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function FaceVerificationForm({ onSuccess, onError }: FaceVerificationFormProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Choose camera or upload a clear face photo to begin.");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const submitFaceVerificationMutation = trpc.ageVerification.submitFaceVerification.useMutation();

  // Start camera
  const startCamera = async () => {
    setCameraLoading(true);
    setError(null);
    setStatusMessage("Requesting camera permission…");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera is not supported in this browser.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setCameraStream(stream);
      setCameraActive(true);
      setStatusMessage("Camera ready. Center your face, then capture a photo.");
    } catch (err: any) {
      const reason = err?.name === "NotAllowedError" || /permission/i.test(err?.message ?? "") ? "Camera permission was denied. Allow camera access in your browser settings, or upload a photo instead." : err?.name === "NotFoundError" ? "No camera was found. Upload a clear face photo instead." : err?.message === "Camera is not supported in this browser." ? err.message : "We could not start the camera. Check your connection and browser permissions, then try again.";
      setError(reason);
      setStatusMessage("Camera unavailable. You can upload a photo instead.");
      onError?.(reason);
    } finally {
      setCameraLoading(false);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        setStatusMessage("Photo captured. Review it before submitting.");
        stopCamera();
      }
    }
  };

  // Stop camera
  const stopCamera = () => {
    const stream = cameraStream ?? (videoRef.current?.srcObject as MediaStream | null);
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraStream(null);
    setCameraActive(false);
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose a JPG, PNG, or WebP image file.");
      setStatusMessage("The selected file is not an image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("This image is too large. Please choose a file smaller than 8 MB.");
      setStatusMessage("Choose a smaller image and try again.");
      return;
    }
    setUploadLoading(true);
    setStatusMessage("Preparing your photo securely…");
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setStatusMessage("Photo ready. Review it before submitting.");
      setUploadLoading(false);
    };
    reader.onerror = () => {
      setError("We could not read that image. Please choose another photo.");
      setStatusMessage("Photo could not be prepared.");
      setUploadLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Submit face verification
  const handleSubmit = async () => {
    if (!capturedImage) {
      setError("Please capture or upload a photo before submitting.");
      setStatusMessage("A face photo is required before submission.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusMessage("Submitting your photo for secure human review…");

    try {
      // In production, upload to S3 first and get URL
      // For now, we'll use the base64 data directly
      await submitFaceVerificationMutation.mutateAsync({
        imageUrl: capturedImage,
        verificationProvider: "aws_rekognition",
      });

      setStatusMessage("Photo submitted. Your verification is now under review.");
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err?.message || "Face verification failed. Please try again.";
      setError(errorMessage);
      setStatusMessage("Submission failed. Review the message above and try again.");
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) videoRef.current.srcObject = cameraStream;
  }, [cameraActive, cameraStream]);

  // Cleanup camera on unmount
  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Face Verification
        </CardTitle>
        <CardDescription>
          Complete face verification to activate your account. This is required for users 18+.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
            {(cameraLoading || uploadLoading || loading) && <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" aria-label="Working" />}
            {statusMessage}
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!capturedImage ? (
            <div className="space-y-4">
              {cameraActive ? (
                <div className="space-y-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      Capture Photo
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-8 text-center">
                    <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-3">
                      Take a clear photo of your face
                    </p>
                  </div>
                  <Button onClick={startCamera} disabled={cameraLoading || uploadLoading} className="w-full">
                    {cameraLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Camera className="h-4 w-4 mr-2" />}
                    {cameraLoading ? "Opening camera…" : "Start Camera"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or</span>
                    </div>
                  </div>

                  <label className="block">
                    <Button variant="outline" disabled={cameraLoading || uploadLoading} className="w-full" asChild>
                      <span>
                        {uploadLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4 mr-2" />}
                        {uploadLoading ? "Preparing photo…" : "Upload Photo"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Tips:</strong> Ensure good lighting, face the camera directly, and remove sunglasses.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <img
                src={capturedImage}
                alt="Captured face"
                className="w-full rounded-lg"
              />
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={loading || uploadLoading} className="flex-1">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Submitting…</> : "Submit"}
                </Button>
                <Button
                  onClick={() => { setCapturedImage(null); setError(null); setStatusMessage("Choose camera or upload a clear face photo to begin."); }}
                  variant="outline"
                  className="flex-1"
                >
                  Retake
                </Button>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </CardContent>
    </Card>
  );
}
