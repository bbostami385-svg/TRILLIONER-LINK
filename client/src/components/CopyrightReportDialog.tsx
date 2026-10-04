import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

type ClaimType = "copyright" | "unauthorized_reupload" | "privacy_screenshot" | "privacy_recording" | "privacy_call_capture";

type Props = { open: boolean; onOpenChange: (open: boolean) => void; targetVideoId?: number };

const claimOptions: Array<{ value: ClaimType; label: string }> = [
  { value: "copyright", label: "Someone is using my original work" },
  { value: "unauthorized_reupload", label: "Unauthorized re-upload or edited copy" },
  { value: "privacy_screenshot", label: "Privacy violation: screenshot" },
  { value: "privacy_recording", label: "Privacy violation: screen recording" },
  { value: "privacy_call_capture", label: "Privacy violation: video-call capture" },
];

export function CopyrightReportDialog({ open, onOpenChange, targetVideoId }: Props) {
  const [type, setType] = useState<ClaimType>("copyright");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [originalWorkUrl, setOriginalWorkUrl] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [attested, setAttested] = useState(false);
  const submit = trpc.copyright.submitClaim.useMutation({
    onSuccess: () => { toast.success("Your report was submitted for review."); setDescription(""); setOriginalWorkUrl(""); setEvidenceUrl(""); setAttested(false); onOpenChange(false); },
    onError: (error) => toast.error(error.message || "We could not submit this report."),
  });
  const isCopyright = type === "copyright" || type === "unauthorized_reupload";
  const canSubmit = description.trim().length >= 20 && contactEmail.includes("@") && (!isCopyright || attested) && !submit.isPending;
  const handleSubmit = () => {
    if (!canSubmit) return;
    submit.mutate({ targetVideoId, claimType: type, description: description.trim(), contactEmail: contactEmail.trim(), originalWorkUrl: originalWorkUrl.trim() || undefined, evidenceUrl: evidenceUrl.trim() || undefined, attestedOwnership: isCopyright ? attested : false });
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Report copyright or privacy abuse</DialogTitle>
        <DialogDescription>We review reports, preserve evidence securely, and may restrict or remove confirmed infringing content. Browser and device controls cannot guarantee that screenshots or recordings are impossible, so do not share sensitive information on a call.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <label className="block text-sm font-medium">Report type<select value={type} onChange={(event) => setType(event.target.value as ClaimType)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"><option value="copyright">Someone is using my original work</option>{claimOptions.slice(1).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="block text-sm font-medium">Contact email<input value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} type="email" placeholder="you@example.com" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
        {isCopyright && <label className="block text-sm font-medium">Original work URL (optional)<input value={originalWorkUrl} onChange={(event) => setOriginalWorkUrl(event.target.value)} type="url" placeholder="https://…" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>}
        <label className="block text-sm font-medium">Evidence URL (optional)<input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} type="url" placeholder="Secure evidence link" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
        <div><label className="text-sm font-medium" htmlFor="copyright-description">What happened?</label><Textarea id="copyright-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Include the relevant video, approximate time, and why it violates your rights or privacy…" maxLength={4000} rows={5} /><p className="mt-1 text-right text-xs text-muted-foreground">{description.length}/4000</p></div>
        {isCopyright && <label className="flex items-start gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={attested} onChange={(event) => setAttested(event.target.checked)} className="mt-1" />I confirm that I am the copyright owner or authorized agent, and that this report is accurate to the best of my knowledge.</label>}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Cancel</Button><Button onClick={handleSubmit} disabled={!canSubmit}>{submit.isPending ? "Submitting…" : "Submit report"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
