import { NextRequest, NextResponse } from "next/server";

// This route handles the OAuth callback for Microsoft Graph
// In a client_credentials flow this isn't strictly needed,
// but it's here for future delegated auth or admin consent flows.

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `OAuth fout: ${error}` },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Geen autorisatiecode ontvangen" },
      { status: 400 }
    );
  }

  // For client_credentials flow, tokens are acquired server-side
  // This endpoint is a placeholder for admin consent redirect
  return NextResponse.redirect(new URL("/", request.url));
}
