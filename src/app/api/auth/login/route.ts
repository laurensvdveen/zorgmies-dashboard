import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Wachtwoord is verplicht" },
        { status: 400 }
      );
    }

    const correctPassword = process.env.DASHBOARD_PASSWORD;

    if (!correctPassword) {
      return NextResponse.json(
        { error: "Beveiliging niet geconfigureerd" },
        { status: 500 }
      );
    }

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: "Onjuist wachtwoord" },
        { status: 401 }
      );
    }

    // Set auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("zorgmies-auth", process.env.AUTH_SECRET || "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Er is iets misgegaan" },
      { status: 500 }
    );
  }
}
