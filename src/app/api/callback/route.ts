import { NextRequest, NextResponse } from "next/server";
import {
  getCallbacks,
  addCallback,
  updateCallback,
  deleteCallback,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const callbacks = await getCallbacks();
    return NextResponse.json({ callbacks });
  } catch (error) {
    console.error("Callback GET error:", error);
    return NextResponse.json(
      { error: "Terugbelafspraken ophalen mislukt", callbacks: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, dateTime, note = "", location } = body;

    if (!name || !phone || !dateTime || !location) {
      return NextResponse.json(
        { error: "Naam, telefoon, datum/tijd en vestiging zijn verplicht" },
        { status: 400 }
      );
    }

    const callback = await addCallback({ name, phone, dateTime, note, location });
    return NextResponse.json({ callback }, { status: 201 });
  } catch (error) {
    console.error("Callback POST error:", error);
    return NextResponse.json(
      { error: "Terugbelafspraak aanmaken mislukt" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }

    const callback = await updateCallback(id, updates);
    if (!callback) {
      return NextResponse.json(
        { error: "Terugbelafspraak niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ callback });
  } catch (error) {
    console.error("Callback PATCH error:", error);
    return NextResponse.json(
      { error: "Terugbelafspraak bijwerken mislukt" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }

    const deleted = await deleteCallback(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Terugbelafspraak niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callback DELETE error:", error);
    return NextResponse.json(
      { error: "Terugbelafspraak verwijderen mislukt" },
      { status: 500 }
    );
  }
}
