import { NextResponse } from "next/server";
import { fetchAllCalendarEvents } from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const events = await fetchAllCalendarEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Calendar API error:", error);
    return NextResponse.json(
      { error: "Agenda ophalen mislukt", events: [] },
      { status: 500 }
    );
  }
}
