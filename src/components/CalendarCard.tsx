"use client";

import { useState, useEffect } from "react";

interface CalendarEvent {
  id: string;
  subject: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location: string;
  locationId: string;
  locationLabel: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

export default function CalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/outlook/calendar");
        if (!res.ok) throw new Error("Fout bij ophalen");
        const data = await res.json();
        setEvents(data.events ?? []);
      } catch {
        setError("Agenda kon niet worden opgehaald");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const todayEvents = events.filter((e) => isToday(e.start));
  const tomorrowEvents = events.filter((e) => !isToday(e.start));

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <h2 className="card__title">Agenda</h2>
        <span className="card__badge">{events.length} afspraken</span>
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Agenda laden...
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p>{error}</p>
            <p className="text-sm text-muted mt-sm">
              Controleer de Microsoft 365 instellingen
            </p>
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📅</div>
            <p>Geen afspraken vandaag en morgen</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {todayEvents.length > 0 && (
              <>
                <div className="section-divider">Vandaag</div>
                {todayEvents.map((evt) => (
                  <div key={evt.id} className="list-item">
                    <span className="list-item__time">
                      {evt.isAllDay ? "Hele dag" : formatTime(evt.start)}
                    </span>
                    <div className="list-item__content">
                      <div className="list-item__title">{evt.subject}</div>
                      {evt.location && (
                        <div className="list-item__subtitle">{evt.location}</div>
                      )}
                    </div>
                    <span className={`loc-badge loc-badge--${evt.locationId}`}>
                      {evt.locationLabel}
                    </span>
                  </div>
                ))}
              </>
            )}

            {tomorrowEvents.length > 0 && (
              <>
                <div className="section-divider">Morgen</div>
                {tomorrowEvents.map((evt) => (
                  <div key={evt.id} className="list-item">
                    <span className="list-item__time">
                      {evt.isAllDay ? "Hele dag" : formatTime(evt.start)}
                    </span>
                    <div className="list-item__content">
                      <div className="list-item__title">{evt.subject}</div>
                      {evt.location && (
                        <div className="list-item__subtitle">{evt.location}</div>
                      )}
                    </div>
                    <span className={`loc-badge loc-badge--${evt.locationId}`}>
                      {evt.locationLabel}
                    </span>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
