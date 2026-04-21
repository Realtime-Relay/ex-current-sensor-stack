import { useEffect, useRef, useState } from "react";

const MIN_MS = 200;
const MAX_MS = 10 * 60 * 1000; // 10 minutes
const DEFAULT_MS = 10000;

/**
 * Modal dialog for setting the device's telemetry sample rate.
 *
 * onSubmit(rateMs) is expected to:
 *   - resolve on success (the parent closes the dialog + shows success toast)
 *   - reject on failure (the parent shows error toast; dialog stays open for retry)
 *
 * Local validation (non-numeric / out-of-range) surfaces inline — those
 * errors never reach the RPC, so no toast is fired.
 */
export function SampleRateDialog({ open, onClose, onSubmit }) {
  const [rate, setRate] = useState(String(DEFAULT_MS));
  const [pending, setPending] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const inputRef = useRef(null);

  // Reset state + focus input whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    setValidationError(null);
    setPending(false);
    setRate(String(DEFAULT_MS));
    const id = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(id);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async () => {
    const parsed = parseInt(rate, 10);
    if (!Number.isFinite(parsed)) {
      setValidationError("Rate must be a number");
      return;
    }
    if (parsed < MIN_MS || parsed > MAX_MS) {
      setValidationError(`Rate must be between ${MIN_MS} and ${MAX_MS} ms`);
      return;
    }

    setPending(true);
    setValidationError(null);
    try {
      await onSubmit(parsed);
      // Parent handles closing + success toast on resolve.
    } catch {
      // Parent handles error toast; dialog stays open so user can retry
      // without re-entering their value.
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 900,
        background: "rgba(21,17,10,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fade-in 160ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "calc(100vw - 48px)",
          background: "var(--bg-1)",
          borderRadius: 12,
          boxShadow:
            "0 30px 80px -15px rgba(21,17,10,0.3), 0 0 0 1px rgba(0,0,0,0.08)",
          overflow: "hidden",
          animation: "slide-in-top 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
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
            How often the device samples and publishes telemetry. Range: {MIN_MS} ms to{" "}
            {MAX_MS.toLocaleString()} ms (10 min).
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
                if (e.key === "Escape") onClose();
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

          {validationError && (
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
              {validationError}
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
          <button
            onClick={onClose}
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
    </div>
  );
}
