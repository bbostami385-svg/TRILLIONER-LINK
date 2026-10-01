# TRILLIONER LINK — Differentiator Roadmap

The first differentiator shipped in this phase is **Family Circles**: invite-only private spaces with scheduled member-only browser meetings. It is intentionally separate from Social/Creator mode so the existing product identity remains unchanged.

## Next candidates

### 1. Family memory vault
A private, permissioned timeline for family photos, voice notes, important dates, and stories. Every item should have an owner, audience, expiration option, and download/export control.

### 2. Shared family decision board
A lightweight consensus board for chores, travel plans, budgets, caregiving tasks, and polls. It should show who has seen a decision without exposing private messages.

### 3. Trust circles and emergency check-in
A user can designate a small trust circle and send a timed “I’m safe” check-in. Escalation must be opt-in, transparent, and never silently share live location.

### 4. Cross-generation learning rooms
Family members can create a guided room around a skill or story. Younger members can ask questions while moderators control recording, downloads, and participation.

### 5. Context-aware feed modes
A user-controlled “family time”, “creator discovery”, or “quiet mode” that changes ranking and notification behavior locally. It must never infer sensitive attributes to target people.

### 6. Portable community reputation
A transparent record of completed community contributions, moderation decisions, and appeals—exportable by the user and never reduced to an opaque score.

### 7. Collaborative creator rooms
Creators can invite trusted collaborators into a production room for scripts, drafts, music rights, moderation review, and scheduled release. Ownership and attribution must be explicit.

## Product guardrails

- Private spaces are invite-only by default and excluded from public search.
- Camera, microphone, recording, and screen sharing require explicit user action.
- Meeting media stays peer-to-peer in the browser in the current prototype; a production SFU, recording policy, abuse reporting, and retention policy are required before scale-up.
- Family relationships must never be inferred from names, contacts, or photos.
- Child-safety restrictions, reporting, blocking, and owner-controlled removal apply to every private space.
- New features should ship behind a feature flag and receive English/Bengali/Hindi safety-copy review before broad release.
