import { useEffect, useState } from "react";
import { I } from "../lib/icons.jsx";
import { relTime } from "../lib/format.js";

function EventRow({ ev }) {
  const Icon = I[ev.icon] || I.bolt;
  const tone = {
    alert: { bg: "rgba(194,65,12,0.1)", color: "#8E2F09" },
    session: { bg: "rgba(21,122,62,0.12)", color: "#0E4A26" },
    connector: { bg: "rgba(247,184,1,0.22)", color: "#6B4A00" },
  }[ev.type] || { bg: "var(--bg-3)", color: "var(--fg-1)" };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid var(--line)",
        animation: "fade-in 250ms ease",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          background: tone.bg,
          color: tone.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon width="13" height="13" />
      </span>
      <span style={{ flex: 1, fontSize: 12.5, color: "var(--fg-1)" }}>{ev.title}</span>
      <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-3)" }}>
        {relTime(ev.t)}
      </span>
    </div>
  );
}

export function EventsCard({ events }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 280,
        boxShadow: "0 1px 2px rgba(21,17,10,0.03)",
      }}
    >
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Recent events</div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>Last 20 · SF-DEMO-001</div>
        </div>
        <span
          className="mono"
          style={{
            fontSize: 10,
            padding: "3px 7px",
            borderRadius: 4,
            background: "var(--bg-3)",
            color: "var(--fg-1)",
          }}
        >
          {events.length} total
        </span>
      </div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {events.length === 0 && (
          <div style={{ padding: 24, fontSize: 12, color: "var(--fg-3)" }}>Waiting for first event…</div>
        )}
        {events.slice(0, 20).map((ev) => <EventRow key={ev.id} ev={ev} />)}
      </div>
    </div>
  );
}

export function AlertsCard({ alerts, onAck }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 280,
        boxShadow: "0 1px 2px rgba(21,17,10,0.03)",
      }}
    >
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Active alerts</div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>Server-side rules · fleet-wide</div>
        </div>
        <span
          className="mono"
          style={{
            fontSize: 10,
            padding: "3px 7px",
            borderRadius: 4,
            background: alerts.length ? "rgba(194,65,12,0.15)" : "var(--bg-3)",
            color: alerts.length ? "#8E2F09" : "var(--fg-2)",
          }}
        >
          {alerts.length} active
        </span>
      </div>
      <div style={{ flex: 1, padding: alerts.length ? 14 : 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {alerts.length === 0 && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--fg-3)",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--bg-3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--green)",
              }}
            >
              <I.check width="16" height="16" />
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-2)" }}>No active alerts</div>
            <div style={{ fontSize: 10.5, color: "var(--fg-3)" }}>All systems healthy</div>
          </div>
        )}
        {alerts.map((a) => (
          <div
            key={a.id}
            style={{
              padding: 14,
              borderRadius: 10,
              background: "linear-gradient(180deg, rgba(194,65,12,0.08), rgba(194,65,12,0.02))",
              border: "1px solid rgba(194,65,12,0.35)",
              display: "flex",
              gap: 12,
              animation: "slide-in-top 300ms cubic-bezier(0.2, 0.8, 0.2, 1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: "var(--red)" }} />
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                flexShrink: 0,
                background: "rgba(194,65,12,0.15)",
                color: "var(--red)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse-dot 1.6s ease-in-out infinite",
              }}
            >
              <I.warn width="15" height="15" />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{a.title}</span>
                <span
                  style={{
                    fontSize: 9,
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: "rgba(194,65,12,0.2)",
                    color: "#8E2F09",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                  }}
                >
                  {a.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-1)", marginBottom: 4 }}>{a.subtitle}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--fg-3)" }}>
                <span className="mono">{a.device}</span>
                <span>·</span>
                <span className="mono">{relTime(a.t)}</span>
              </div>
            </div>
            <button
              onClick={() => onAck(a.id)}
              style={{
                alignSelf: "flex-start",
                padding: "7px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                background: "var(--ink)",
                border: "1px solid var(--ink)",
                color: "white",
              }}
            >
              Acknowledge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
