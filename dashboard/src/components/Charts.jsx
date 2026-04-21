import { useMemo } from "react";
import { TimeSeries, useRelayTimeSeries } from "@relay-x/ui";

import { DEVICE_IDENT } from "../relayx.js";

/**
 * Live time-series chart backed by real RelayX telemetry. Wraps the UI Kit's
 * <TimeSeries /> with a rolling window and the chrome the design calls for.
 */
export function LiveChart({ title, subtitle, metric, color, unit, decimals = 2 }) {
  // 5-minute rolling window. Memoized so the hook doesn't re-fetch on every
  // render; new points stream in incrementally.
  const timeRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 5 * 60 * 1000);
    return { start, end };
  }, []);

  const { data: tsData, isLoading } = useRelayTimeSeries({
    deviceIdent: DEVICE_IDENT,
    metrics: [metric],
    timeRange,
    mode: "both", // fetch history, then stream live
    maxPoints: 2000,
  });

  // TimeSeries expects Record<deviceIdent, DataPoint[]> — NOT a flat array.
  const chartData = useMemo(
    () => ({ [DEVICE_IDENT]: tsData ?? [] }),
    [tsData],
  );

  const latest =
    tsData && tsData.length > 0 ? Number(tsData[tsData.length - 1][metric] ?? 0) : 0;

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: 20,
        flex: 1,
        boxShadow: "0 1px 2px rgba(21,17,10,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontFamily: "Manrope", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 2 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: "Manrope",
              fontSize: 22,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              color: "var(--ink)",
              letterSpacing: "-0.02em",
            }}
          >
            {isLoading && !tsData?.length ? "—" : latest.toFixed(decimals)}
          </span>
          <span style={{ fontSize: 11, color: "var(--fg-2)", fontWeight: 500 }}>{unit}</span>
        </div>
      </div>

      {/* TimeSeries fills its container's height */}
      <div style={{ height: 180 }}>
        <TimeSeries
          data={chartData}
          metrics={[{ key: metric, label: unit, color }]}
          timeWindow={5 * 60 * 1000}
          autoScroll
          area
          showLoading={isLoading}
        />
      </div>
    </div>
  );
}
