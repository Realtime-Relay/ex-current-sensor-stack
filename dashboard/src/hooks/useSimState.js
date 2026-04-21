import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Everything in the design the device does NOT actually publish lives here —
 * session state, events, alerts, ads. The INA219 firmware publishes power,
 * current, volt only; those are pulled from real RelayX via the @relay-x/ui
 * hooks in the components that need them.
 *
 * When the firmware grows to publish real session / event / alert telemetry,
 * this file gets leaner.
 */
export function useSimState({ tempThreshold = 58, pricePerKwh = 29.5 } = {}) {
  const [state, setState] = useState({
    temperature: 34.8,
    session_state: "idle", // idle | preparing | charging | finishing
    connector_status: "available",
    energy_delivered: 0,
    session_duration: 0,
    energy_cost: 0,
    events: [],
    alerts: [],
    ads_played: 1214,
    screen_uptime: 99.8,
    ad_impressions_history: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;
  const tempBoostRef = useRef(0);
  const consecHotRef = useRef(0);

  // seed ad impressions history
  useEffect(() => {
    const now = Date.now();
    const seedAds = [];
    for (let i = 30; i >= 1; i--) {
      seedAds.push({ t: now - i * 10000, v: 40 + Math.random() * 20 });
    }
    setState((s) => ({ ...s, ad_impressions_history: seedAds }));
  }, []);

  const pushEvent = useCallback((type, title, icon) => {
    setState((s) => ({
      ...s,
      events: [
        { id: Date.now() + Math.random(), t: Date.now(), type, title, icon },
        ...s.events,
      ].slice(0, 40),
    }));
  }, []);

  const startSession = useCallback(() => {
    setState((s) => ({
      ...s,
      session_state: "preparing",
      connector_status: "connected",
    }));
    pushEvent("connector", "Connector engaged · Type 2", "plug");
    pushEvent("session", "Session initializing · authorizing", "clock");
    setTimeout(() => {
      setState((s) => ({
        ...s,
        session_state: "charging",
        connector_status: "locked",
        energy_delivered: 0,
        session_duration: 0,
        energy_cost: 0,
      }));
      pushEvent("session", "Session started on connector 1", "bolt");
    }, 2500);
  }, [pushEvent]);

  const stopSession = useCallback(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          setState((s) => ({ ...s, session_state: "finishing" }));
          pushEvent("session", "Stop command acknowledged", "stop");
          setTimeout(() => {
            setState((s) => ({
              ...s,
              session_state: "idle",
              connector_status: "available",
            }));
            pushEvent("session", "Session ended · cable released", "check");
          }, 2000);
          resolve();
        }, 300);
      }),
    [pushEvent],
  );

  // Temperature drift + dev-button spike
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const target = 35 + tempBoostRef.current;
        const temperature =
          s.temperature + (target - s.temperature) * 0.15 + (Math.random() - 0.5) * 0.3;

        let energy_delivered = s.energy_delivered;
        let session_duration = s.session_duration;
        let energy_cost = s.energy_cost;

        if (s.session_state === "charging") {
          const powerKw = 7.18 + (Math.random() - 0.5) * 0.2;
          energy_delivered = s.energy_delivered + powerKw * (0.5 / 3600);
          session_duration = s.session_duration + 0.5;
          energy_cost = energy_delivered * pricePerKwh;
        }

        return { ...s, temperature, energy_delivered, session_duration, energy_cost };
      });
    }, 500);
    return () => clearInterval(id);
  }, [pricePerKwh]);

  // Temperature alert detection (>threshold for >3 consecutive samples)
  useEffect(() => {
    if (state.temperature > tempThreshold) {
      consecHotRef.current += 1;
      if (
        consecHotRef.current > 3 &&
        !state.alerts.find((a) => a.id === "temp-high")
      ) {
        const alert = {
          id: "temp-high",
          severity: "critical",
          title: "High temperature",
          subtitle: `Temperature ${state.temperature.toFixed(1)}°C exceeds threshold ${tempThreshold.toFixed(1)}°C`,
          device: "SF-DEMO-001",
          t: Date.now(),
        };
        setState((s) => ({ ...s, alerts: [alert, ...s.alerts] }));
        pushEvent("alert", "Alert raised: High temperature", "warn");
      }
    } else {
      consecHotRef.current = 0;
    }
  }, [state.temperature, tempThreshold, state.alerts, pushEvent]);

  // Ads ticker
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => ({
        ...s,
        ads_played: s.ads_played + 1,
        ad_impressions_history: [
          ...s.ad_impressions_history,
          { t: Date.now(), v: 40 + Math.random() * 25 },
        ].slice(-40),
      }));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const devSpikeTemp = useCallback(() => {
    tempBoostRef.current = 32;
    setTimeout(() => {
      tempBoostRef.current = 0;
    }, 12000);
  }, []);

  const acknowledgeAlert = useCallback(
    (id) => {
      setState((s) => ({ ...s, alerts: s.alerts.filter((a) => a.id !== id) }));
      pushEvent("alert", "Alert acknowledged", "check");
    },
    [pushEvent],
  );

  return {
    state,
    startSession,
    stopSession,
    devSpikeTemp,
    acknowledgeAlert,
  };
}
