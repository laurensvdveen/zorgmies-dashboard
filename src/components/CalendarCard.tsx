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

const DAYS_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const DAYS_FULL = [
  "Zondag",
  "Maandag",
  "Dinsdag",
  "Woensdag",
  "Donderdag",
  "Vrijdag",
  "Zaterdag",
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Build array of 14 Date objects starting from today */
function buildTwoWeeks(): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/** Get label for a day relative to today */
function getDayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (isSameDay(date, today)) return "Vandaag";
  if (isSameDay(date, tomorrow)) return "Morgen";
  return DAYS_FULL[date.getDay()];
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

  const days = buildTwoWeeks();

  // Group events by day
  const eventsByDay = days.map((day) => ({
    date: day,
    events: events.filter((evt) => isSameDay(new Date(evt.start), day)),
  }));

  const week1 = eventsByDay.slice(0, 7);
  const week2 = eventsByDay.slice(7, 14);

  return (
    <div className="card">
      <div className="card__header">
        <svg
          className="card__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <h2 className="card__title">Agenda</h2>
        <span className="card__badge">{events.length} afspraken</span>
      </div>

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

      {!loading && !error && (
        <div className="cal-grid">
          {[week1, week2].map((week, wi) => (
            <div key={wi} className="cal-grid__week">
              {week.map(({ date, events: dayEvents }) => {
                const today = isToday(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={date.toISOString()}
                    className={`cal-day ${today ? "cal-day--today" : ""} ${isWeekend ? "cal-day--weekend" : ""}`}
                  >
                    <div className="cal-day__header">
                      <span className="cal-day__num">{date.getDate()}</span>
                      <span className="cal-day__name">
                        {today ? "Vandaag" : DAYS_SHORT[date.getDay()]}
                      </span>
                    </div>
                    <div className="cal-day__events">
                      {dayEvents.length === 0 && (
                        <span className="cal-day__empty">Geen afspraken</span>
                      )}
                      {dayEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className={`cal-event cal-event--${evt.locationId}`}
                          title={`${evt.subject}${evt.location ? ` — ${evt.location}` : ""} (${evt.locationLabel})`}
                        >
                          <span className="cal-event__time">
                            {evt.isAllDay
                              ? "Hele dag"
                              : `${formatTime(evt.start)} - ${formatTime(evt.end)}`}
                          </span>
                          <span className="cal-event__title">
                            {evt.subject}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
