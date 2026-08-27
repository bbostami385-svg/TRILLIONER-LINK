# TRILLIONER LINK Child Safety & Teen Protection System

## Purpose and scope

TRILLIONER LINK uses a layered safety model for accounts that are age-classified as **Teen (13–17)** or **Adult (18+)**. Accounts below 13 are rejected during age verification. Age classification is derived on the server from the verified date of birth; the browser does not decide the enforcement category.

All new accounts still follow the existing human-liveness activation flow. KYC remains a separate identity-verification process for monetization and payouts; it is not used as a general-purpose social-profile requirement.

## Implemented controls

| Area | Current behavior |
|---|---|
| Age assurance | Server derives `teen` or `adult`; under-13 submissions are rejected. Legacy users can be classified through the protected refresh procedure after age verification. |
| Teen defaults | Teen profiles receive follower-only visibility, approved follow requests, approved message requests, follower-limited comments and mentions, follower-limited sharing, quiet hours, and optional break reminders. |
| Contact protection | Block relationships are checked before contact evaluation. Adult-to-teen direct contact is restricted by default, repeated attempts are flagged, and each non-allowed decision is recorded as a minimal safety event. |
| Reporting | Reports support child safety, grooming, sexual exploitation, threats, dangerous content, and other safety categories. High-risk categories automatically receive urgent priority for the administrator queue. |
| Review and enforcement | Administrators can filter reports by status, safety category, and priority. Enforcement actions support warning, content removal, feature restriction, temporary suspension, and permanent removal levels. |
| Appeals | The existing moderation appeal lifecycle remains the user appeal path for blocked posts, comments, and videos. Reviewer notes and outcomes remain visible through the existing appeal UI. |
| Audit | Safety actions store actor, subject, report reference, category, action, timestamp, and minimal metadata. Raw identity documents and message bodies are not written to safety audit logs. |
| Multilingual UI | Teen safety settings and safety-report labels are available in English, Bengali, and Hindi through the shared locale catalogs. |

## Data minimization and access

Safety records contain only the identifiers and metadata necessary to enforce a decision, investigate a report, or explain an outcome. Do not store raw passwords, raw document bytes, private message bodies, face images, IP addresses, device fingerprints, or inferred sensitive traits in the safety audit tables. Access to `getAuditLogs` and enforcement creation is administrator-only. Users can read only their own policy state and enforcement history.

The client should treat all policy decisions as server-authoritative. Client controls are for clarity and preference management; they must never be used as a substitute for server-side checks before sending messages, creating follows, or resolving reports.

## Operational response

Urgent reports should be reviewed by an authorized human moderator. A reviewer should preserve only the minimum evidence needed for the decision, record a concise reason, apply the lowest effective enforcement level, and provide an appeal path where applicable. Repeated unwanted contact should be evaluated together with the block state and recent safety-event history rather than by a single isolated signal.

Safety controls are not a substitute for legal advice, emergency response, or local child-protection obligations. Before production launch, the operator must obtain jurisdiction-specific legal and safeguarding review, define an emergency escalation channel, set retention periods, train moderators, and publish a clear user-facing safety policy.

## Release checklist

1. Apply the generated Drizzle migration in the target environment and verify the four new tables and the added user/report columns.
2. Confirm that age verification and Firebase session exchange are enabled with real production configuration.
3. Confirm administrator role assignments and review permissions before enabling enforcement tools.
4. Test under-13 rejection, teen defaults, adult-to-teen message restriction, block handling, urgent report ordering, enforcement expiry, and user appeals in staging.
5. Configure provider-side monitoring and alerting for the existing health endpoint and safety-review queue.
6. Review translations with native speakers before publishing user-facing safety education.
