import { useEffect, useRef, useState } from "react";

import { app, DEVICE_IDENT } from "../relayx.js";

const MIN_MS = 200;
const MAX_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MS = 200;

/**
 * Self-contained form for setting the telemetry sample rate via the
 * `updateSampleRate` RPC. Owns its validation + RPC call. Emits onSuccess
 * so the parent can close a modal, show a toast, etc.
 *
 * `open` is used to reset + focus whenever the form becomes visible inside
 * a modal shell. Pass `true` for standalone usage.
 */
export function SampleRateForm({ open = true, onCancel, onSuccess }) {
  const [rate, setRate] = useState(String(DEFAULT_MS));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPending(false);
    setRate(String(DEFAULT_MS));
    const id = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(id);
  }, [open]);

  async function handleSubmit() {
    const parsed = parseInt(rate, 10);
    if (!Number.isFinite(parsed)) {
      setError("Rate must be a number");
      return;
    }
    if (parsed < MIN_MS || parsed > MAX_MS) {
      setError(`Rate must be between ${MIN_MS} and ${MAX_MS} ms`);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await app.rpc.call({
        device_ident: DEVICE_IDENT,
        name: "updateSampleRate",
        timeout: 10,
        data: { rate: parsed },
      });

      if (result?.status !== "ok") {
        const msg =
          result?.data?.message ||
          result?.message ||
          `Device returned status "${result?.status ?? "unknown"}"`;
        throw new Error(msg);
      }

      onSuccess?.(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      style={{
        width: 420,
        maxWidth: "calc(100vw - 48px)",
        background: "var(--bg-1)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow:
          "0 30px 80px -15px rgba(21,17,10,0.3), 0 0 0 1px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <div
          style={{
            fontFamily: "Manrope",
            fontSize: 15,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Set sample rate
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 3 }}>
          How often the device samples and publishes telemetry. Range: {MIN_MS} ms
          to {MAX_MS.toLocaleString()} ms (10 min).
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 10.5,
              color: "var(--fg-2)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            Rate (milliseconds)
          </span>
          <input
            ref={inputRef}
            type="number"
            min={MIN_MS}
            max={MAX_MS}
            step={100}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onCancel?.();
            }}
            style={{
              padding: "10px 12px",
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 8,
              fontSize: 14,
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              color: "var(--ink)",
              outline: "none",
            }}
          />
        </label>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "var(--red)",
              background: "rgba(194,65,12,0.08)",
              border: "1px solid rgba(194,65,12,0.3)",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "14px 20px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={pending}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 500,
              background: "transparent",
              border: "1px solid var(--line-2)",
              borderRadius: 7,
              color: "var(--fg-1)",
              cursor: pending ? "not-allowed" : "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={pending}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            background: "var(--ink)",
            border: "1px solid var(--ink)",
            borderRadius: 7,
            color: "white",
            cursor: pending ? "not-allowed" : "pointer",
            opacity: pending ? 0.7 : 1,
            transition: "opacity 120ms ease",
          }}
        >
          {pending ? "Updating…" : "Update"}
        </button>
      </div>
    </div>
  );
}
