"use client";

import { useState, useEffect } from "react";
import { getWeatherInfo } from "@/lib/weather";
import type { WeatherData } from "@/lib/weather";

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Fout bij ophalen");
        const data = await res.json();
        setWeather(data);
      } catch {
        setError("Weer kon niet worden opgehaald");
      }
    }
    load();
    const interval = setInterval(load, 10 * 60 * 1000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="card">
        <div className="card__header">
          <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
          </svg>
          <h2 className="card__title">Weer — Ridderkerk</h2>
        </div>
        <div className="empty-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="card">
        <div className="card__header">
          <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" />
          </svg>
          <h2 className="card__title">Weer — Ridderkerk</h2>
        </div>
        <div className="loading">
          <div className="loading__spinner" />
          Weer ophalen...
        </div>
      </div>
    );
  }

  const info = getWeatherInfo(weather.weatherCode);
  const isRaining = weather.precipitation > 0;

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42" />
        </svg>
        <h2 className="card__title">Weer — Ridderkerk</h2>
      </div>

      <div className="weather__current">
        <span className="weather__icon">{info.icon}</span>
        <div>
          <div className="weather__temp">{Math.round(weather.temperature)}°C</div>
          <div className="weather__desc">{info.label}</div>
        </div>
      </div>

      <div className="weather__details">
        <div className="weather__detail">
          <strong>Voelt als</strong> {Math.round(weather.apparentTemperature)}°C
        </div>
        <div className="weather__detail">
          <strong>Wind</strong> {Math.round(weather.windSpeed)} km/u
        </div>
        <div className="weather__detail">
          <strong>Vocht</strong> {weather.humidity}%
        </div>
        <div className="weather__detail">
          <strong>Regen</strong> {isRaining ? `${weather.precipitation} mm` : "Nee"}
        </div>
      </div>

      {weather.hourlyForecast.length > 0 && (
        <div className="mt-md">
          <div className="section-divider">Komende uren</div>
          <div style={{ display: "flex", gap: "var(--space-md)", overflowX: "auto" }}>
            {weather.hourlyForecast.map((h) => {
              const hourInfo = getWeatherInfo(h.weatherCode);
              const hour = new Date(h.time).getHours();
              return (
                <div key={h.time} style={{ textAlign: "center", minWidth: 48 }}>
                  <div className="text-sm text-muted">{hour}:00</div>
                  <div style={{ fontSize: "1.2rem" }}>{hourInfo.icon}</div>
                  <div className="text-sm" style={{ fontWeight: 600 }}>
                    {Math.round(h.temperature)}°
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
