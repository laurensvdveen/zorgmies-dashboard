"use client";

import { useState, useEffect } from "react";

const DAYS = [
  "zondag",
  "maandag",
  "dinsdag",
  "woensdag",
  "donderdag",
  "vrijdag",
  "zaterdag",
];

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

function formatDutchDate(date: Date): string {
  const day = DAYS[date.getDay()];
  const dayNum = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${dayNum} ${month} ${year}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="card clock">
        <div className="clock__time">--:--:--</div>
        <div className="clock__date">Laden...</div>
      </div>
    );
  }

  return (
    <div className="card clock">
      <div className="clock__time">{formatTime(now)}</div>
      <div className="clock__date">{formatDutchDate(now)}</div>
    </div>
  );
}
