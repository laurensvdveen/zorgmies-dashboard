import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * GET /api/auth/callback
 *
 * Microsoft OAuth callback. Receives the authorization code,
 * exchanges it for access + refresh tokens, stores them in Vercel KV,
 * and redirects back to the setup page.
 */

const TENANT_ID = process.env.AZURE_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET ?? "";
const REDIRECT_URI =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://zorgmies-dashboard.vercel.app") +
  "/api/auth/callback";

const VALID_LOCATIONS = ["regiobar", "capelle", "nissewaard"];

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GraphUser {
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  userEmail: string;
  userName: string;
  connectedAt: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // location ID
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://zorgmies-dashboard.vercel.app";

  if (error) {
    console.error(`OAuth error: ${error} - ${errorDescription}`);
    const url = new URL("/setup", appUrl);
    url.searchParams.set("error", errorDescription ?? error);
    return NextResponse.redirect(url.toString());
  }

  if (!code) {
    const url = new URL("/setup", appUrl);
    url.searchParams.set("error", "Geen autorisatiecode ontvangen");
    return NextResponse.redirect(url.toString());
  }

  if (!state || !VALID_LOCATIONS.includes(state)) {
    const url = new URL("/setup", appUrl);
    url.searchParams.set("error", "Ongeldige vestiging in state-parameter");
    return NextResponse.redirect(url.toString());
  }

  try {
    // Exchange authorization code for tokens
    const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      scope:
        "openid profile email offline_access Mail.Read Calendars.Read User.Read",
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      const url = new URL("/setup", appUrl);
      url.searchParams.set("error", "Token uitwisseling mislukt");
      return NextResponse.redirect(url.toString());
    }

    const tokenData: TokenResponse = await tokenRes.json();

    // Fetch user profile to get email address
    const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let userEmail = "";
    let userName = "";
    if (userRes.ok) {
      const userData: GraphUser = await userRes.json();
      userEmail = userData.mail ?? userData.userPrincipalName ?? "";
      userName = userData.displayName ?? "";
    }

    // Store tokens in Vercel KV
    const storedTokens: StoredTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + tokenData.expires_in * 1000,
      userEmail,
      userName,
      connectedAt: new Date().toISOString(),
    };

    await kv.set(`zorgmies:outlook:${state}:tokens`, storedTokens);

    // Redirect to setup page with success
    const url = new URL("/setup", appUrl);
    url.searchParams.set("connected", state);
    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("OAuth callback error:", err);
    const url = new URL("/setup", appUrl);
    url.searchParams.set("error", "Er ging iets mis bij het koppelen");
    return NextResponse.redirect(url.toString());
  }
}
