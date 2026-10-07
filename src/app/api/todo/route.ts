import { NextRequest, NextResponse } from "next/server";
import { getTodos, addTodo, updateTodo, deleteTodo } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const todos = await getTodos();
    return NextResponse.json({ todos });
  } catch (error) {
    console.error("Todo GET error:", error);
    return NextResponse.json({ error: "Taken ophalen mislukt", todos: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description = "", location } = body;

    if (!title || !location) {
      return NextResponse.json(
        { error: "Titel en vestiging zijn verplicht" },
        { status: 400 }
      );
    }

    const todo = await addTodo({ title, description, location });
    return NextResponse.json({ todo }, { status: 201 });
  } catch (error) {
    console.error("Todo POST error:", error);
    return NextResponse.json({ error: "Taak aanmaken mislukt" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }

    const todo = await updateTodo(id, updates);
    if (!todo) {
      return NextResponse.json({ error: "Taak niet gevonden" }, { status: 404 });
    }

    return NextResponse.json({ todo });
  } catch (error) {
    console.error("Todo PATCH error:", error);
    return NextResponse.json({ error: "Taak bijwerken mislukt" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }

    const deleted = await deleteTodo(id);
    if (!deleted) {
      return NextResponse.json({ error: "Taak niet gevonden" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Todo DELETE error:", error);
    return NextResponse.json({ error: "Taak verwijderen mislukt" }, { status: 500 });
  }
}
