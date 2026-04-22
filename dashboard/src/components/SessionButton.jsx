import { useState } from "react";

import { app, DEVICE_IDENT } from "../relayx.js";
import { I } from "../lib/icons.jsx";

/**
 * Controls the device's relay via the `state` RPC. Manages its own on/pending
 * state and emits callbacks so the parent can run side effects (session
 * duration, energy accumulator) without duplicating the RPC logic.
 */
export function SessionButton({ onStart, onStop, onError }) {
  const [on, setOn] = useState(false);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const target = !on;
    setPending(true);
    try {
      const result = await app.rpc.call({
        device_ident: DEVICE_IDENT,
        name: "state",
        timeout: 10,
        data: { on: target },
      });

      if (result?.status !== "ok") {
        const msg =
          result?.data?.message ||
          result?.message ||
          `Device returned status "${result?.status ?? "unknown"}"`;
        throw new Error(msg);
      }

      const applied = Boolean(result?.data?.on ?? target);
      setOn(applied);
      if (applied) onStart?.();
      else onStop?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "-0.005em",
        background: on ? "var(--ink)" : "var(--green)",
        color: "white",
        border: `1px solid ${on ? "var(--ink)" : "var(--green)"}`,
        boxShadow: on
          ? "0 2px 0 rgba(21,17,10,0.12), 0 8px 24px -8px rgba(21,17,10,0.5)"
          : "0 2px 0 rgba(14,74,38,0.2), 0 8px 24px -8px rgba(21,122,62,0.5)",
        transition: "background 150ms ease, border-color 150ms ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        opacity: pending ? 0.7 : 1,
        cursor: pending ? "not-allowed" : "pointer",
      }}
    >
      {on ? <I.stop width="13" height="13" /> : <I.play width="13" height="13" />}
      {pending
        ? on
          ? "Stopping…"
          : "Starting…"
        : on
          ? "Stop session"
          : "Start session"}
    </button>
  );
}
