import { fmtInt } from "../lib/format.js";

export function AdCard({ simState, tweaks }) {
  const sparkData = simState.ad_impressions_history;
  const w = 180, h = 44;
  const vmax = Math.max(...sparkData.map((d) => d.v), 60) * 1.1;
  const pad = 3;
  const iw = w - pad * 2, ih = h - pad * 2;
  const points = sparkData.map((d, i) => {
    const x = pad + (i / (sparkData.length - 1 || 1)) * iw;
    const y = pad + ih - (d.v / vmax) * ih;
    return { x, y };
  });
  const pathD = points.length
    ? "M " + points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" L ")
    : "";
  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`
    : "";
  const lastImpressions = sparkData.length ? sparkData[sparkData.length - 1].v : 0;

  return (
    <section
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(21,17,10,0.03)",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(180deg, var(--bg-2), var(--bg-1))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            Adpod screen
          </div>
          <span
            style={{
              padding: "2px 8px",
              fontSize: 10,
              borderRadius: 4,
              background: "rgba(247,184,1,0.2)",
              color: "#6B4A00",
              border: "1px solid rgba(247,184,1,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            beyond OCPP
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-3)" }}>
          Custom telemetry stream ·{" "}
          <span className="mono" style={{ color: "var(--fg-2)" }}>topic: adpod/*</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.3fr 1.2fr", alignItems: "stretch" }}>
        {/* Uptime */}
        <div style={{ padding: 20, borderRight: "1px solid var(--line)" }}>
          <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
            Screen uptime · 30d
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="mono" style={{ fontSize: 28, fontWeight: 500, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              99.8
            </span>
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>%</span>
          </div>
          <div style={{ display: "flex", gap: 2, marginTop: 14, height: 28, alignItems: "flex-end" }}>
            {Array.from({ length: 30 }, (_, i) => {
              const h = 60 + Math.random() * 40;
              const bad = i === 17;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: bad ? "var(--amber)" : "var(--green)",
                    opacity: bad ? 0.9 : 0.55,
                    borderRadius: 1,
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)" }}>30d ago</span>
            <span className="mono" style={{ fontSize: 9.5, color: "var(--fg-3)" }}>today</span>
          </div>
        </div>

        {/* Ads played */}
        <div style={{ padding: 20, borderRight: "1px solid var(--line)" }}>
          <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 600 }}>
            Ads played · today
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontFamily: "Manrope",
                fontSize: 30,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {fmtInt(simState.ads_played)}
            </span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 5px",
                borderRadius: 3,
                fontWeight: 600,
                background: "rgba(21,122,62,0.14)",
                color: "#0E4A26",
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              ▲ 12.4%
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Unique creatives</span>
              <span className="mono" style={{ color: "var(--fg-1)" }}>14</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span>Avg dwell</span>
              <span className="mono" style={{ color: "var(--fg-1)" }}>9.2s</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span>Fill rate</span>
              <span className="mono" style={{ color: "var(--fg-1)" }}>97%</span>
            </div>
          </div>
        </div>

        {/* Campaign */}
        <div style={{ padding: 20, borderRight: "1px solid var(--line)" }}>
          <div style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 600 }}>
            Active campaign
          </div>
          <div
            style={{
              fontFamily: "Manrope",
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 3,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {tweaks.campaignName}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-2)" }}>Mumbai metro · 14-day run</div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--fg-2)", marginBottom: 5 }}>
              <span>Delivery</span>
              <span className="mono" style={{ color: "var(--fg-1)" }}>62%</span>
            </div>
            <div style={{ height: 5, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg, var(--sun), var(--sun-deep))", borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["auto", "luxury", "EV"].map((t) => (
              <span
                key={t}
                className="mono"
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 3,
                  background: "var(--bg-3)",
                  color: "var(--fg-1)",
                  border: "1px solid var(--line-2)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Impressions sparkline */}
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              Impressions · last 5 min
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span
              style={{
                fontFamily: "Manrope",
                fontSize: 24,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {Math.round(lastImpressions)}
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-2)" }}>views / min</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ marginTop: 10, display: "block" }}>
            <defs>
              <linearGradient id="grad-ads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F7B801" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#F7B801" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaD && <path d={areaD} fill="url(#grad-ads)" />}
            {pathD && <path d={pathD} fill="none" stroke="#E09E00" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />}
            {points.length > 0 && (
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#E09E00" />
            )}
          </svg>
          <div style={{ fontSize: 10.5, color: "var(--fg-3)", marginTop: 6 }}>
            Avg dwell <span className="mono" style={{ color: "var(--fg-2)" }}>9.2s</span> · peak{" "}
            <span className="mono" style={{ color: "var(--fg-2)" }}>14:32</span>
          </div>
        </div>
      </div>
    </section>
  );
}
