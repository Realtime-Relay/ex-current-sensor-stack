import { useEffect } from "react";

/**
 * Fixed-position toast notification. Pass a `message` string to show; pass
 * `null`/empty to hide. Auto-dismisses after `duration` ms by calling
 * `onDismiss`. Mount once per consumer — the component handles positioning
 * via `position: fixed`, so it escapes any parent layout.
 */
export function Toast({ message, onDismiss, tone = "error", duration = 5000 }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  const palettes = {
    error: { bg: "var(--red)", title: "RPC failed" },
    warn: { bg: "var(--amber)", title: "Warning" },
    info: { bg: "var(--ink)", title: "Info" },
    success: { bg: "var(--green)", title: "Success" },
  };
  const p = palettes[tone] || palettes.error;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 1000,
        minWidth: 280,
        maxWidth: 420,
        padding: "14px 16px",
        background: p.bg,
        color: "white",
        borderRadius: 10,
        boxShadow:
          "0 20px 60px -10px rgba(21,17,10,0.35), 0 0 0 1px rgba(0,0,0,0.06)",
        animation: "slide-in-top 250ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        fontSize: 13,
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, marginBottom: 3, letterSpacing: "-0.01em" }}>
            {p.title}
          </div>
          <div style={{ opacity: 0.94, fontSize: 12.5, wordBreak: "break-word" }}>
            {message}
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            opacity: 0.7,
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
