import "server-only";
import { env } from "@/constants/env";

// Refresh this long before Shopify's expiry so a token can't lapse mid-request.
const EXPIRY_MARGIN_MS = 60_000;

let accessToken: string | null = null;
let expiresAt = 0;

// Returns the cached Admin API access token while it is still valid, and
// otherwise exchanges the client ID and secret for a new one.
export async function getAccessToken() {
  if (accessToken && Date.now() < expiresAt) return accessToken;

  const response = await fetch(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.SHOPIFY_CLIENT_ID,
        client_secret: env.SHOPIFY_CLIENT_SECRET,
        grant_type: "client_credentials",
      }),
    },
  );
  const body = await response.json().catch(() => null);

  if (!response.ok || !body?.access_token) {
    throw new Error(
      `Shopify refused to issue an access token (${response.status}): ${
        body?.error_description ?? body?.error ?? "no reason given"
      }`,
    );
  }

  const token: string = body.access_token;
  accessToken = token;
  expiresAt = Date.now() + body.expires_in * 1000 - EXPIRY_MARGIN_MS;
  return token;
}
