import { createHmac, timingSafeEqual } from "node:crypto";
import { ENV } from "./_core/env";

export type SocialProvider = "google" | "youtube" | "facebook" | "instagram" | "tiktok";

type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
};

export type OAuthState = {
  userId: number;
  provider: SocialProvider;
  origin: string;
  issuedAt: number;
};

export type ProviderProfile = {
  id: string;
  name: string;
  username?: string;
  email?: string;
  profilePicture?: string;
  raw: unknown;
};

const OAUTH_CONFIG: Record<SocialProvider, OAuthConfig> = {
  google: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid profile email",
  },
  youtube: {
    clientId: process.env.YOUTUBE_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET ?? "",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scope: "openid profile email https://www.googleapis.com/auth/youtube.readonly",
  },
  facebook: {
    clientId: process.env.FACEBOOK_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.FACEBOOK_OAUTH_CLIENT_SECRET ?? "",
    authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scope: "public_profile,email",
  },
  instagram: {
    clientId: process.env.INSTAGRAM_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.INSTAGRAM_OAUTH_CLIENT_SECRET ?? "",
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scope: "user_profile,user_media",
  },
  tiktok: {
    clientId: process.env.TIKTOK_OAUTH_CLIENT_ID ?? "",
    clientSecret: process.env.TIKTOK_OAUTH_CLIENT_SECRET ?? "",
    authUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    scope: "user.info.basic,user.info.profile",
  },
};

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getConfig(provider: SocialProvider): OAuthConfig {
  const config = OAUTH_CONFIG[provider];
  if (!config.clientId || !config.clientSecret) {
    throw new Error(`${provider} OAuth is not configured. Add the provider credentials before linking an account.`);
  }
  if (!ENV.cookieSecret) throw new Error("JWT_SECRET is required to protect OAuth state.");
  return config;
}

function normalizeOrigin(origin: string): string {
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("OAuth origin must use HTTPS outside local development.");
  }
  return parsed.origin;
}

export function createOAuthState(state: OAuthState): string {
  const payload = base64Url(JSON.stringify({ ...state, origin: normalizeOrigin(state.origin) }));
  const signature = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(value: string, expectedProvider?: SocialProvider): OAuthState {
  const [payload, signature] = value.split(".");
  if (!payload || !signature || !ENV.cookieSecret) throw new Error("Invalid OAuth state.");
  const expected = createHmac("sha256", ENV.cookieSecret).update(payload).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("Invalid OAuth state signature.");
  const parsed = JSON.parse(decodeBase64Url(payload)) as OAuthState;
  if (!parsed.userId || !parsed.origin || !parsed.provider || !parsed.issuedAt) throw new Error("Incomplete OAuth state.");
  if (expectedProvider && parsed.provider !== expectedProvider) throw new Error("OAuth provider mismatch.");
  if (Date.now() - parsed.issuedAt > 10 * 60 * 1000) throw new Error("OAuth state has expired.");
  normalizeOrigin(parsed.origin);
  return parsed;
}

export function getSocialCallbackUrl(origin: string, provider: SocialProvider): string {
  const callback = new URL("/api/social/callback", normalizeOrigin(origin));
  callback.searchParams.set("provider", provider);
  return callback.toString();
}

export function buildAuthorizationUrl(provider: SocialProvider, origin: string, userId: number): string {
  const config = getConfig(provider);
  const state = createOAuthState({ userId, provider, origin, issuedAt: Date.now() });
  const callbackUrl = getSocialCallbackUrl(origin, provider);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: config.scope,
    state,
  });
  if (provider === "youtube" || provider === "google") params.set("access_type", "offline");
  if (provider === "youtube" || provider === "google") params.set("prompt", "consent");
  return `${config.authUrl}?${params.toString()}`;
}

async function readJson(response: Response): Promise<Record<string, any>> {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.error) {
    const detail = body.error_description ?? body.error?.message ?? response.statusText;
    throw new Error(`Provider authorization failed: ${detail}`);
  }
  return body;
}

export async function exchangeCode(provider: SocialProvider, code: string, origin: string) {
  const config = getConfig(provider);
  const redirectUri = getSocialCallbackUrl(origin, provider);
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  if (provider === "tiktok") {
    params.delete("client_id");
    params.set("client_key", config.clientId);
  }
  const requestUrl = provider === "facebook" ? `${config.tokenUrl}?${params.toString()}` : config.tokenUrl;
  const response = await fetch(requestUrl, {
    method: provider === "facebook" ? "GET" : "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    ...(provider === "facebook" ? {} : { body: params.toString() }),
  });
  const token = await readJson(response);
  const accessToken = token.access_token;
  if (typeof accessToken !== "string" || !accessToken) throw new Error("Provider did not return an access token.");
  return { accessToken, refreshToken: typeof token.refresh_token === "string" ? token.refresh_token : null, expiresIn: Number(token.expires_in ?? 3600) };
}

export async function fetchProviderProfile(provider: SocialProvider, accessToken: string): Promise<ProviderProfile> {
  let endpoint = "";
  switch (provider) {
    case "google": endpoint = "https://openidconnect.googleapis.com/v1/userinfo"; break;
    case "youtube": endpoint = "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true"; break;
    case "facebook": endpoint = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`; break;
    case "instagram": endpoint = `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(accessToken)}`; break;
    case "tiktok": endpoint = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url"; break;
  }
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await readJson(response);
  if (provider === "youtube") {
    const channel = body.items?.[0];
    if (!channel?.id) throw new Error("No YouTube channel was returned for this account.");
    return { id: channel.id, name: channel.snippet?.title ?? "YouTube channel", profilePicture: channel.snippet?.thumbnails?.default?.url, raw: body };
  }
  if (provider === "tiktok") {
    const profile = body.data?.user;
    if (!profile?.open_id) throw new Error("TikTok profile was not returned.");
    return { id: profile.open_id, name: profile.display_name ?? "TikTok account", username: profile.display_name, profilePicture: profile.avatar_url, raw: body };
  }
  const id = body.id;
  if (typeof id !== "string") throw new Error("Provider profile was not returned.");
  return { id, name: body.name ?? body.username ?? "Linked account", username: body.username, email: body.email, profilePicture: body.picture?.data?.url ?? body.picture, raw: body };
}
