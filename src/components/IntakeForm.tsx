"use client";

import { useState, useEffect } from "react";

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

const LOCATION_OPTIONS: { id: LocationId; label: string }[] = [
  { id: "regiobar", label: "Regio Bar" },
  { id: "capelle", label: "Capelle & PA" },
  { id: "nissewaard", label: "Nissewaard & HV" },
];

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

export default function IntakeForm() {
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
  const [location, setLocation] = useState<LocationId>("regiobar");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadIntakes() {
    try {
      const res = await fetch("/api/intake");
      const data = await res.json();
      setIntakes(data.intakes ?? []);
    } catch {
      console.error("Aanvragen laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntakes();
  }, []);

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

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <path d="M20 8v6M23 11h-6" />
        </svg>
        <h2 className="card__title">Nieuwe aanvragen</h2>
        <span className="card__badge">
          {intakes.filter((i) => i.status === "open").length} open
        </span>
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

        {!loading &&
          filtered.map((intake) => (
            <div key={intake.id} className="intake-item">
              <div className="intake-item__header">
                <span className="intake-item__name">
                  {intake.clientName}
                </span>
                <div style={{ display: "flex", gap: "var(--space-xs)", alignItems: "center" }}>
                  <span
                    className={`intake-item__urgency intake-item__urgency--${intake.urgency}`}
                  >
                    {URGENCY_OPTIONS.find((u) => u.id === intake.urgency)?.label}
                  </span>
                  <span className={`loc-badge loc-badge--${intake.location}`}>
                    {LOCATION_OPTIONS.find((l) => l.id === intake.location)?.label}
                  </span>
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
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => updateStatus(intake.id, "in_behandeling")}
                  >
                    In behandeling
                  </button>
                )}
                {intake.status === "in_behandeling" && (
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => updateStatus(intake.id, "afgerond")}
                  >
                    Afronden
                  </button>
                )}
                {intake.status !== "open" && (
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => updateStatus(intake.id, "open")}
                  >
                    Heropenen
                  </button>
                )}
                <span className="text-sm text-muted" style={{ marginLeft: "auto" }}>
                  {STATUS_LABELS[intake.status]}
                </span>
              </div>
            </div>
          ))}
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
                  <option key={type} value={type}>
                    {type}
                  </option>
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
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
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
