import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

export type AppealContentType = "post" | "comment" | "video";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: AppealContentType;
  targetId?: number;
  content: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
};

export function ModerationAppealDialog({ open, onOpenChange, contentType, targetId, content, mediaUrl, mediaType }: Props) {
  const [reason, setReason] = useState("");
  const submit = trpc.moderationAppeals.submit.useMutation({
    onSuccess: () => {
      toast.success("Your appeal was submitted for review.");
      setReason("");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || "We could not submit your appeal."),
  });

  const handleSubmit = () => {
    const appealReason = reason.trim();
    if (appealReason.length < 10) {
      toast.error("Please explain your appeal in at least 10 characters.");
      return;
    }
    submit.mutate({ contentType, targetId, content, mediaUrl, mediaType, appealReason });
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Appeal this moderation decision</DialogTitle>
        <DialogDescription>Tell our review team why this content was incorrectly blocked. Do not include passwords or sensitive personal information.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">Content type: <span className="font-medium capitalize">{contentType}</span></p>
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain why this content follows the platform safety rules…" maxLength={2000} rows={5} aria-label="Appeal reason" />
        <p className="text-right text-xs text-muted-foreground">{reason.length}/2000</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={submit.isPending || reason.trim().length < 10}>{submit.isPending ? "Submitting…" : "Submit appeal"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
