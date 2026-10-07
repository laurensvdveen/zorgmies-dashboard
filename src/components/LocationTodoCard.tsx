"use client";

import { useState, useEffect, useCallback } from "react";

type LocationId = "regiobar" | "capelle" | "nissewaard";
type Priority = "hoog" | "normaal" | "laag";

const PRIORITY_ORDER: Record<Priority, number> = {
  hoog: 0,
  normaal: 1,
  laag: 2,
};

const PRIORITY_META: Record<Priority, { label: string; icon: string }> = {
  hoog: { label: "Hoog", icon: "🔴" },
  normaal: { label: "Normaal", icon: "🟡" },
  laag: { label: "Laag", icon: "🟢" },
};

interface Todo {
  id: string;
  title: string;
  description: string;
  location: LocationId;
  priority: Priority;
  done: boolean;
  createdAt: string;
}

const LOCATION_META: Record<LocationId, { label: string; color: string }> = {
  regiobar: { label: "Regio Bar", color: "var(--color-loc-regiobar)" },
  capelle: { label: "Capelle & PA", color: "var(--color-loc-capelle)" },
  nissewaard: { label: "Nissewaard & HV", color: "var(--color-loc-nissewaard)" },
};

interface Props {
  location: LocationId;
}

export default function LocationTodoCard({ location }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normaal");
  const [submitting, setSubmitting] = useState(false);

  const meta = LOCATION_META[location];

  const loadTodos = useCallback(async () => {
    try {
      const res = await fetch("/api/todo");
      const data = await res.json();
      const all: Todo[] = data.todos ?? [];
      const filtered = all.filter((t) => t.location === location);
      filtered.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (PRIORITY_ORDER[a.priority ?? "normaal"] ?? 1) - (PRIORITY_ORDER[b.priority ?? "normaal"] ?? 1);
      });
      setTodos(filtered);
    } catch {
      console.error("Taken laden mislukt");
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location,
          priority,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("normaal");
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

  const openCount = todos.filter((t) => !t.done).length;

  return (
    <div
      className="card location-todo-card"
      style={{ borderLeftColor: meta.color }}
    >
      <div className="card__header">
        <svg
          className="card__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
        <h2 className="card__title">{meta.label}</h2>
        <span className="card__badge">{openCount} open</span>
      </div>

      <div className="card__body">
        {loading && (
          <div className="loading">
            <div className="loading__spinner" />
            Laden...
          </div>
        )}

        {!loading &&
          todos.map((todo) => (
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
                <div className="todo-item__title-row">
                  <span className="todo-item__title">{todo.title}</span>
                  {(todo.priority ?? "normaal") !== "normaal" && (
                    <span className={`todo-priority-badge todo-priority-badge--${todo.priority}`}>
                      {PRIORITY_META[todo.priority]?.icon} {PRIORITY_META[todo.priority]?.label}
                    </span>
                  )}
                </div>
                {todo.description && (
                  <div className="todo-item__desc">{todo.description}</div>
                )}
              </div>
              <button
                className="btn btn--danger btn--sm"
                onClick={() => handleDelete(todo.id)}
                aria-label="Verwijder taak"
              >
                &times;
              </button>
            </div>
          ))}

        {!loading && todos.length === 0 && (
          <div className="empty-state">
            <div className="empty-state__icon">✅</div>
            <p>Geen taken</p>
          </div>
        )}
      </div>

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
            <label className="form-label">Prioriteit</label>
            <div className="priority-selector">
              {(["hoog", "normaal", "laag"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-option priority-option--${p} ${priority === p ? "priority-option--active" : ""}`}
                  onClick={() => setPriority(p)}
                >
                  {PRIORITY_META[p].icon} {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
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
