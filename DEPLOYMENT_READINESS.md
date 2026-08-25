# TRILLIONER LINK Deployment Readiness

This checklist distinguishes what is already implemented in the repository from the values and console configuration that must be supplied by the project owner before production deployment. It does not contain secrets.

## Implemented and validated

TRILLIONER LINK currently has persisted social and creator mode data, authenticated messaging, durable live-stream lifecycle records, recommendation queries, human liveness review, advisory KYC OCR, verification reminders, verification status metrics, notification filtering, and the public PWA installation experience. The latest validation baseline is **48 test files, 254 passing tests, and a clean TypeScript check**.

The active source of truth is the GitHub repository `bbostami385-svg/TRILLIONER-LINK`, branch `main`. The latest synchronized implementation checkpoint should be selected from the project history before publishing.

## Required runtime configuration

| Area | Required values | Where to configure |
|---|---|---|
| Database | `DATABASE_URL` | Server/runtime environment |
| Session and OAuth | `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL` | Server and frontend environments as indicated by the template |
| Built-in services | `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL`, `VITE_FRONTEND_FORGE_API_KEY` | Server and frontend environments as indicated by the template |
| App branding | `VITE_APP_TITLE=TRILLIONER LINK`, `VITE_APP_LOGO` | Frontend environment / project settings |
| Firebase, if used by a separate mobile client | Firebase web configuration and Android `google-services.json` | Mobile client only; never commit service-account JSON or put it in the Vite public directory |
| Social account linking | Provider-specific server-side client IDs and secrets listed in `SOCIAL_OAUTH_SETUP_GUIDE.md` | Server/runtime environment |
| Payments | SSLCommerz production credentials and callback configuration | Server/runtime environment |
| Streaming | A real HLS/ingest provider endpoint and credentials | Server/runtime environment |
| Media delivery | Production storage/CDN configuration | Server/runtime environment and provider dashboard |

## OAuth callback registration

For each enabled social provider, register the exact production callback URL:

```text
https://YOUR_DOMAIN/api/social/callback
```

For the Manus sign-in flow, retain the existing `/api/oauth/callback` route and use the runtime values supplied by the project environment. The signup flow now returns new accounts to `/verify` through a short-lived, validated browser cookie without changing the registered Manus callback URI.

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

The following Firebase browser variables are the complete set currently recognized by `client/src/lib/firebase.ts`:

| Variable | Required by current Firebase browser auth code? | Value format |
|---|---:|---|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase Console Web app `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Hostname such as `your-project.firebaseapp.com`; the client now also safely strips an accidental `https://` prefix |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase Console Web app `projectId` |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase Console Web app `appId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional for the current auth-only helper | Firebase Console `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional for the current auth-only helper | Firebase Console `messagingSenderId` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional and currently unused by the browser helper | Firebase Analytics measurement ID, if Analytics is later enabled |

Therefore, the first six values you listed are sufficient for the current Firebase helper; `VITE_FIREBASE_MEASUREMENT_ID` is optional. Firebase variables do not replace the server session/database variables used by this repository. The current production app still relies on the server-side session and database contract, so configure `DATABASE_URL`, `JWT_SECRET`, `OAUTH_SERVER_URL`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, and the built-in Forge variables according to the main runtime table above. Configure `FRONTEND_URL` to the deployed HTTPS origin if the Socket.io server needs an explicit CORS origin.

The screenshot’s `TypeError: Invalid URL` is not fixed by adding `VITE_FIREBASE_MEASUREMENT_ID`. It is commonly caused by a value such as `projects.vercel.app` being used where a complete URL is required, or by a Firebase `authDomain` value containing a malformed scheme. For `VITE_API_URL`, either leave it unset so the client uses the current Vercel origin, or set a complete URL such as `https://your-api-domain.example`; do not set only a hostname. The client now validates this value and falls back to the current deployment origin when it is malformed. The Firebase helper also validates and normalizes `VITE_FIREBASE_AUTH_DOMAIN` and returns a readable configuration error instead of allowing a malformed URL to crash the page.

After changing any Vercel variable, apply it to **Production** and **Preview** as appropriate, save it, then create a new deployment or use **Redeploy** with the latest commit. A browser refresh alone does not rebuild Vite’s `VITE_*` values.
