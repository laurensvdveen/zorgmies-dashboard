"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "Inloggen mislukt");
      }
    } catch {
      setError("Er is iets misgegaan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logoIcon}>🏠</span>
          <h1 style={styles.title}>ZorgMies</h1>
        </div>
        <p style={styles.subtitle}>
          Voer het wachtwoord in om toegang te krijgen tot het dashboard
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wachtwoord"
            style={styles.input}
            autoFocus
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              ...styles.button,
              opacity: loading || !password ? 0.6 : 1,
            }}
          >
            {loading ? "Bezig..." : "Inloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #E8EDF6 0%, #F4F6FB 50%, #E8EDF6 100%)",
    fontFamily: "'Nunito', 'DM Sans', sans-serif",
    padding: "1rem",
  },
  card: {
    background: "#FFFFFF",
    borderRadius: "16px",
    padding: "3rem 2.5rem",
    boxShadow: "0 4px 24px rgba(45, 75, 164, 0.08)",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center" as const,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  logoIcon: {
    fontSize: "2rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#2D4BA4",
    margin: 0,
  },
  subtitle: {
    color: "#5A6178",
    fontSize: "0.9rem",
    marginBottom: "2rem",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "1rem",
  },
  input: {
    padding: "0.875rem 1rem",
    borderRadius: "10px",
    border: "1.5px solid #D1D5E4",
    fontSize: "1rem",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s",
    background: "#F8F9FC",
  },
  error: {
    color: "#E25C5C",
    fontSize: "0.85rem",
    margin: 0,
  },
  button: {
    padding: "0.875rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #2D4BA4, #95A7D5)",
    color: "#FFFFFF",
    fontSize: "1rem",
    fontWeight: 700,
    fontFamily: "'Nunito', sans-serif",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
};
