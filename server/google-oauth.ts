/**
 * Google OAuth 2.0 token manager for Earth Engine access.
 * Uses the Authorization Code flow — server stores tokens, frontend
 * redirects through /api/auth/google → /api/auth/google/callback.
 */

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET!;
const EE_SCOPE = "https://www.googleapis.com/auth/earthengine.readonly";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const SCOPES = [EE_SCOPE, DRIVE_SCOPE].join(" ");

interface TokenStore {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let store: TokenStore | null = null;

export function getRedirectUri(): string {
  const domains = process.env.REPLIT_DOMAINS || "";
  const primary = domains.split(",")[0]?.trim();
  if (primary) return `https://${primary}/api/auth/google/callback`;
  return "http://localhost:5000/api/auth/google/callback";
}

export function buildAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<void> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(d)}`);
  store = {
    accessToken: d.access_token,
    refreshToken: d.refresh_token || store?.refreshToken || "",
    expiresAt: Date.now() + (d.expires_in - 60) * 1000,
  };
  console.log("[GoogleOAuth] Token stored, expires in", d.expires_in, "s");
}

async function refreshToken(): Promise<void> {
  if (!store?.refreshToken) throw new Error("No refresh token — re-authenticate via /api/auth/google");
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: store.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`Refresh failed: ${JSON.stringify(d)}`);
  store = {
    ...store,
    accessToken: d.access_token,
    expiresAt: Date.now() + (d.expires_in - 60) * 1000,
  };
}

export async function getAccessToken(): Promise<string> {
  if (!store) throw new Error("Not authenticated — visit /api/auth/google");
  if (Date.now() >= store.expiresAt) await refreshToken();
  return store.accessToken;
}

export function getAuthStatus() {
  if (!store) return { authenticated: false, expiresAt: null };
  return {
    authenticated: true,
    expiresAt: new Date(store.expiresAt).toISOString(),
    tokenValid: Date.now() < store.expiresAt,
    scopes: SCOPES.split(" "),
  };
}
