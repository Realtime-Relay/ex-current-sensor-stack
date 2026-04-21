import { useEffect, useMemo, useState } from "react";
import { useRelayLatest } from "@relay-x/ui";

/**
 * Derive online state from telemetry freshness.
 *
 * `useRelayPresence` from @relay-x/ui only observes state transitions — if the
 * device was already online before the dashboard mounted, no event fires and
 * the hook stays at `null` forever. We side-step that by watching the latest
 * timestamp on a chosen metric: if a reading arrived within `graceMs`, we call
 * the device online.
 *
 * A companion tick keeps the predicate live even when no new data arrives
 * (otherwise "stale" never flips to offline until a new point comes in).
 */
export function useOnline({
  deviceIdent,
  metric = "volt",
  graceMs = 30000,
  tickMs = 5000,
}) {
  const timeRange = useMemo(
    () => ({ start: new Date(Date.now() - 60 * 1000), end: new Date() }),
    [],
  );
  const { timestamp } = useRelayLatest({ deviceIdent, metric, timeRange });

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  if (timestamp == null) return { online: null, lastSeenMs: null };
  return { online: now - timestamp < graceMs, lastSeenMs: timestamp };
}
