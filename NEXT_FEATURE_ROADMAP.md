# TRILLIONER LINK — Next Feature Roadmap

## Priority 0 — Release reliability

1. **Backend health and deployment diagnostics** — use `/api/health` to verify the Vercel-to-Render connection before testing Firebase login.
2. **Authenticated integration matrix** — cover Firebase token exchange, session cookie creation, reconnect behavior, and cross-router persistence against a staging database.
3. **Release manifest and rollback** — publish an app version, migration version, and API compatibility number so PWA updates can be blocked when a backend is incompatible.

## Priority 1 — Family-first experience

1. **Family Circle roles** — owner, guardian, adult member, teen member, and guest with least-privilege permissions.
2. **Meeting agenda and shared family board** — agenda, decisions, reminders, and private files tied to a meeting.
3. **Safety controls** — guardian approval for teen invitations, report/mute controls, participant audit log, and emergency escalation.

## Priority 2 — Creator discovery

1. **Topic shelves** — science, music, Islamic content, education, and user-created subscription collections.
2. **Explainable recommendations** — show why a video is recommended and provide controls to tune topics, language, and age suitability.
3. **Creator collaboration** — permissioned co-publishing, revenue split records, and shared analytics.

## Priority 3 — Trust and user control

1. **Privacy center** — export, retention controls, active sessions, and account deletion workflow.
2. **Moderation transparency** — reason codes, appeal status timeline, AI-assistance disclosure, and moderator audit trail.
3. **Offline library management** — storage quota, download expiry, quality selection, and update-safe cache migration.

All features require EN/BN/HI copy review, child-safety review, database migrations, server authorization tests, and an authenticated E2E journey before release.
