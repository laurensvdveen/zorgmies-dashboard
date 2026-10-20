"use client";

import { useState, useEffect, useCallback } from "react";

type LocationId = "regiobar" | "capelle" | "nissewaard";
type Urgency = "hoog" | "normaal" | "laag";
type IntakeStatus = "open" | "in_behandeling" | "afgerond";

interface Intake {
  id: string;
  clientName: string;
  phone: string;
  address: string;
  careType: string;
  urgency: Urgency;
  location: LocationId;
  notes: string;
  status: IntakeStatus;
  createdAt: string;
}

const LOCATION_META: Record<LocationId, { label: string; color: string }> = {
  regiobar: { label: "Regio Bar", color: "var(--color-loc-regiobar)" },
  capelle: { label: "Capelle & PA", color: "var(--color-loc-capelle)" },
  nissewaard: { label: "Nissewaard & HV", color: "var(--color-loc-nissewaard)" },
};

const URGENCY_OPTIONS: { id: Urgency; label: string }[] = [
  { id: "hoog", label: "Hoog" },
  { id: "normaal", label: "Normaal" },
  { id: "laag", label: "Laag" },
];

const STATUS_LABELS: Record<IntakeStatus, string> = {
  open: "Open",
  in_behandeling: "In behandeling",
  afgerond: "Afgerond",
};

const CARE_TYPES = [
  "Persoonlijke verzorging",
  "Verpleging",
  "Begeleiding individueel",
  "Huishoudelijke hulp",
  "Dagbesteding",
  "Palliatieve zorg",
  "Anders",
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Amsterdam",
  });
}

interface Props {
  location: LocationId;
}

export default function IntakeForm({ location }: Props) {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<IntakeStatus | "all">("all");

  // Form state
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [careType, setCareType] = useState(CARE_TYPES[0]);
  const [urgency, setUrgency] = useState<Urgency>("normaal");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCareType, setEditCareType] = useState("");
  const [editUrgency, setEditUrgency] = useState<Urgency>("normaal");
  const [editNotes, setEditNotes] = useState("");

  const meta = LOCATION_META[location];

  const loadIntakes = useCallback(async () => {
    try {
      const res = await fetch("/api/intake");
      const data = await res.json();
      const all: Intake[] = data.intakes ?? [];
      setIntakes(all.filter((i) => i.location === location));
    } catch {
      console.error("Aanvragen laden mislukt");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadIntakes();
  }, [loadIntakes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          careType,
          urgency,
          location,
          notes: notes.trim(),
        }),
      });
      if (res.ok) {
        setClientName("");
        setPhone("");
        setAddress("");
        setCareType(CARE_TYPES[0]);
        setUrgency("normaal");
        setNotes("");
        setShowForm(false);
        await loadIntakes();
      }
    } catch {
      console.error("Aanvraag aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(intake: Intake) {
    setEditingId(intake.id);
    setEditClientName(intake.clientName);
    setEditPhone(intake.phone);
    setEditAddress(intake.address);
    setEditCareType(intake.careType);
    setEditUrgency(intake.urgency);
    setEditNotes(intake.notes);
  }

  async function handleEditSave(id: string) {
    if (!editClientName.trim() || !editPhone.trim()) return;
    try {
      await fetch("/api/intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          clientName: editClientName.trim(),
          phone: editPhone.trim(),
          address: editAddress.trim(),
          careType: editCareType,
          urgency: editUrgency,
          notes: editNotes.trim(),
        }),
      });
      setEditingId(null);
      await loadIntakes();
    } catch {
      console.error("Aanvraag bijwerken mislukt");
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/intake?id=${id}`, { method: "DELETE" });
      setIntakes((prev) => prev.filter((i) => i.id !== id));
    } catch {
      console.error("Aanvraag verwijderen mislukt");
    }
  }

  async function updateStatus(id: string, status: IntakeStatus) {
    try {
      await fetch("/api/intake", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setIntakes((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
    } catch {
      console.error("Status bijwerken mislukt");
    }
  }

  const filtered =
    filter === "all"
      ? intakes.filter((i) => i.status !== "afgerond")
      : intakes.filter((i) => i.status === filter);

  const openCount = intakes.filter((i) => i.status === "open").length;

  function renderIntakeItem(intake: Intake) {
    if (editingId === intake.id) {
      return (
        <div key={intake.id} className="inline-edit">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Naam</label>
              <input type="text" className="form-input" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefoon</label>
              <input type="tel" className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Adres</label>
            <input type="text" className="form-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Soort zorg</label>
              <select className="form-select" value={editCareType} onChange={(e) => setEditCareType(e.target.value)}>
                {CARE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urgentie</label>
              <select className="form-select" value={editUrgency} onChange={(e) => setEditUrgency(e.target.value as Urgency)}>
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notities</label>
            <textarea className="form-textarea" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} />
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button className="btn btn--primary btn--sm" onClick={() => handleEditSave(intake.id)}>Opslaan</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setEditingId(null)}>Annuleren</button>
          </div>
        </div>
      );
    }

    return (
      <div key={intake.id} className="intake-item">
        <div className="intake-item__header">
          <span className="intake-item__name">{intake.clientName}</span>
          <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
            <span className={`intake-item__urgency intake-item__urgency--${intake.urgency}`}>
              {URGENCY_OPTIONS.find((u) => u.id === intake.urgency)?.label}
            </span>
            <button
              className="btn--icon"
              onClick={() => startEdit(intake)}
              aria-label="Bewerk aanvraag"
              title="Bewerken"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="intake-item__detail">
          <a href={`tel:${intake.phone}`}>{intake.phone}</a>
          {intake.address && ` · ${intake.address}`}
        </div>
        <div className="intake-item__detail">
          {intake.careType} · {formatDate(intake.createdAt)}
        </div>
        {intake.notes && (
          <div className="intake-item__detail" style={{ fontStyle: "italic" }}>
            {intake.notes}
          </div>
        )}
        <div className="intake-item__actions">
          {intake.status === "open" && (
            <button className="btn btn--secondary btn--sm" onClick={() => updateStatus(intake.id, "in_behandeling")}>
              In behandeling
            </button>
          )}
          {intake.status === "in_behandeling" && (
            <button className="btn btn--primary btn--sm" onClick={() => updateStatus(intake.id, "afgerond")}>
              Afronden
            </button>
          )}
          {intake.status !== "open" && (
            <button className="btn btn--secondary btn--sm" onClick={() => updateStatus(intake.id, "open")}>
              Heropenen
            </button>
          )}
          {intake.status === "afgerond" && (
            <button
              className="btn btn--danger btn--sm"
              onClick={() => handleDelete(intake.id)}
              aria-label="Verwijder aanvraag"
            >
              &times;
            </button>
          )}
          <span className="text-sm text-muted" style={{ marginLeft: "auto" }}>
            {STATUS_LABELS[intake.status]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card location-todo-card"
      style={{ borderLeftColor: meta.color }}
    >
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
        <h2 className="card__title">{meta.label}</h2>
        <span className="card__badge">{openCount} open</span>
      </div>

      {/* Status filter */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Actief
        </button>
        <button
          className={`filter-tab ${filter === "open" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("open")}
        >
          Open
        </button>
        <button
          className={`filter-tab ${filter === "in_behandeling" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("in_behandeling")}
        >
          In behandeling
        </button>
        <button
          className={`filter-tab ${filter === "afgerond" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("afgerond")}
        >
          Afgerond
        </button>
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Laden...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">📋</div>
            <p>Geen aanvragen</p>
          </div>
        )}

        {!loading && filtered.map((intake) => renderIntakeItem(intake))}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-md">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Naam cliënt *</label>
              <input
                type="text"
                className="form-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Volledige naam"
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
          <div className="form-group">
            <label className="form-label">Adres</label>
            <input
              type="text"
              className="form-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straat, huisnummer, postcode, plaats"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Soort zorg</label>
              <select
                className="form-select"
                value={careType}
                onChange={(e) => setCareType(e.target.value)}
              >
                {CARE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Urgentie</label>
              <select
                className="form-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
              >
                {URGENCY_OPTIONS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notities</label>
            <textarea
              className="form-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijzonderheden, verwijzer, etc."
              rows={3}
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? "Opslaan..." : "Aanvraag opslaan"}
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
          + Nieuwe aanvraag
        </button>
      )}
    </div>
  );
}
