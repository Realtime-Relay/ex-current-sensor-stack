import { useEffect, useMemo, useRef, useState } from "react";
import { ArcGauge, useRelayLatest } from "@relay-x/ui";

import { DEVICE_IDENT } from "../relayx.js";
import { useOnline } from "../hooks/useOnline.js";
import { useDeviceConfig } from "../hooks/useDeviceConfig.js";
import { SessionButton } from "./SessionButton.jsx";
import { SampleRateDialog } from "./SampleRateDialog.jsx";
import { Toast } from "./Toast.jsx";
import { I } from "../lib/icons.jsx";
import { fmt, fmtDuration, relTime } from "../lib/format.js";

function StatePill({ state }) {
  const config = {
    idle: { color: "var(--fg-2)", bg: "var(--bg-3)", border: "var(--line-2)", label: "Idle" },
    preparing: { color: "#1E5FAE", bg: "rgba(30,95,174,0.1)", border: "rgba(30,95,174,0.3)", label: "Preparing" },
    charging: { color: "#0E4A26", bg: "rgba(21,122,62,0.12)", border: "rgba(21,122,62,0.35)", label: "Charging", pulse: true },
    finishing: { color: "#8C6200", bg: "rgba(224,158,0,0.14)", border: "rgba(224,158,0,0.4)", label: "Finishing" },
  }[state];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "5px 11px",
        borderRadius: 999,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: config.color,
          boxShadow: `0 0 6px ${config.color}`,
          animation: config.pulse ? "pulse-dot 1.4s ease-in-out infinite" : "none",
        }}
      />
      {config.label}
    </span>
  );
}

function DeviceMetaPanel({ simState, online, lastSeenMs, config }) {
  const [sessionOn, setSessionOn] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [sessionEnergyWh, setSessionEnergyWh] = useState(0);
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const powerTimeRange = useMemo(
    () => ({ start: new Date(Date.now() - 60 * 1000), end: new Date() }),
    [],
  );
  const { value: powerMw } = useRelayLatest({
    deviceIdent: DEVICE_IDENT,
    metric: "power",
    timeRange: powerTimeRange,
  });

  const powerRef = useRef(powerMw);
  powerRef.current = powerMw;

  // 1 Hz energy accumulator runs only while sessionOn. Interval cleanup
  // freezes duration + energy at their last values on stop.
  useEffect(() => {
    if (!sessionOn) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
      const p = powerRef.current;
      if (p != null && p > 0) {
        setSessionEnergyWh((e) => e + p / 1000 / 3600);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [sessionOn]);

  const durationSec =
    sessionStartMs != null
      ? Math.max(0, Math.floor((now - sessionStartMs) / 1000))
      : 0;

  const rows = [
    ["Device ID", DEVICE_IDENT],
    ["Firmware", config.firmware ?? "—"],
    ["Location", config.location ?? "—"],
    ["Connector", config.connector ?? "—"],
    ["Capacity", config.Capacity ?? config.capacity ?? "—"],
    ["Last heartbeat", lastSeenMs ? relTime(lastSeenMs) : online === null ? "—" : "offline"],
  ];

  return (
    <div style={{ padding: 24, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 18, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 10, height: 10 }}>
          {online && (
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--green)",
                animation: "pulse-ring 2s ease-out infinite",
              }}
            />
          )}
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: online ? "var(--green)" : "var(--fg-3)",
              boxShadow: online ? "0 0 10px var(--green)" : "none",
            }}
          />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {online === null ? "Connecting…" : online ? "Online" : "Offline"}
        </span>
      </div>

      <div>
        <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Session
        </div>
        <StatePill state={simState.session_state} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{k}</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--fg)", textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "var(--line)", margin: "2px 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Duration</div>
          <div className="mono" style={{ fontSize: 18, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {fmtDuration(durationSec)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Energy</div>
          <div className="mono" style={{ fontSize: 18, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
            {fmt(sessionEnergyWh, 3)}{" "}
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>Wh</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
        tone="error"
      />

      <SessionButton
        onStart={() => {
          const nowMs = Date.now();
          setSessionEnergyWh(0);
          setSessionStartMs(nowMs);
          setNow(nowMs);
          setSessionOn(true);
        }}
        onStop={() => {
          setSessionOn(false);
        }}
        onError={(err) => {
          setToastMessage(err.message || "Request failed");
        }}
      />
    </div>
  );
}

function MetricGauge({ metric, label, unit, min, max, scale = 1, alertZones }) {
  const timeRange = useMemo(
    () => ({ start: new Date(Date.now() - 60 * 1000), end: new Date() }),
    [],
  );
  const raw = useRelayLatest({
    deviceIdent: DEVICE_IDENT,
    metric,
    timeRange,
  });

  const data = useMemo(
    () => ({
      value: raw.value != null ? raw.value * scale : 0,
      timestamp: raw.timestamp ?? Date.now(),
      isLoading: false,
      error: raw.error,
    }),
    [raw, scale],
  );

  return (
    <ArcGauge
      data={data}
      min={min}
      max={max}
      label={label}
      unit={unit}
      alertZones={alertZones}
      styles={{
        background: { color: "var(--bg-1)", borderColor: "var(--line)", borderRadius: 10 },
        minMax: { fontSize: 0 },
      }}
    />
  );
}

export function DeviceCard({ simState, onDevSpike, tweaks }) {
  const { online, lastSeenMs } = useOnline({ deviceIdent: DEVICE_IDENT });
  const { config } = useDeviceConfig(DEVICE_IDENT);

  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateToast, setRateToast] = useState({ message: null, tone: "info" });

  return (
    <section
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 22px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, var(--bg-2), var(--bg-1))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "radial-gradient(circle at 35% 35%, #FFE58A, var(--sun) 60%, var(--sun-deep))",
              boxShadow: "0 0 14px rgba(247,184,1,0.4), inset 0 0 0 1px rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 1.5L3 9h4l-1 5.5L12 7H8l1-5.5z" />
            </svg>
          </span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "Manrope", fontSize: 15, fontWeight: 700, color: "var(--ink)", letterSpacing: "-0.01em" }}>
              {tweaks.deviceName}
            </span>
            <span style={{ fontSize: 12, color: "var(--fg-2)" }}>Charger 1 · EV Charger Network</span>
          </div>
          <span
            style={{
              marginLeft: 4,
              padding: "3px 8px",
              fontSize: 10,
              borderRadius: 4,
              background: "rgba(247,184,1,0.18)",
              color: "#6B4A00",
              border: "1px solid rgba(247,184,1,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            pilot
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setRateDialogOpen(true)}
            style={{
              padding: "7px 12px",
              fontSize: 12.5,
              fontWeight: 500,
              borderRadius: 7,
              background: "var(--bg-1)",
              border: "1px solid var(--line-2)",
              color: "var(--fg-1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <I.settings width="12" height="12" />
            Set sample rate
          </button>
          <button
            onClick={onDevSpike}
            title="dev: spike temperature"
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: "transparent",
              border: "1px dashed var(--line-2)",
              color: "var(--fg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
            }}
          >
            ·
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", minHeight: 420 }}>
        <DeviceMetaPanel
          simState={simState}
          online={online}
          lastSeenMs={lastSeenMs}
          config={config}
        />
        <div
          style={{
            padding: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 12,
          }}
        >
          <MetricGauge metric="volt" label="Voltage" unit="V" min={0} max={16} />
          <MetricGauge metric="current" label="Current" unit="mA" min={0} max={3200} />
          <MetricGauge metric="power" label="Power" unit="mW" min={0} max={50000} />
        </div>
      </div>

      <SampleRateDialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        onSuccess={(rateMs) =>
          setRateToast({ message: `Sample rate updated to ${rateMs} ms`, tone: "success" })
        }
      />
      <Toast
        message={rateToast.message}
        tone={rateToast.tone}
        onDismiss={() => setRateToast((t) => ({ ...t, message: null }))}
      />
    </section>
  );
}
