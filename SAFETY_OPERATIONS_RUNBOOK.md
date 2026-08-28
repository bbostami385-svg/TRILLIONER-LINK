# TRILLIONER LINK Child-Safety Operations Runbook

## Purpose and ownership

This runbook converts the implemented teen-protection controls into an operating process for launch and day-to-day review. It is an operational aid, not legal advice. The platform owner, qualified local counsel, and a child-safeguarding specialist must approve the final policy, escalation contacts, retention periods, and user-facing safety copy before public launch.

## Safety-copy approval gate

English, Bengali, and Hindi safety copy must be reviewed by a native speaker for each language and by a qualified child-safety/legal reviewer for jurisdictional suitability. Reviewers should check that the copy explains age eligibility, privacy defaults for teens, adult-to-teen contact limits, reporting, appeals, KYC separation, and emergency limitations without making promises the service cannot meet.

| Review item | Owner | Evidence to retain | Launch status |
|---|---|---|---|
| English safety strings | Native English reviewer and safeguarding reviewer | Version, reviewer name, date, comments | Owner-controlled approval required |
| Bengali safety strings | Native Bengali reviewer and safeguarding reviewer | Version, reviewer name, date, comments | Owner-controlled approval required |
| Hindi safety strings | Native Hindi reviewer and safeguarding reviewer | Version, reviewer name, date, comments | Owner-controlled approval required |
| Legal and policy consistency | Qualified local counsel | Written review or tracked comments | Owner-controlled approval required |
| Accessibility and reading level | Product/accessibility reviewer | Test notes and screenshots | Owner-controlled approval required |

No translation should weaken an enforcement rule, imply that KYC proves a person is safe, or suggest that the platform replaces emergency services or child-protection authorities.

## Moderator onboarding and permissions

Moderators must receive role-specific training before access to live queues. Training should cover age categories, teen defaults, adult-to-teen contact restrictions, grooming and exploitation indicators, urgent report priority, evidence minimization, enforcement levels, appeals, cultural and language sensitivity, and the prohibition on downloading or retaining unnecessary identity documents.

| Training module | Minimum outcome |
|---|---|
| Queue handling | Moderator can filter by safety category and priority, identify urgent cases, and document a concise reason. |
| Evidence handling | Moderator can use only the minimum evidence needed and avoids copying raw identity documents or private message bodies into notes. |
| Enforcement | Moderator can choose the lowest effective action and understands expiry, warning, restriction, suspension, and removal boundaries. |
| Appeals | Moderator can distinguish new evidence from disagreement, record a neutral rationale, and avoid retaliation for an appeal. |
| Escalation | Moderator knows the on-call safeguarding contact, emergency pathway, and when a case must not wait for normal queue review. |

Access should follow least privilege. Review access, enforcement access, audit-log access, and administrator ownership should be separated where staffing permits. Every moderator account should use strong authentication, have an assigned supervisor, and be removed promptly when the role ends.

## Live review procedure

A moderator first confirms the report category, subject age context available to the server, current enforcement state, and whether a block relationship or prior safety event changes the risk. The moderator then preserves only the minimum necessary evidence, records the reason in neutral language, applies the lowest effective enforcement level, and supplies the available appeal path. High-risk child-safety reports receive urgent human review and must not be auto-resolved solely from a model score.

For suspected imminent danger, credible threats, sexual exploitation, or material suggesting a child is at immediate risk, the moderator pauses routine handling and follows the owner-approved emergency escalation path. The moderator must not promise confidentiality beyond the published policy, contact a suspected perpetrator, or conduct an independent investigation outside their authority.

## Emergency escalation card

The owner must fill in and verify the contacts below before launch. Do not place private phone numbers or personal addresses in the public repository.

| Severity | Trigger | Immediate action | Escalation destination |
|---|---|---|---|
| Critical | Credible imminent threat, active exploitation, or immediate child-safety danger | Preserve minimal evidence, restrict harmful interaction when authorized, notify the on-call safeguarding lead immediately | `[OWNER: approved emergency safeguarding channel]` |
| High | Grooming pattern, repeated unwanted adult-to-teen contact, serious threat, or urgent child-safety report | Prioritize human review, apply temporary protective action when authorized, notify supervisor | `[OWNER: approved trust-and-safety escalation channel]` |
| Standard | Non-urgent safety report or policy concern | Review in queue, document decision, provide appeal path | `[OWNER: moderator queue / supervisor]` |

Local emergency services and legally required reporting contacts must be determined by the operator and counsel for the jurisdictions served. This runbook does not invent or select those contacts.

## Retention and deletion schedule

The owner and counsel must approve a written retention schedule before launch. Retention should be purpose-limited and should not preserve raw identity or liveness media longer than necessary. The schedule must state the record class, purpose, retention period, deletion owner, legal-hold exception, and deletion verification method.

| Record class | Default handling principle | Owner decision required |
|---|---|---|
| Safety audit metadata | Keep only the minimum identifiers, action, category, timestamp, and concise metadata needed for accountability. | Exact duration and legal-hold process |
| Moderation appeals | Retain while needed to resolve the appeal and demonstrate the decision. | Exact duration and deletion workflow |
| Raw KYC documents | Store through the approved media path with restricted access; never copy into audit notes. | Exact duration, deletion proof, and regulatory exception |
| Liveness recordings | Restrict to authorized review and provider workflow; delete when no longer needed. | Exact duration and provider deletion confirmation |
| Private messages and reports | Do not duplicate into safety logs. | Any exceptional access and legal basis |

Deletion jobs, if introduced, must be reviewed against legal holds, unresolved appeals, fraud investigations, and provider retention controls before activation.

## Monitoring and incident review

Operations should monitor queue age, urgent-report count, repeated adult-to-teen contact decisions, enforcement failures, appeal backlog, authentication failures, database errors, and media-access errors. A safety incident review should record the timeline, affected controls, evidence minimization decisions, notifications made, corrective action, and follow-up owner. Metrics must be aggregated where possible and should not expose teen identities in dashboards.

## Pre-launch sign-off

Before public traffic is enabled, the owner should obtain written confirmation that the three language catalogs were reviewed, moderators completed training, the emergency channel was tested, the retention schedule was approved, administrator roles were assigned, the critical staging safety scenarios passed, and provider monitoring alerts were received. Formal approval remains outside the codebase and must be completed by the owner and qualified reviewers.
