"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type LocationId = "regiobar" | "capelle" | "nissewaard";

interface LocationStatus {
  id: LocationId;
  connected: boolean;
  userEmail?: string;
  userName?: string;
  connectedAt?: string;
}

const LOCATION_INFO: Record<
  LocationId,
  { label: string; color: string; email: string }
> = {
  regiobar: {
    label: "Regio Bar",
    color: "var(--color-loc-regiobar)",
    email: "regio-bar@zorgmies.nl",
  },
  capelle: {
    label: "Capelle & Prins Alexander",
    color: "var(--color-loc-capelle)",
    email: "capelle@zorgmies.nl",
  },
  nissewaard: {
    label: "Nissewaard & Hoogvliet",
    color: "var(--color-loc-nissewaard)",
    email: "nissewaard@zorgmies.nl",
  },
};

export default function SetupPage() {
  const [statuses, setStatuses] = useState<LocationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    // Check URL params for success/error messages
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");

    if (connected) {
      const label =
        LOCATION_INFO[connected as LocationId]?.label ?? connected;
      setMessage({
        type: "success",
        text: `${label} is succesvol gekoppeld!`,
      });
      // Clean URL
      window.history.replaceState({}, "", "/setup");
    } else if (error) {
      setMessage({ type: "error", text: error });
      window.history.replaceState({}, "", "/setup");
    }

    loadStatuses();
  }, []);

  async function loadStatuses() {
    try {
      const res = await fetch("/api/auth/outlook/status");
      if (!res.ok) throw new Error("Fout bij ophalen status");
      const data = await res.json();
      setStatuses(data.locations ?? []);
    } catch {
      setMessage({ type: "error", text: "Kon verbindingsstatus niet ophalen" });
    } finally {
      setLoading(false);
    }
  }

  function startConnect(locationId: LocationId) {
    window.location.href = `/api/auth/outlook?location=${locationId}`;
  }

  const allConnected = statuses.every((s) => s.connected);

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Header */}
      <header
        style={{
          background: "var(--color-bg-header)",
          borderBottom: "1px solid var(--color-border)",
          padding: "var(--space-md) var(--space-xl)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-header)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "var(--font-size-lg)",
              color: "var(--color-primary-dark)",
            }}
          >
            Outlook Koppeling
          </h1>
        </div>
        <Link
          href="/"
          style={{
            color: "var(--color-primary-dark)",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "var(--font-size-sm)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            width="16"
            height="16"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Terug naar dashboard
        </Link>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "var(--space-xl) var(--space-md)",
        }}
      >
        {/* Info */}
        <div
          style={{
            background: "var(--color-info-light)",
            border: "1px solid var(--color-info)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-md)",
            marginBottom: "var(--space-xl)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text)",
            lineHeight: 1.6,
          }}
        >
          <strong>Hoe werkt het?</strong>
          <br />
          Klik op &quot;Koppel Outlook&quot; voor elke vestiging. Je wordt
          doorgestuurd naar Microsoft om in te loggen met het e-mailadres van
          die vestiging. Na het inloggen heeft het dashboard toegang tot de
          mail en agenda van die vestiging.
        </div>

        {/* Status messages */}
        {message && (
          <div
            style={{
              background:
                message.type === "success"
                  ? "var(--color-success-light)"
                  : "var(--color-danger-light)",
              border: `1px solid ${
                message.type === "success"
                  ? "var(--color-success)"
                  : "var(--color-danger)"
              }`,
              borderRadius: "var(--radius-md)",
              padding: "var(--space-md)",
              marginBottom: "var(--space-lg)",
              fontSize: "var(--font-size-sm)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
            }}
          >
            <span style={{ fontSize: "1.2em" }}>
              {message.type === "success" ? "✓" : "✗"}
            </span>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "var(--font-size-md)",
                color: "var(--color-text-muted)",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-2xl)",
              color: "var(--color-text-muted)",
            }}
          >
            Status laden...
          </div>
        )}

        {/* Location cards */}
        {!loading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-md)",
            }}
          >
            {(["regiobar", "capelle", "nissewaard"] as LocationId[]).map(
              (locId) => {
                const info = LOCATION_INFO[locId];
                const status = statuses.find((s) => s.id === locId);
                const connected = status?.connected ?? false;

                return (
                  <div
                    key={locId}
                    style={{
                      background: "var(--color-bg-card)",
                      borderRadius: "var(--radius-lg)",
                      border: `1px solid ${
                        connected ? info.color : "var(--color-border)"
                      }`,
                      boxShadow: "var(--shadow-card)",
                      padding: "var(--space-lg)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-lg)",
                    }}
                  >
                    {/* Location indicator */}
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "var(--radius-md)",
                        background: connected
                          ? info.color
                          : "var(--color-bg-input)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {connected ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          width="24"
                          height="24"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-text-muted)"
                          strokeWidth="2"
                          width="24"
                          height="24"
                        >
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                          <path d="M22 7l-10 7L2 7" />
                        </svg>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-heading)",
                          fontWeight: 700,
                          fontSize: "var(--font-size-md)",
                          marginBottom: "var(--space-xs)",
                        }}
                      >
                        {info.label}
                      </div>
                      {connected ? (
                        <div
                          style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--color-success)",
                              fontWeight: 600,
                            }}
                          >
                            Gekoppeld
                          </span>
                          {" — "}
                          {status?.userEmail ?? info.email}
                          {status?.connectedAt && (
                            <span
                              style={{
                                display: "block",
                                color: "var(--color-text-muted)",
                                fontSize: "var(--font-size-xs)",
                                marginTop: 2,
                              }}
                            >
                              Gekoppeld op{" "}
                              {new Date(
                                status.connectedAt
                              ).toLocaleDateString("nl-NL", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            fontSize: "var(--font-size-sm)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          Niet gekoppeld — log in met{" "}
                          <strong>{info.email}</strong>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    <button
                      onClick={() => startConnect(locId)}
                      style={{
                        background: connected
                          ? "var(--color-bg-input)"
                          : info.color,
                        color: connected
                          ? "var(--color-text-secondary)"
                          : "white",
                        border: connected
                          ? "1px solid var(--color-border)"
                          : "none",
                        borderRadius: "var(--radius-md)",
                        padding: "var(--space-sm) var(--space-lg)",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--font-size-sm)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        transition: "var(--transition-fast)",
                      }}
                    >
                      {connected ? "Opnieuw koppelen" : "Koppel Outlook"}
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* All connected message */}
        {!loading && allConnected && statuses.length > 0 && (
          <div
            style={{
              background: "var(--color-success-light)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-lg)",
              marginTop: "var(--space-xl)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
                color: "var(--color-success)",
                marginBottom: "var(--space-xs)",
              }}
            >
              Alle vestigingen gekoppeld!
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              Het dashboard haalt nu automatisch mail en agenda-afspraken op.
            </div>
            <Link
              href="/"
              style={{
                display: "inline-block",
                marginTop: "var(--space-md)",
                background: "var(--color-primary-dark)",
                color: "white",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-sm) var(--space-xl)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "var(--font-size-sm)",
              }}
            >
              Naar het dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
