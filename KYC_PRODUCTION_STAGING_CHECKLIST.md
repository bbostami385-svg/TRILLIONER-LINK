# TRILLIONER LINK — KYC Production and Staging Checklist

This checklist preserves the existing Social Mode and Creator Mode selection interface. It covers only operational configuration and the KYC workflow.

## Production WebSocket and TLS configuration

The application now starts Socket.IO on the same HTTP server as the tRPC API. Configure the server-side `FRONTEND_URL` value as a comma-separated allowlist containing only the exact HTTPS frontend origins, for example `https://trillioner-link.example.com,https://www.trillioner-link.example.com`. Do not include a trailing slash, wildcard, localhost origin, or an untrusted preview domain in production.

If the frontend and API are deployed separately, set the browser-side `VITE_API_URL` to the HTTPS API origin, for example `https://api.trillioner-link.example.com`. The API must expose the Socket.IO handshake at the same origin and allow `GET` and `POST` with credentials. The platform should terminate TLS at the edge and forward WebSocket upgrade requests; do not downgrade the browser URL to `http://` or `ws://` in production.

| Setting | Vercel frontend | Render API/service |
|---|---|---|
| Frontend origin | Add the production and approved preview HTTPS domains to Firebase Authorized Domains and the API CORS allowlist | Use this exact origin in `FRONTEND_URL` |
| API origin | Set `VITE_API_URL` only when the API is hosted separately | Use the Render HTTPS service URL or custom API domain |
| WebSocket transport | Browser connects with `wss://` through the HTTPS API origin | Enable WebSocket support and preserve upgrade requests |
| Secrets | Set `VITE_*` values in the correct Vercel environments | Set `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, and server AI/storage values in Render |

After saving environment variables, create a fresh deployment because Vite values are build-time values. Verify the browser Network panel shows a successful Socket.IO polling or WebSocket handshake, then approve a staging KYC submission and confirm a `kyc:status` event arrives after the user reconnects.

## Staging KYC test

Use a staging Firebase project, staging database, non-production domains, and synthetic or redacted test documents. Never upload a real passport, national ID, or selfie to staging. Test the following sequence: upload a supported document, confirm the advisory fields are editable, deliberately correct one extracted value, submit, reject the record with a reason, approve a separate record, close and reopen the browser, and verify that the persisted notification appears even when the real-time connection was offline.

Record the following evidence in the staging release ticket: document type, extraction success or graceful fallback, form validation result, database status transition, notification ID, reconnect behavior, and whether the user can see the rejection reason. A successful AI extraction must never be treated as automatic approval.

## Legal and compliance review gate

Before production use, legal/compliance should approve the AI extraction disclosure shown in the KYC form, the categories of fields extracted, retention and deletion periods for uploaded media and OCR signals, access controls for moderators, cross-border processing terms, and the manual-review requirement. The implementation stores minimized OCR signals and keeps the final decision with a trained reviewer, but the policy owner must confirm whether those defaults satisfy the applicable jurisdiction.

## Launch boundary

The code and checklist are ready for provider-console configuration. The actual Vercel/Render values, Firebase domains, staging credentials, and legal approval must be supplied or confirmed by the project owner; they are not fabricated in source control.
