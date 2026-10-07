"use client";

import { useState, useEffect } from "react";
import { getWeatherInfo } from "@/lib/weather";
import type { WeatherData } from "@/lib/weather";

export default function HeaderWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Fout bij ophalen");
        const data = await res.json();
        setWeather(data);
      } catch {
        // silently fail in header — compact display
      }
    }
    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) {
    return (
      <div className="header-weather">
        <span className="header-weather__icon">☁️</span>
        <span className="header-weather__temp">--°C</span>
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);

  return (
    <div className="header-weather">
      <span className="header-weather__icon">{info.icon}</span>
      <div className="header-weather__info">
        <span className="header-weather__temp">{Math.round(weather.temperature)}°C</span>
        <span className="header-weather__desc">{info.label}</span>
      </div>
    </div>
  );
}
