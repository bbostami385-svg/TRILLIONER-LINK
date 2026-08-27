import { and, desc, eq, gte } from "drizzle-orm";
import {
  blockedUsers,
  childSafetySettings,
  safetyAuditLogs,
  safetyInteractionEvents,
  users,
  type ChildSafetySettings,
} from "../drizzle/schema";
import { getRequiredDb } from "./db";

export type AgeCategory = "teen" | "adult";
export type SafetyContactEvent = "message_attempt" | "follow_attempt" | "comment_attempt" | "mention_attempt" | "share_attempt";
export type ContactOutcome = "allowed" | "warned" | "restricted" | "flagged";

export const TEEN_SAFETY_DEFAULTS = {
  profileVisibility: "followers" as const,
  followPermission: "approved_only" as const,
  messagePermission: "approved_requests" as const,
  commentPermission: "followers" as const,
  mentionPermission: "followers" as const,
  sharePermission: "followers" as const,
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  screenTimeLimitMinutes: null,
  screenTimeReminderMinutes: 60,
};

export function deriveAgeCategory(age: number): AgeCategory {
  if (!Number.isInteger(age) || age < 0) {
    throw new Error("Age must be a non-negative integer.");
  }
  if (age < 13) {
    throw new Error("You must be at least 13 years old to create an account.");
  }
  return age < 18 ? "teen" : "adult";
}

export function isTeen(ageCategory: AgeCategory | null | undefined): boolean {
  return ageCategory === "teen";
}

export function getDefaultTeenSafetySettings(userId: number) {
  return { userId, ...TEEN_SAFETY_DEFAULTS };
}

export async function ensureTeenSafetySettings(db: Awaited<ReturnType<typeof getRequiredDb>>, userId: number): Promise<ChildSafetySettings> {
  const [existing] = await db.select().from(childSafetySettings).where(eq(childSafetySettings.userId, userId)).limit(1);
  if (existing) return existing;
  await db.insert(childSafetySettings).values(getDefaultTeenSafetySettings(userId));
  const [created] = await db.select().from(childSafetySettings).where(eq(childSafetySettings.userId, userId)).limit(1);
  if (!created) throw new Error("Unable to initialize teen safety settings.");
  return created;
}

export function decideTeenContact(input: {
  actorAgeCategory: AgeCategory | null | undefined;
  targetAgeCategory: AgeCategory | null | undefined;
  eventType: SafetyContactEvent;
  settings: ChildSafetySettings;
  actorFollowsTarget: boolean;
  alreadyBlocked: boolean;
  recentAttempts: number;
}): { allowed: boolean; outcome: ContactOutcome; reason: string } {
  if (input.alreadyBlocked) {
    return { allowed: false, outcome: "restricted", reason: "This interaction is blocked by the recipient." };
  }
  if (input.recentAttempts >= 5) {
    return { allowed: false, outcome: "flagged", reason: "Repeated contact attempts were restricted and flagged for safety review." };
  }
  if (!isTeen(input.targetAgeCategory)) {
    return { allowed: true, outcome: "allowed", reason: "Standard interaction policy applies." };
  }

  const permission = {
    message_attempt: input.settings.messagePermission,
    follow_attempt: input.settings.followPermission,
    comment_attempt: input.settings.commentPermission,
    mention_attempt: input.settings.mentionPermission,
    share_attempt: input.settings.sharePermission,
  }[input.eventType];

  if (permission === "no_one") {
    return { allowed: false, outcome: "restricted", reason: "The teen account does not accept this type of interaction." };
  }
  if (permission === "followers" && !input.actorFollowsTarget) {
    return { allowed: false, outcome: "restricted", reason: "This interaction is limited to the teen account's approved followers." };
  }
  if (permission === "approved_only" || permission === "approved_requests") {
    return {
      allowed: false,
      outcome: input.actorAgeCategory === "adult" ? "warned" : "restricted",
      reason: input.actorAgeCategory === "adult"
        ? "Adult-to-teen contact requires an approved request and was not delivered directly."
        : "This interaction requires approval before it can be delivered.",
    };
  }
  return { allowed: true, outcome: "allowed", reason: "The interaction meets the current teen safety settings." };
}

export async function evaluateAndRecordContact(input: {
  actorUserId: number;
  targetUserId: number;
  eventType: SafetyContactEvent;
}) {
  const db = await getRequiredDb();
  const [actor] = await db.select({ id: users.id, ageCategory: users.ageCategory, safetyRestricted: users.safetyRestricted }).from(users).where(eq(users.id, input.actorUserId)).limit(1);
  const [target] = await db.select({ id: users.id, ageCategory: users.ageCategory }).from(users).where(eq(users.id, input.targetUserId)).limit(1);
  if (!actor || !target) throw new Error("Safety interaction user not found.");

  const [blocked] = await db.select({ id: blockedUsers.id }).from(blockedUsers).where(and(eq(blockedUsers.blockerId, input.targetUserId), eq(blockedUsers.blockedId, input.actorUserId))).limit(1);
  const settings = isTeen(target.ageCategory) ? await ensureTeenSafetySettings(db, input.targetUserId) : null;
  const [follow] = await db.select({ id: safetyInteractionEvents.id }).from(safetyInteractionEvents).where(and(eq(safetyInteractionEvents.actorUserId, input.actorUserId), eq(safetyInteractionEvents.targetUserId, input.targetUserId), eq(safetyInteractionEvents.eventType, "follow_attempt"), eq(safetyInteractionEvents.outcome, "allowed"))).limit(1);
  const recentSince = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db.select({ id: safetyInteractionEvents.id }).from(safetyInteractionEvents).where(and(eq(safetyInteractionEvents.actorUserId, input.actorUserId), eq(safetyInteractionEvents.targetUserId, input.targetUserId), eq(safetyInteractionEvents.eventType, input.eventType), gte(safetyInteractionEvents.createdAt, recentSince)));
  const decision = settings
    ? decideTeenContact({ actorAgeCategory: actor.ageCategory, targetAgeCategory: target.ageCategory, eventType: input.eventType, settings, actorFollowsTarget: Boolean(follow), alreadyBlocked: Boolean(blocked), recentAttempts: recent.length })
    : { allowed: !actor.safetyRestricted, outcome: actor.safetyRestricted ? "restricted" as const : "allowed" as const, reason: actor.safetyRestricted ? "Your account is temporarily restricted." : "Standard interaction policy applies." };

  await db.insert(safetyInteractionEvents).values({ actorUserId: input.actorUserId, targetUserId: input.targetUserId, eventType: input.eventType, outcome: decision.outcome, reason: decision.reason });
  if (decision.outcome !== "allowed") {
    await db.insert(safetyAuditLogs).values({ actorUserId: input.actorUserId, subjectUserId: input.targetUserId, action: "interaction_restricted", category: "child_safety", metadata: { eventType: input.eventType, outcome: decision.outcome, reason: decision.reason } });
  }
  return decision;
}

export async function recordSafetyAudit(input: {
  actorUserId?: number | null;
  subjectUserId?: number | null;
  reportId?: number | null;
  action: string;
  category: string;
  metadata?: Record<string, unknown>;
}) {
  const db = await getRequiredDb();
  await db.insert(safetyAuditLogs).values({ ...input, metadata: input.metadata ?? null });
}

export function isWithinQuietHours(now: Date, start: string, end: string): boolean {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const current = now.getHours() * 60 + now.getMinutes();
  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);
  return startMinutes > endMinutes ? current >= startMinutes || current < endMinutes : current >= startMinutes && current < endMinutes;
}
