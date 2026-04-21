import { useEffect, useMemo, useRef, useState } from "react";
import { ArcGauge, useRelayLatest } from "@relay-x/ui";

import { app, DEVICE_IDENT } from "../relayx.js";
import { useOnline } from "../hooks/useOnline.js";
import { useDeviceConfig } from "../hooks/useDeviceConfig.js";
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

function DeviceMetaPanel({ simState, tweaks, online, lastSeenMs, config }) {
  // Session state is tracked locally in the UI. Defaults to off on every page
  // load — we don't persist it (the firmware's relay always powers up OFF too,
  // so after a device reboot this assumption holds). Each click fires the
  // `state` RPC with the opposite of the current value.
  const [sessionOn, setSessionOn] = useState(false);
  const [pending, setPending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Real session accounting — only reset/advanced when the RPC actually succeeds.
  const [sessionEnergyWh, setSessionEnergyWh] = useState(0);
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Latest power reading (mW) drives the energy integral. Subscribing here
  // (in addition to MetricGauge) is cheap — the App SDK dedupes subscriptions.
  const powerTimeRange = useMemo(
    () => ({ start: new Date(Date.now() - 60 * 1000), end: new Date() }),
    [],
  );
  const { value: powerMw } = useRelayLatest({
    deviceIdent: DEVICE_IDENT,
    metric: "power",
    timeRange: powerTimeRange,
  });

  // Ref so the 1 Hz interval reads whatever power is *currently* cached
  // without restarting every time a new reading lands.
  const powerRef = useRef(powerMw);
  powerRef.current = powerMw;

  // 1 Hz accumulator — runs only while a session is active. Each tick:
  //   Δenergy (Wh) = power (W) × (1 s / 3600)
  // Freezes automatically when sessionOn flips to false (interval cleanup).
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

  const handleToggle = async () => {
    const target = !sessionOn;
    setPending(true);
    try {
      const result = await app.rpc.call({
        device_ident: DEVICE_IDENT,
        name: "state",
        timeout: 10,
        data: { on: target },
      });

      console.log(result)

      // Treat anything other than status="ok" as a failure and surface it.
      if (result?.status !== "ok") {
        const serverMsg =
          result?.data?.message ||
          result?.message ||
          `Device returned status "${result?.status ?? "unknown"}"`;
        throw new Error(serverMsg);
      }

      // Trust the device's echoed state if present; fall back to our intent.
      const applied = result?.data?.on ?? target;
      const nextOn = Boolean(applied);

      // Only reset session accounting on a SUCCESSFUL start. A failed
      // RPC leaves the prior session's numbers untouched.
      if (nextOn) {
        const nowMs = Date.now();
        setSessionEnergyWh(0);
        setSessionStartMs(nowMs);
        setNow(nowMs);
      }
      // On stop: the interval's cleanup freezes energy + duration at their
      // last values. No mutation needed here.

      setSessionOn(nextOn);
    } catch (e) {
      console.error("state RPC failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setToastMessage(msg || "Request timed out or failed");
    } finally {
      setPending(false);
    }
  };

  const durationSec =
    sessionStartMs != null
      ? Math.max(0, Math.floor((now - sessionStartMs) / 1000))
      : 0;

  // Map each row either to a real config key or to a live signal. "—" as
  // placeholder keeps the layout stable before config arrives.
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
      {/* Presence — real */}
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

      <button
        onClick={handleToggle}
        disabled={pending}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "-0.005em",
          background: sessionOn ? "var(--ink)" : "var(--green)",
          color: "white",
          border: `1px solid ${sessionOn ? "var(--ink)" : "var(--green)"}`,
          boxShadow: sessionOn
            ? "0 2px 0 rgba(21,17,10,0.12), 0 8px 24px -8px rgba(21,17,10,0.5)"
            : "0 2px 0 rgba(14,74,38,0.2), 0 8px 24px -8px rgba(21,122,62,0.5)",
          transition: "background 150ms ease, border-color 150ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          opacity: pending ? 0.7 : 1,
        }}
      >
        {sessionOn ? <I.stop width="13" height="13" /> : <I.play width="13" height="13" />}
        {pending
          ? sessionOn
            ? "Stopping…"
            : "Starting…"
          : sessionOn
            ? "Stop session"
            : "Start session"}
      </button>
    </div>
  );
}

/**
 * One gauge backed by useRelayLatest. `scale` converts the raw device units
 * into the display units expected on the gauge (e.g. mA → A).
 *
 * Defaults to 0 while the first reading is in flight so the gauge never
 * renders a loading skeleton — reads as a clean empty reading until real
 * data arrives.
 */
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
        // Hide the min/max labels at the arc endpoints — they add clutter
        // when the range is wider than the typical reading (e.g. 0–3200 mA
        // for a load that pulls 50 mA). fontSize 0 collapses both texts.
        minMax: { fontSize: 0 },
      }}
    />
  );
}

export function DeviceCard({ simState, onDevSpike, tweaks }) {
  // Derive online from telemetry freshness — see hooks/useOnline.js for why
  // we don't use @relay-x/ui's useRelayPresence here.
  const { online, lastSeenMs } = useOnline({ deviceIdent: DEVICE_IDENT });

  // Device config (firmware / location / connector / capacity) fetched from
  // the RelayX device record. Set these via the console's Config panel.
  const { config } = useDeviceConfig(DEVICE_IDENT);

  // Sample-rate dialog state + its own toast (success + error). Separate from
  // the start/stop toast inside DeviceMetaPanel so both can coexist.
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateToast, setRateToast] = useState({ message: null, tone: "info" });

  const handleRateSubmit = async (rateMs) => {
    let result;
    try {
      result = await app.rpc.call({
        device_ident: DEVICE_IDENT,
        name: "updateSampleRate",
        timeout: 10,
        data: { rate: rateMs },
      });
    } catch (e) {
      // Timeout, network failure, auth — SDK throws with a useful .message.
      console.error("updateSampleRate RPC failed:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setRateToast({ message: msg || "Request timed out or failed", tone: "error" });
      throw e; // keeps the dialog open for retry
    }

    if (result?.status !== "ok") {
      const msg =
        result?.data?.message ||
        result?.message ||
        `Device returned status "${result?.status ?? "unknown"}"`;
      setRateToast({ message: msg, tone: "error" });
      throw new Error(msg); // keeps the dialog open for retry
    }

    setRateDialogOpen(false);
    setRateToast({
      message: `Sample rate updated to ${rateMs} ms`,
      tone: "success",
    });
  };

  return (
    <section
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      {/* Header */}
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

      {/* Body: left metadata + right gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", minHeight: 420 }}>
        <DeviceMetaPanel
          simState={simState}
          tweaks={tweaks}
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
          {/* Real — 'volt' metric published by INA219 driver */}
          <MetricGauge metric="volt" label="Voltage" unit="V" min={0} max={16} />

          {/* Real — 'current' metric (device publishes mA, gauge displays mA) */}
          <MetricGauge metric="current" label="Current" unit="mA" min={0} max={3200} />

          {/* Real — 'power' metric (device publishes mW, gauge displays mW) */}
          <MetricGauge metric="power" label="Power" unit="mW" min={0} max={50000} />
        </div>
      </div>

      <SampleRateDialog
        open={rateDialogOpen}
        onClose={() => setRateDialogOpen(false)}
        onSubmit={handleRateSubmit}
      />
      <Toast
        message={rateToast.message}
        tone={rateToast.tone}
        onDismiss={() => setRateToast((t) => ({ ...t, message: null }))}
      />
    </section>
  );
}
