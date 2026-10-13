"use client";

import { useState, useEffect, useRef } from "react";

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

const LOCATION_OPTIONS: { id: LocationId; label: string; color: string }[] = [
  { id: "regiobar", label: "Regio Bar", color: "var(--color-loc-regiobar)" },
  { id: "capelle", label: "Capelle & PA", color: "var(--color-loc-capelle)" },
  { id: "nissewaard", label: "Nissewaard & HV", color: "var(--color-loc-nissewaard)" },
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

function toLocalDateTimeValue(iso: string): string {
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
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
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDateTime, setEditDateTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editLocation, setEditLocation] = useState<LocationId>("regiobar");

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = ctx;
    return () => { ctx.close(); };
  }, []);

  function playCompleteSound() {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state === "closed") return;
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1174.66, now + 0.1);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.15, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } catch { /* Audio not available */ }
  }

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

  function startEdit(cb: Callback) {
    setEditingId(cb.id);
    setEditName(cb.name);
    setEditPhone(cb.phone);
    setEditDateTime(toLocalDateTimeValue(cb.dateTime));
    setEditNote(cb.note);
    setEditLocation(cb.location);
  }

  async function handleEditSave(id: string) {
    if (!editName.trim() || !editPhone.trim() || !editDateTime) return;
    try {
      await fetch("/api/callback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName.trim(),
          phone: editPhone.trim(),
          dateTime: new Date(editDateTime).toISOString(),
          note: editNote.trim(),
          location: editLocation,
        }),
      });
      setEditingId(null);
      await loadCallbacks();
    } catch {
      console.error("Terugbelafspraak bijwerken mislukt");
    }
  }

  async function toggleDone(id: string, done: boolean) {
    if (!done) {
      playCompleteSound();
      setCompletingIds((prev) => new Set(prev).add(id));
      setTimeout(async () => {
        try {
          await fetch("/api/callback", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, done: true }),
          });
          setCallbacks((prev) =>
            prev.map((c) => (c.id === id ? { ...c, done: true } : c))
          );
        } catch {
          console.error("Terugbelafspraak bijwerken mislukt");
        } finally {
          setCompletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      }, 600);
    } else {
      try {
        await fetch("/api/callback", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, done: false }),
        });
        setCallbacks((prev) =>
          prev.map((c) => (c.id === id ? { ...c, done: false } : c))
        );
      } catch {
        console.error("Terugbelafspraak bijwerken mislukt");
      }
    }
  }

  const open = callbacks.filter((c) => !c.done);
  const done = callbacks.filter((c) => c.done);

  // Group open callbacks by location
  const groupedByLocation = LOCATION_OPTIONS.map((loc) => ({
    ...loc,
    items: open.filter((c) => c.location === loc.id),
  })).filter((g) => g.items.length > 0);

  function renderCallbackItem(cb: Callback, isDone: boolean) {
    if (editingId === cb.id) {
      return (
        <div key={cb.id} className="inline-edit">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Naam</label>
              <input type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefoon</label>
              <input type="tel" className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Datum/tijd</label>
              <input type="datetime-local" className="form-input" value={editDateTime} onChange={(e) => setEditDateTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Vestiging</label>
              <select className="form-select" value={editLocation} onChange={(e) => setEditLocation(e.target.value as LocationId)}>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notitie</label>
            <textarea className="form-textarea" value={editNote} onChange={(e) => setEditNote(e.target.value)} rows={2} />
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button className="btn btn--primary btn--sm" onClick={() => handleEditSave(cb.id)}>Opslaan</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setEditingId(null)}>Annuleren</button>
          </div>
        </div>
      );
    }

    return (
      <div key={cb.id} className={`callback-item ${isDone ? "callback-item--done" : ""} ${completingIds.has(cb.id) ? "callback-item--completing" : ""}`}>
        <div className="callback-item__top">
          <input
            type="checkbox"
            className="todo-checkbox"
            checked={isDone}
            onChange={() => toggleDone(cb.id, cb.done)}
            aria-label={`Markeer terugbelafspraak ${cb.name} als ${isDone ? "openstaand" : "afgerond"}`}
          />
          <span className="callback-item__name">{cb.name}</span>
          <a href={`tel:${cb.phone}`} className="callback-item__phone">{cb.phone}</a>
          {!isDone && (
            <button
              className="btn--icon"
              onClick={() => startEdit(cb)}
              aria-label="Bewerk terugbelafspraak"
              title="Bewerken"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          )}
        </div>
        <div className="callback-item__datetime">
          {formatDateTime(cb.dateTime)}
        </div>
        {cb.note && (
          <div className="callback-item__note">{cb.note}</div>
        )}
      </div>
    );
  }

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

        {/* Open callbacks grouped by region */}
        {!loading && groupedByLocation.map((group) => (
          <div key={group.id} className="region-section">
            <div className="region-section__header">
              <div className="region-section__dot" style={{ background: group.color }} />
              <span className="region-section__label">{group.label}</span>
              <span className="region-section__count">{group.items.length}</span>
            </div>
            {group.items.map((cb) => renderCallbackItem(cb, false))}
          </div>
        ))}

        {/* Done section */}
        {!loading && done.length > 0 && (
          <>
            <div className="section-divider" style={{ marginTop: "var(--space-md)" }}>Afgerond</div>
            {done.slice(0, 5).map((cb) => renderCallbackItem(cb, true))}
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
                  <option key={loc.id} value={loc.id}>{loc.label}</option>
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
