import { NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";

export const revalidate = 600; // cache 10 minutes

export async function GET() {
  try {
    const weather = await fetchWeather();
    return NextResponse.json(weather);
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json(
      { error: "Weer ophalen mislukt" },
      { status: 500 }
    );
  }
}
