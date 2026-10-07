"use client";

import { useState, useEffect } from "react";

type LocationId = "regiobar" | "capelle" | "nissewaard";

interface Callback {
  id: string;
  name: string;
  phone: string;
  dateTime: string;
  note: string;
  location: LocationId;
  done: boolean;
}

const LOCATION_OPTIONS: { id: LocationId; label: string }[] = [
  { id: "regiobar", label: "Regio Bar" },
  { id: "capelle", label: "Capelle & PA" },
  { id: "nissewaard", label: "Nissewaard & HV" },
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

export default function CallbackList() {
  const [callbacks, setCallbacks] = useState<Callback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [note, setNote] = useState("");
  const [location, setLocation] = useState<LocationId>("regiobar");
  const [submitting, setSubmitting] = useState(false);

  async function loadCallbacks() {
    try {
      const res = await fetch("/api/callback");
      const data = await res.json();
      setCallbacks(data.callbacks ?? []);
    } catch {
      console.error("Terugbelafspraken laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCallbacks();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !dateTime) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          dateTime: new Date(dateTime).toISOString(),
          note: note.trim(),
          location,
        }),
      });

      if (res.ok) {
        setName("");
        setPhone("");
        setDateTime("");
        setNote("");
        setShowForm(false);
        await loadCallbacks();
      }
    } catch {
      console.error("Terugbelafspraak aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDone(id: string, done: boolean) {
    try {
      await fetch("/api/callback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: !done }),
      });
      setCallbacks((prev) =>
        prev.map((c) => (c.id === id ? { ...c, done: !done } : c))
      );
    } catch {
      console.error("Terugbelafspraak bijwerken mislukt");
    }
  }

  const open = callbacks.filter((c) => !c.done);
  const done = callbacks.filter((c) => c.done);

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
        <h2 className="card__title">Terugbelafspraken</h2>
        <span className="card__badge">{open.length} openstaand</span>
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Laden...
          </div>
        )}

        {!loading && open.length === 0 && done.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📞</div>
            <p>Geen terugbelafspraken</p>
          </div>
        )}

        {!loading && open.length > 0 && (
          <>
            <div className="section-divider">Openstaand</div>
            {open.map((cb) => (
              <div key={cb.id} className="callback-item">
                <div className="callback-item__top">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={false}
                    onChange={() => toggleDone(cb.id, cb.done)}
                    aria-label={`Markeer terugbelafspraak ${cb.name} als afgerond`}
                  />
                  <span className="callback-item__name">{cb.name}</span>
                  <a
                    href={`tel:${cb.phone}`}
                    className="callback-item__phone"
                  >
                    {cb.phone}
                  </a>
                  <span className={`loc-badge loc-badge--${cb.location}`}>
                    {LOCATION_OPTIONS.find((l) => l.id === cb.location)?.label}
                  </span>
                </div>
                <div className="callback-item__datetime">
                  {formatDateTime(cb.dateTime)}
                </div>
                {cb.note && (
                  <div className="callback-item__note">{cb.note}</div>
                )}
              </div>
            ))}
          </>
        )}

        {!loading && done.length > 0 && (
          <>
            <div className="section-divider">Afgerond</div>
            {done.slice(0, 5).map((cb) => (
              <div
                key={cb.id}
                className="callback-item callback-item--done"
              >
                <div className="callback-item__top">
                  <input
                    type="checkbox"
                    className="todo-checkbox"
                    checked={true}
                    onChange={() => toggleDone(cb.id, cb.done)}
                    aria-label={`Markeer terugbelafspraak ${cb.name} als openstaand`}
                  />
                  <span className="callback-item__name">{cb.name}</span>
                  <span className="callback-item__phone">{cb.phone}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-md">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Naam *</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Naam contactpersoon"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefoonnummer *</label>
              <input
                type="tel"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06-12345678"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Datum/tijd *</label>
              <input
                type="datetime-local"
                className="form-input"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Vestiging *</label>
              <select
                className="form-select"
                value={location}
                onChange={(e) => setLocation(e.target.value as LocationId)}
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notitie</label>
            <textarea
              className="form-textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Waar gaat het over?"
              rows={2}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? "Opslaan..." : "Toevoegen"}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setShowForm(false)}
            >
              Annuleren
            </button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>
          + Nieuwe terugbelafspraak
        </button>
      )}
    </div>
  );
}
