"use client";

import { useState, useEffect } from "react";

type LocationId = "regiobar" | "capelle" | "nissewaard";

interface Todo {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  done: boolean;
  createdAt: string;
}

const LOCATION_OPTIONS: { id: LocationId; label: string }[] = [
  { id: "regiobar", label: "Regio Bar" },
  { id: "capelle", label: "Capelle & PA" },
  { id: "nissewaard", label: "Nissewaard & HV" },
];

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<LocationId | "all">("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<LocationId>("regiobar");
  const [submitting, setSubmitting] = useState(false);

  async function loadTodos() {
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      setTodos(data.todos ?? []);
    } catch {
      console.error("Taken laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), location }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setShowForm(false);
        await loadTodos();
      }
    } catch {
      console.error("Taak aanmaken mislukt");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDone(id: string, done: boolean) {
    try {
      await fetch("/api/todo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, done: !done }),
      });
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, done: !done } : t))
      );
    } catch {
      console.error("Taak bijwerken mislukt");
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/todo?id=${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      console.error("Taak verwijderen mislukt");
    }
  }

  const filtered =
    filter === "all" ? todos : todos.filter((t) => t.location === filter);

  // Group by location
  const grouped = LOCATION_OPTIONS.filter(
    (loc) => filter === "all" || filter === loc.id
  ).map((loc) => ({
    ...loc,
    items: filtered.filter((t) => t.location === loc.id),
  }));

  return (
    <div className="card">
      <div className="card__header">
        <svg className="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <h2 className="card__title">Taken</h2>
        <span className="card__badge">
          {todos.filter((t) => !t.done).length} open
        </span>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "filter-tab--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          Alle
        </button>
        {LOCATION_OPTIONS.map((loc) => (
          <button
            key={loc.id}
            className={`filter-tab ${filter === loc.id ? "filter-tab--active" : ""}`}
            onClick={() => setFilter(loc.id)}
          >
            {loc.label}
          </button>
        ))}
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Taken laden...
          </div>
        )}

        {!loading &&
          grouped.map((group) =>
            group.items.length > 0 ? (
              <div key={group.id}>
                {filter === "all" && (
                  <div className="section-divider">{group.label}</div>
                )}
                {group.items.map((todo) => (
                  <div
                    key={todo.id}
                    className={`todo-item ${todo.done ? "todo-item--done" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="todo-checkbox"
                      checked={todo.done}
                      onChange={() => toggleDone(todo.id, todo.done)}
                      aria-label={`Markeer "${todo.title}" als ${todo.done ? "niet klaar" : "klaar"}`}
                    />
                    <div className="todo-item__content">
                      <div className="todo-item__title">{todo.title}</div>
                      {todo.description && (
                        <div className="todo-item__desc">{todo.description}</div>
                      )}
                    </div>
                    <span className={`loc-badge loc-badge--${todo.location}`}>
                      {LOCATION_OPTIONS.find((l) => l.id === todo.location)?.label}
                    </span>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(todo.id)}
                      aria-label="Verwijder taak"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : null
          )}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">✅</div>
            <p>Geen taken</p>
          </div>
        )}
      </div>

      {/* Add form */}
      {showForm ? (
        <form onSubmit={handleSubmit} className="mt-md">
          <div className="form-group">
            <label className="form-label">Titel *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wat moet er gebeuren?"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Beschrijving</label>
            <input
              type="text"
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionele toelichting"
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
          + Nieuwe taak
        </button>
      )}
    </div>
  );
}
