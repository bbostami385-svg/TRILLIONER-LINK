# TRILLIONER LINK Deployment Readiness

This checklist distinguishes what is already implemented in the repository from the values and console configuration that must be supplied by the project owner before production deployment. It does not contain secrets.

## Implemented and validated

TRILLIONER LINK currently has persisted social and creator mode data, authenticated messaging, durable live-stream lifecycle records, recommendation queries, human liveness review, advisory KYC OCR, verification reminders, verification status metrics, notification filtering, and the public PWA installation experience. The latest validation baseline is **52 test files, 269 passing tests, a clean TypeScript check, and a successful production build**.

The active source of truth is the GitHub repository `bbostami385-svg/TRILLIONER-LINK`, branch `main`. The latest synchronized implementation checkpoint should be selected from the project history before publishing.

## Required runtime configuration

| Area | Required values | Where to configure |
|---|---|---|
| Database | `DATABASE_URL` | Server/runtime environment |
| Local session | `JWT_SECRET` | Server/runtime environment; required for the app session cookie |
| Firebase server verification | `FIREBASE_SERVICE_ACCOUNT_BASE64` | Server/runtime environment only; never expose with `VITE_` |
| Built-in services | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | Conditional: add only for storage, moderation, notifications, LLM, or map features that use them |
| App branding | `VITE_APP_TITLE=TRILLIONER LINK`, `VITE_APP_LOGO` | Optional frontend branding; the app has a TRILLIONER LINK fallback |
| Firebase browser login | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | Frontend environment; public Firebase Web App configuration |
| Social account linking | Provider-specific server-side client IDs and secrets listed in `SOCIAL_OAUTH_SETUP_GUIDE.md` | Optional; unrelated to Firebase Google Login |
| Payments | SSLCommerz production credentials and callback configuration | Server/runtime environment |
| Streaming | A real HLS/ingest provider endpoint and credentials | Server/runtime environment |
| Media delivery | Production storage/CDN configuration | Server/runtime environment and provider dashboard |

## OAuth callback registration

For each enabled social provider, register the exact production callback URL:

```text
https://YOUR_DOMAIN/api/social/callback
```

The active sign-in flow is Firebase Google Login plus the local Firebase ID-token exchange. The legacy Manus OAuth callback and its user-facing entry points are disabled. Do not add `OAUTH_SERVER_URL`, `VITE_APP_ID`, or `VITE_OAUTH_PORTAL_URL` for Firebase-only authentication.

## Production safety gates

Before publishing, verify that all secrets are configured in the hosting provider’s server/runtime environment, not in source control and not as `VITE_` variables unless they are intentionally public browser configuration. Confirm that the database migration adding `verification_reminder` to the notifications enum has been applied. Confirm that notification delivery is working for liveness and KYC review outcomes. Confirm that human liveness and KYC remain manual-review workflows; advisory signals must never approve or reject a user automatically.

Run the following commands in a clean checkout before release:

```bash
pnpm check
pnpm test -- --run
pnpm build
```

Then test the critical browser flow: signup, verification status redirect, liveness submission, admin decision, reminder notification, and creator monetization gating. For provider integrations, test only the providers whose credentials and callback registrations are complete.

## Explicitly deferred until owner configuration

Production deployment, environment promotion, CDN provisioning, SSLCommerz production completion, real streaming-provider activation, and Google/YouTube/Facebook/Instagram/TikTok OAuth enablement require credentials or provider-console actions that are not present in the repository. These items must remain open until the owner supplies and verifies the required configuration.

## Vercel Firebase variable guidance

For Firebase-only Google Login, the following are the complete browser variables recognized by `client/src/lib/firebase.ts`:

| Variable | Required by current Firebase browser auth code? | Value format |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console Web app `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Hostname such as `your-project.firebaseapp.com`; the client now also safely strips an accidental `https://` prefix |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase Console Web app `projectId` |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Console Web app `appId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional for the current auth-only helper | Firebase Console `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional for the current auth-only helper | Firebase Console `messagingSenderId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional and currently unused by the browser helper | Firebase Analytics measurement ID, if Analytics is later enabled |

The **minimum production login set** is `DATABASE_URL`, `JWT_SECRET`, `FIREBASE_SERVICE_ACCOUNT_BASE64`, and the four required browser Firebase variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_MEASUREMENT_ID` are not required for Google Login itself. Add the built-in Forge variables only when enabling the corresponding storage, moderation, notification, LLM, or other built-in service features. Configure `FRONTEND_URL` only if the deployed Socket.io server needs an explicit CORS origin.

The screenshot’s `TypeError: Invalid URL` is not fixed by adding `VITE_FIREBASE_MEASUREMENT_ID`. It is commonly caused by a value such as `projects.vercel.app` being used where a complete URL is required, or by a Firebase `authDomain` value containing a malformed scheme. For `VITE_API_URL`, either leave it unset so the client uses the current Vercel origin, or set a complete URL such as `https://your-api-domain.example`; do not set only a hostname. The client now validates this value and falls back to the current deployment origin when it is malformed. The Firebase helper also validates and normalizes `VITE_FIREBASE_AUTH_DOMAIN` and returns a readable configuration error instead of allowing a malformed URL to crash the page.

After changing any Vercel variable, apply it to **Production** and **Preview** as appropriate, save it, then create a new deployment or use **Redeploy** with the latest commit. A browser refresh alone does not rebuild Vite’s `VITE_*` values.
