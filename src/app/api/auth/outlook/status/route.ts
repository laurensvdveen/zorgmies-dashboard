import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import type { StoredTokens } from "@/app/api/auth/callback/route";

export const dynamic = "force-dynamic";

type LocationId = "regiobar" | "capelle" | "nissewaard";

const LOCATIONS: LocationId[] = ["regiobar", "capelle", "nissewaard"];

export interface LocationStatus {
  id: LocationId;
  connected: boolean;
  userEmail?: string;
  userName?: string;
  connectedAt?: string;
}

/**
 * GET /api/auth/outlook/status
 *
 * Returns connection status for each location.
 */
export async function GET() {
  try {
    const statuses: LocationStatus[] = await Promise.all(
      LOCATIONS.map(async (id) => {
        const tokens = await kv.get<StoredTokens>(
          `zorgmies:outlook:${id}:tokens`
        );

        if (tokens) {
          return {
            id,
            connected: true,
            userEmail: tokens.userEmail,
            userName: tokens.userName,
            connectedAt: tokens.connectedAt,
          };
        }

        return { id, connected: false };
      })
    );

    return NextResponse.json({ locations: statuses });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { error: "Status ophalen mislukt", locations: [] },
      { status: 500 }
    );
  }
}
