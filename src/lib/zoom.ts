import { encrypt, decrypt } from "./encryption";

const ZOOM_API_BASE = "https://api.zoom.us/v2";

interface ZoomTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface ZoomMeetingResponse {
  id: number;
  join_url: string;
  topic: string;
  duration: number;
  start_url: string;
}

/**
 * Exchange an authorization code for access/refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<ZoomTokenResponse> {
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token exchange failed: ${err}`);
  }

  return res.json();
}

/**
 * Refresh an expired access token using the refresh token.
 */
export async function refreshAccessToken(
  encryptedRefreshToken: string
): Promise<ZoomTokenResponse> {
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET!;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const refreshToken = decrypt(encryptedRefreshToken);

  const res = await fetch("https://zoom.us/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token refresh failed: ${err}`);
  }

  return res.json();
}

/**
 * Get a valid access token for a workspace, refreshing if expired.
 * Returns the decrypted access token and optional new encrypted tokens if refreshed.
 */
export async function getValidAccessToken(integration: {
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string | null;
}): Promise<{
  accessToken: string;
  refreshed: boolean;
  newAccessTokenEncrypted?: string;
  newRefreshTokenEncrypted?: string;
  newExpiresAt?: Date;
}> {
  const expiresAt = integration.token_expires_at
    ? new Date(integration.token_expires_at)
    : null;

  // If token is still valid (with 5min buffer), use it
  if (expiresAt && expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return {
      accessToken: decrypt(integration.access_token_encrypted),
      refreshed: false,
    };
  }

  // Token expired or about to expire — refresh
  const tokens = await refreshAccessToken(integration.refresh_token_encrypted);
  return {
    accessToken: tokens.access_token,
    refreshed: true,
    newAccessTokenEncrypted: encrypt(tokens.access_token),
    newRefreshTokenEncrypted: encrypt(tokens.refresh_token),
    newExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  };
}

/**
 * Create a Zoom meeting using the Zoom API.
 */
export async function createZoomMeeting(
  accessToken: string,
  options: { topic: string; duration?: number }
): Promise<ZoomMeetingResponse> {
  const res = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: options.topic,
      type: 2, // Scheduled meeting
      duration: options.duration || 60,
      settings: {
        join_before_host: true,
        waiting_room: false,
        video: { host: true, participant: true },
        audio: "both",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom create meeting failed: ${err}`);
  }

  return res.json();
}

/**
 * Encrypt tokens from a Zoom OAuth response for database storage.
 */
export function encryptTokens(tokens: ZoomTokenResponse) {
  return {
    accessTokenEncrypted: encrypt(tokens.access_token),
    refreshTokenEncrypted: encrypt(tokens.refresh_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  };
}

/**
 * Build the Zoom OAuth authorize URL.
 */
export function getZoomOAuthUrl(workspaceId: string): string {
  const clientId = process.env.ZOOM_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/zoom/oauth-callback`;
  const state = workspaceId; // We pass workspace ID as state

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `https://zoom.us/oauth/authorize?${params.toString()}`;
}
