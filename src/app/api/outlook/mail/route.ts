import { NextResponse } from "next/server";
import { fetchAllMail } from "@/lib/outlook";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchAllMail();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Mail API error:", error);
    return NextResponse.json(
      { error: "Mail ophalen mislukt", messages: [], unreadCounts: { regiobar: 0, capelle: 0, nissewaard: 0 } },
      { status: 500 }
    );
  }
}
