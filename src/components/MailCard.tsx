"use client";

import { useState, useEffect } from "react";

interface MailMessage {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  isRead: boolean;
  preview: string;
  locationId: string;
  locationLabel: string;
}

type LocationId = "regiobar" | "capelle" | "nissewaard";

const LOCATION_LABELS: Record<LocationId, string> = {
  regiobar: "Regio Bar",
  capelle: "Capelle & PA",
  nissewaard: "Nissewaard & HV",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Zojuist";
  if (diffMin < 60) return `${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} uur`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} dag${diffDays > 1 ? "en" : ""}`;
}

export default function MailCard() {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<LocationId, number>>({
    regiobar: 0,
    capelle: 0,
    nissewaard: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LocationId | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/outlook/mail");
        if (!res.ok) throw new Error("Fout bij ophalen");
        const data = await res.json();
        setMessages(data.messages ?? []);
        setUnreadCounts(
          data.unreadCounts ?? { regiobar: 0, capelle: 0, nissewaard: 0 }
        );
      } catch {
        setError("Mail kon niet worden opgehaald");
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const filtered =
    filter === "all"
      ? messages
      : messages.filter((m) => m.locationId === filter);

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 7l-10 7L2 7" />
        </svg>
        <h2 className="card__title">Mail</h2>
        {totalUnread > 0 && (
          <span className="card__badge">{totalUnread} ongelezen</span>
        )}
      </div>

      {/* Unread counters per location */}
      <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
        {(Object.keys(LOCATION_LABELS) as LocationId[]).map((locId) => (
          <div
            key={locId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-xs)",
            }}
          >
            <span className={`loc-badge loc-badge--${locId}`}>
              {LOCATION_LABELS[locId]}
            </span>
            {unreadCounts[locId] > 0 && (
              <span className={`unread-counter unread-counter--${locId}`}>
                {unreadCounts[locId]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Alle
        </button>
        {(Object.keys(LOCATION_LABELS) as LocationId[]).map((locId) => (
          <button
            key={locId}
            className={`filter-tab ${filter === locId ? "filter-tab--active" : ""}`}
            onClick={() => setFilter(locId)}
          >
            {LOCATION_LABELS[locId]}
          </button>
        ))}
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Mail laden...
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

        {!loading && !error && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📧</div>
            <p>Geen berichten</p>
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map((msg) => (
            <div key={msg.id} className="mail-item">
              <div
                className={`mail-item__dot ${!msg.isRead ? "mail-item__dot--unread" : ""}`}
              />
              <span className="mail-item__from">{msg.from}</span>
              <span className="mail-item__subject">
                {msg.subject}
                {msg.preview && (
                  <span className="text-muted"> — {msg.preview}</span>
                )}
              </span>
              <span className={`loc-badge loc-badge--${msg.locationId}`}>
                {msg.locationLabel}
              </span>
              <span className="mail-item__time">{timeAgo(msg.receivedAt)}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
