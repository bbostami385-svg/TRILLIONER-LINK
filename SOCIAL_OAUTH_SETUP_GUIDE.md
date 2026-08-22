# TRILLIONER LINK: Social OAuth Setup

The account-linking screen supports desktop-browser linking for Google, YouTube, Facebook, Instagram, and TikTok. The application now uses the provider’s authorization code flow, signs and expires the OAuth state, exchanges the code on the server, and never fabricates a linked account when credentials are missing.

## Required environment variables

Add only the providers that you have registered. Unused providers can remain unset; their buttons will return a configuration message instead of creating a fake connection.

| Provider | Client ID / Key | Client Secret |
|---|---|---|
| Google | `GOOGLE_OAUTH_CLIENT_ID` | `GOOGLE_OAUTH_CLIENT_SECRET` |
| YouTube | `YOUTUBE_OAUTH_CLIENT_ID` | `YOUTUBE_OAUTH_CLIENT_SECRET` |
| Facebook | `FACEBOOK_OAUTH_CLIENT_ID` | `FACEBOOK_OAUTH_CLIENT_SECRET` |
| Instagram | `INSTAGRAM_OAUTH_CLIENT_ID` | `INSTAGRAM_OAUTH_CLIENT_SECRET` |
| TikTok | `TIKTOK_OAUTH_CLIENT_ID` | `TIKTOK_OAUTH_CLIENT_SECRET` |

`JWT_SECRET` must also be configured because it signs the short-lived OAuth state. Keep all client secrets server-side; do not prefix them with `VITE_` and do not commit them to Git.

## Redirect URI

For every provider enabled in the dashboard, register this exact callback URI using the production domain:

```text
https://YOUR_DOMAIN/api/social/callback
```

For local development, register the local equivalent only if the provider allows it:

```text
http://localhost:3000/api/social/callback
```

The app builds the redirect URL from the current desktop browser origin, signs the origin into the state, and permits HTTPS origins in production. After consent, the server returns the user to `/settings?verification=accounts`.

## Security and operational notes

The provider callback requires an authenticated TRILLIONER LINK session and a valid, unexpired, signed state. Provider tokens are stored only on the server-side linked-account record and are not returned by the account-listing procedures. Unlinking clears stored access and refresh tokens while retaining the audit row.

The sync action retrieves the current provider profile through the provider API. It does not generate random follower counts, video counts, views, placeholder names, or mock tokens. Provider APIs may require separate scopes, app review, or a refresh-token strategy before production use.

KYC is not part of social account linking. Identity documents remain restricted to monetization and payout workflows, while human liveness remains the account-security check for new users.

## Vercel checklist

Set the variables for the providers you want to enable in the Vercel project’s server/runtime environment, confirm `JWT_SECRET` is present, register the production callback URI in each provider console, redeploy, and test from a desktop browser. Do not mark a provider as enabled until its consent screen returns to the callback without an error.
