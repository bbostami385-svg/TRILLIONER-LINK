import { useEffect, useRef, useState } from "react";
import { AlertCircle, Camera, CheckCircle2, Info, Loader2, RotateCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getMotionFeedback, type FaceBounds } from "@/lib/livenessMotion";

type VerificationStep = "instructions" | "recording" | "processing" | "pending" | "success" | "failed";
const challengeCopy: Record<string, { title: string; detail: string }> = {
  nod: { title: "Nod slowly", detail: "Move your head up and down once while keeping your face inside the guide." },
  turn_left: { title: "Turn left", detail: "Turn your head gently to your left, then return to the center." },
  turn_right: { title: "Turn right", detail: "Turn your head gently to your right, then return to the center." },
  blink: { title: "Blink naturally", detail: "Blink once or twice while looking toward the camera." },
};

export function LivenessVerification() {
  const [step, setStep] = useState<VerificationStep>("instructions");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [liveFeedback, setLiveFeedback] = useState("Center your face inside the guide.");
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const previousFaceRef = useRef<FaceBounds | null>(null);
  const startChallengeMutation = trpc.humanVerification.startLivenessChallenge.useMutation();
  const verifyLivenessMutation = trpc.humanVerification.verifyLiveness.useMutation();

  const stopCamera = (afterStop?: (blob: Blob) => void) => {
    const recorder = mediaRecorderRef.current;
    const finalize = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedVideo(blob);
      afterStop?.(blob);
    };
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = finalize;
      recorder.stop();
    } else if (afterStop && recordedVideo) afterStop(recordedVideo);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => event.data.size > 0 && chunksRef.current.push(event.data);
      recorder.start();
      setCameraReady(true);
    } catch {
      setError("Camera access is needed for human verification. Allow camera permission, then try again.");
      setStep("failed");
    }
  };

  const handleStartChallenge = async () => {
    setLoading(true); setError(null);
    try {
      const result = await startChallengeMutation.mutateAsync();
      setChallengeId(result.challengeId); setChallenges(result.challenges); setCurrentChallengeIndex(0); setStep("recording");
      await startCamera();
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to start liveness challenge"); }
    finally { setLoading(false); }
  };

  const submitVideo = async (videoBlob?: Blob) => {
    const blob = videoBlob ?? recordedVideo;
    if (!blob) { setError("No video was recorded. Please try again."); setStep("failed"); return; }
    setLoading(true); setStep("processing"); setError(null);
    try {
      const videoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not prepare the recording."));
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      if (!challengeId) throw new Error("Liveness challenge is missing. Please start again.");
      const result = await verifyLivenessMutation.mutateAsync({
        challengeId,
        steps: challenges.map((challengeType) => ({ challengeType: challengeType as "nod" | "turn_left" | "turn_right" | "blink", videoUrl, metadata: { totalChallenges: challenges.length, recordedAt: new Date().toISOString() } })),
      });
      setStep("pending");
      setError(result.message);
    } catch (err) { setStep("failed"); setError(err instanceof Error ? err.message : "Failed to submit video"); }
    finally { setLoading(false); }
  };

  const handleNextChallenge = () => {
    if (!cameraReady) return;
    if (currentChallengeIndex < challenges.length - 1) {
      setCurrentChallengeIndex((index) => index + 1);
    } else {
      stopCamera((blob) => void submitVideo(blob));
    }
  };
  const handleRetry = () => { stopCamera(); setStep("instructions"); setChallengeId(null); setChallenges([]); setCurrentChallengeIndex(0); setRecordedVideo(null); setError(null); };
  useEffect(() => {
    if (step !== "recording" || !cameraReady || !videoRef.current) return;
    let cancelled = false;
    const detectorConstructor = (window as unknown as { FaceDetector?: new () => { detect: (source: HTMLVideoElement) => Promise<unknown[]> } }).FaceDetector;
    if (!detectorConstructor) {
      setLiveFeedback("Camera ready. Follow the movement prompt below.");
      return;
    }
    const detector = new detectorConstructor();
    const checkFrame = async () => {
      if (cancelled || !videoRef.current) return;
      try {
        const faces = await detector.detect(videoRef.current);
        const face = faces[0] as { boundingBox?: FaceBounds } | undefined;
        const currentFace = face?.boundingBox ?? null;
        const challenge = challenges[currentChallengeIndex] as "nod" | "turn_left" | "turn_right" | "blink";
        if (!cancelled) {
          setLiveFeedback(getMotionFeedback(challenge, previousFaceRef.current, currentFace));
          if (currentFace) previousFaceRef.current = currentFace;
        }
      } catch { if (!cancelled) setLiveFeedback("Keep your face visible and follow the prompt."); }
    };
    void checkFrame();
    const timer = window.setInterval(() => void checkFrame(), 900);
    return () => { cancelled = true; window.clearInterval(timer); previousFaceRef.current = null; };
  }, [cameraReady, step]);
  useEffect(() => () => stopCamera(), []);

  if (step === "success") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-600" /><CardTitle>Human verification submitted</CardTitle><CardDescription>Your account passed the liveness check.</CardDescription></CardHeader><CardContent className="space-y-4"><Alert className="border-emerald-200 bg-emerald-50"><CheckCircle2 className="h-4 w-4 text-emerald-600" /><AlertDescription className="text-emerald-900">Your recording was reviewed successfully. Identity/KYC is separate and is only needed for monetization or payouts.</AlertDescription></Alert><Button onClick={() => window.location.href = "/"} className="w-full">Continue to TRILLIONER LINK</Button></CardContent></Card>;
  if (step === "pending") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><ClockIcon /><CardTitle>Recording is under review</CardTitle><CardDescription>Your ordered movement recording was submitted for secure human review.</CardDescription></CardHeader><CardContent className="space-y-4"><Alert><Info className="h-4 w-4" /><AlertDescription>{error || "You can leave this page. Your status will update after review."}</AlertDescription></Alert><Button onClick={() => window.location.href = "/"} className="w-full">Return home</Button></CardContent></Card>;
  if (step === "processing") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><CardTitle>Securing your recording</CardTitle><CardDescription>Uploading encrypted verification media and creating a review request.</CardDescription></CardHeader><CardContent className="flex justify-center p-8"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" aria-label="Processing" /></CardContent></Card>;
  if (step === "failed") return <Card className="mx-auto w-full max-w-md"><CardHeader className="text-center"><AlertCircle className="mx-auto mb-3 h-14 w-14 text-rose-600" /><CardTitle>Verification needs another attempt</CardTitle><CardDescription>{error || "We could not complete this attempt."}</CardDescription></CardHeader><CardContent><Button onClick={handleRetry} className="w-full"><RotateCw className="mr-2 h-4 w-4" />Try again</Button></CardContent></Card>;
  if (step === "recording") { const challenge = challenges[currentChallengeIndex]; const copy = challengeCopy[challenge] ?? { title: challenge, detail: "Follow the instruction shown below." }; return <Card className="mx-auto w-full max-w-2xl"><CardHeader><CardTitle>Live camera check</CardTitle><CardDescription>Step {currentChallengeIndex + 1} of {challenges.length}. Take your time; only the requested movement is needed.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="relative overflow-hidden rounded-2xl bg-slate-950"><video ref={videoRef} autoPlay playsInline muted className="aspect-video w-full object-cover" /><div className="pointer-events-none absolute inset-[12%] rounded-[45%] border-2 border-dashed border-white/70" /><div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{cameraReady ? "Camera ready" : "Opening camera…"}</div></div><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><p className="text-center text-lg font-semibold text-indigo-950">{copy.title}</p><p className="mt-1 text-center text-sm text-indigo-900/80">{copy.detail}</p></div><div className="space-y-2"><div className="flex justify-between text-sm text-slate-600"><span>Challenge progress</span><span>{currentChallengeIndex + 1}/{challenges.length}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((currentChallengeIndex + 1) / challenges.length) * 100}%` }} /></div></div><div className="flex gap-2"><Button onClick={handleNextChallenge} disabled={loading || !cameraReady} className="flex-1">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : currentChallengeIndex === challenges.length - 1 ? "Finish check" : "I’m ready — next"}</Button><Button onClick={handleRetry} variant="outline">Cancel</Button></div><p className="text-center text-xs text-slate-500" aria-live="polite">{liveFeedback} Use even lighting, keep your face uncovered, and hold your phone steady.</p></CardContent></Card>; }
  return <Card className="mx-auto w-full max-w-md"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-indigo-600" /> Human liveness check</CardTitle><CardDescription>Move naturally so we can confirm this is a real person, not an automated account.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="space-y-3">{["Use a well-lit, quiet space.", "Center your face inside the camera guide.", "Follow three short movement prompts.", "Your video is stored securely for review."].map((item, index) => <div key={item} className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">{index + 1}</span><p className="text-sm text-slate-700">{item}</p></div>)}</div><Button onClick={handleStartChallenge} disabled={loading} className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Preparing secure challenge…</> : "Start human verification"}</Button><Alert className="border-slate-200 bg-slate-50"><Info className="h-4 w-4" /><AlertDescription className="text-slate-700">This checks human presence only. It does not verify your name, age, or government identity.</AlertDescription></Alert>{error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}</CardContent></Card>;
}

function ClockIcon() { return <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-amber-100"><Loader2 className="h-7 w-7 text-amber-600" /></div>; }
