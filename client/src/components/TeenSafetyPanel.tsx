import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { trpc } from "@/lib/trpc";

type SafetyForm = {
  profileVisibility: "private" | "followers" | "public";
  followPermission: "approved_only" | "anyone";
  messagePermission: "no_one" | "followers" | "approved_requests";
  commentPermission: "no_one" | "followers" | "approved_requests";
  mentionPermission: "no_one" | "followers" | "approved_requests";
  sharePermission: "no_one" | "followers" | "public";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  screenTimeLimitMinutes: number | null;
  screenTimeReminderMinutes: number;
};

const defaultForm: SafetyForm = {
  profileVisibility: "followers",
  followPermission: "approved_only",
  messagePermission: "approved_requests",
  commentPermission: "followers",
  mentionPermission: "followers",
  sharePermission: "followers",
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  screenTimeLimitMinutes: null,
  screenTimeReminderMinutes: 60,
};

export function TeenSafetyPanel() {
  const { t } = useTranslation();
  const policyQuery = trpc.childSafety.getPolicy.useQuery();
  const updateMutation = trpc.childSafety.updateSettings.useMutation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState<SafetyForm>(defaultForm);

  useEffect(() => {
    if (policyQuery.data?.settings) {
      setForm({
        profileVisibility: policyQuery.data.settings.profileVisibility,
        followPermission: policyQuery.data.settings.followPermission,
        messagePermission: policyQuery.data.settings.messagePermission,
        commentPermission: policyQuery.data.settings.commentPermission,
        mentionPermission: policyQuery.data.settings.mentionPermission,
        sharePermission: policyQuery.data.settings.sharePermission,
        quietHoursEnabled: policyQuery.data.settings.quietHoursEnabled,
        quietHoursStart: policyQuery.data.settings.quietHoursStart,
        quietHoursEnd: policyQuery.data.settings.quietHoursEnd,
        screenTimeLimitMinutes: policyQuery.data.settings.screenTimeLimitMinutes,
        screenTimeReminderMinutes: policyQuery.data.settings.screenTimeReminderMinutes,
      });
    }
  }, [policyQuery.data?.settings]);

  if (policyQuery.isLoading) return <Card className="settings-section border-cyan-400/25 bg-cyan-500/5 p-5"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("status.loading", "Loading safety settings…")}</div></Card>;
  if (policyQuery.error) return <Card role="alert" className="settings-section border-rose-400/25 bg-rose-500/5 p-5 text-sm text-rose-200">{t("safety.loadFailed", "Unable to load teen safety settings. Please try again.")}</Card>;
  if (!policyQuery.data?.isTeen) return null;

  const update = <K extends keyof SafetyForm>(key: K, value: SafetyForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    try {
      await updateMutation.mutateAsync(form);
      await utils.childSafety.getPolicy.invalidate();
      toast.success(t("safety.saved", "Teen safety settings saved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("safety.saveFailed", "Unable to save safety settings"));
    }
  };

  return (
    <Card className="settings-section border-cyan-400/25 bg-cyan-500/5 p-5">
      <div className="section-header mb-4">
        <ShieldCheck size={20} className="text-cyan-300" />
        <div>
          <h2>{t("safety.teenTitle", "Teen Safety & Privacy")}</h2>
          <p>{t("safety.teenSubtitle", "Your account uses safer defaults. You can adjust these controls at any time.")}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="setting-info">
          <span className="font-medium">{t("safety.profileVisibility", "Profile visibility")}</span>
          <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.profileVisibility} onChange={(event) => update("profileVisibility", event.target.value as SafetyForm["profileVisibility"])}>
            <option value="private">{t("safety.private", "Private")}</option>
            <option value="followers">{t("safety.followersOnly", "Followers only")}</option>
            <option value="public">{t("safety.public", "Public")}</option>
          </select>
        </label>
        <label className="setting-info">
          <span className="font-medium">{t("safety.followPermission", "Who can follow")}</span>
          <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.followPermission} onChange={(event) => update("followPermission", event.target.value as SafetyForm["followPermission"])}>
            <option value="approved_only">{t("safety.approvedOnly", "Approved requests only")}</option>
            <option value="anyone">{t("safety.anyone", "Anyone")}</option>
          </select>
        </label>
        <PermissionSelect label={t("safety.messages", "Messages")} value={form.messagePermission} onChange={(value) => update("messagePermission", value)} />
        <PermissionSelect label={t("safety.comments", "Comments")} value={form.commentPermission} onChange={(value) => update("commentPermission", value)} />
        <PermissionSelect label={t("safety.mentions", "Mentions and tags")} value={form.mentionPermission} onChange={(value) => update("mentionPermission", value)} />
        <label className="setting-info">
          <span className="font-medium">{t("safety.sharing", "Content sharing")}</span>
          <select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={form.sharePermission} onChange={(event) => update("sharePermission", event.target.value as SafetyForm["sharePermission"])}>
            <option value="no_one">{t("safety.noOne", "No one")}</option>
            <option value="followers">{t("safety.followersOnly", "Followers only")}</option>
            <option value="public">{t("safety.public", "Public")}</option>
          </select>
        </label>
      </div>
      <div className="mt-5 grid gap-4 border-t border-border/60 pt-4 md:grid-cols-2">
        <div className="setting-item">
          <div className="setting-info"><h4>{t("safety.quietHours", "Quiet hours")}</h4><p>{t("safety.quietHoursHelp", "Reduce non-essential alerts during your sleep hours.")}</p></div>
          <label className="toggle"><input type="checkbox" checked={form.quietHoursEnabled} onChange={(event) => update("quietHoursEnabled", event.target.checked)} /><span className="toggle-slider" /></label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm">{t("safety.starts", "Starts")}<input type="time" className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2" value={form.quietHoursStart} onChange={(event) => update("quietHoursStart", event.target.value)} /></label>
          <label className="text-sm">{t("safety.ends", "Ends")}<input type="time" className="mt-1 w-full rounded-md border border-border bg-background px-2 py-2" value={form.quietHoursEnd} onChange={(event) => update("quietHoursEnd", event.target.value)} /></label>
        </div>
        <label className="text-sm">{t("safety.screenTimeLimit", "Optional daily screen-time limit (minutes)")}<input type="number" min={15} max={1440} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" value={form.screenTimeLimitMinutes ?? ""} placeholder={t("safety.noLimit", "No limit")} onChange={(event) => update("screenTimeLimitMinutes", event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="text-sm">{t("safety.screenTimeReminder", "Break reminder (minutes)")}<input type="number" min={15} max={240} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2" value={form.screenTimeReminderMinutes} onChange={(event) => update("screenTimeReminderMinutes", Number(event.target.value))} /></label>
      </div>
      <Button className="mt-5" onClick={save} disabled={updateMutation.isPending}>{updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}{updateMutation.isPending ? t("common.saving", "Saving…") : t("common.saveChanges", "Save changes")}</Button>
    </Card>
  );
}

function PermissionSelect({ label, value, onChange }: { label: string; value: SafetyForm["messagePermission"]; onChange: (value: SafetyForm["messagePermission"]) => void }) {
  const { t } = useTranslation();
  return <label className="setting-info"><span className="font-medium">{label}</span><select className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm" value={value} onChange={(event) => onChange(event.target.value as SafetyForm["messagePermission"])}><option value="no_one">{t("safety.noOne", "No one")}</option><option value="followers">{t("safety.followersOnly", "Followers only")}</option><option value="approved_requests">{t("safety.approvedRequests", "Approved requests")}</option></select></label>;
}
