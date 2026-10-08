import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/outlook?location=regiobar
 *
 * Starts the Microsoft OAuth authorization code flow.
 * Redirects the user to Microsoft login where they sign in
 * with the email for the given location and grant consent.
 */

const TENANT_ID = process.env.AZURE_TENANT_ID ?? "";
const CLIENT_ID = process.env.AZURE_CLIENT_ID ?? "";
const REDIRECT_URI =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://zorgmies-dashboard.vercel.app") +
  "/api/auth/callback";

const VALID_LOCATIONS = ["regiobar", "capelle", "nissewaard"];

export async function GET(request: NextRequest) {
  const location = request.nextUrl.searchParams.get("location");

  if (!location || !VALID_LOCATIONS.includes(location)) {
    return NextResponse.json(
      { error: "Ongeldige vestiging. Kies: regiobar, capelle of nissewaard" },
      { status: 400 }
    );
  }

  if (!TENANT_ID || !CLIENT_ID) {
    return NextResponse.json(
      { error: "Azure-configuratie ontbreekt" },
      { status: 500 }
    );
  }

  // Build the Microsoft OAuth authorization URL
  const authUrl = new URL(
    `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize`
  );

  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_mode", "query");
  // Delegated scopes: read mail, read calendar, offline (refresh tokens), user profile
  authUrl.searchParams.set(
    "scope",
    "openid profile email offline_access Mail.Read Calendars.Read User.Read"
  );
  // State carries the location ID so the callback knows which location to store for
  authUrl.searchParams.set("state", location);
  // Prompt=consent ensures the user sees the consent screen
  authUrl.searchParams.set("prompt", "consent");

  return NextResponse.redirect(authUrl.toString());
}
