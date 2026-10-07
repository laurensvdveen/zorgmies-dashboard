import { NextRequest, NextResponse } from "next/server";
import {
  getIntakes,
  addIntake,
  updateIntake,
  deleteIntake,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const intakes = await getIntakes();
    return NextResponse.json({ intakes });
  } catch (error) {
    console.error("Intake GET error:", error);
    return NextResponse.json(
      { error: "Aanvragen ophalen mislukt", intakes: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      phone,
      address = "",
      careType = "",
      urgency = "normaal",
      location,
      notes = "",
    } = body;

    if (!clientName || !phone || !location) {
      return NextResponse.json(
        { error: "Naam, telefoon en vestiging zijn verplicht" },
        { status: 400 }
      );
    }

    const intake = await addIntake({
      clientName,
      phone,
      address,
      careType,
      urgency,
      location,
      notes,
    });
    return NextResponse.json({ intake }, { status: 201 });
  } catch (error) {
    console.error("Intake POST error:", error);
    return NextResponse.json(
      { error: "Aanvraag aanmaken mislukt" },
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

    const intake = await updateIntake(id, updates);
    if (!intake) {
      return NextResponse.json(
        { error: "Aanvraag niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ intake });
  } catch (error) {
    console.error("Intake PATCH error:", error);
    return NextResponse.json(
      { error: "Aanvraag bijwerken mislukt" },
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

    const deleted = await deleteIntake(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Aanvraag niet gevonden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Intake DELETE error:", error);
    return NextResponse.json(
      { error: "Aanvraag verwijderen mislukt" },
      { status: 500 }
    );
  }
}
