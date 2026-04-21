import { useEffect, useState } from "react";

import { TopBar } from "./components/TopBar.jsx";
import { DeviceCard } from "./components/DeviceCard.jsx";
import { LiveChart } from "./components/Charts.jsx";
import { EventsCard, AlertsCard } from "./components/EventsAlerts.jsx";
import { useSimState } from "./hooks/useSimState.js";

const TWEAK_DEFAULTS = {
  accentColor: "#157A3E",
  deviceName: "SF-DEMO-001",
  location: "Radisson Gurugram · Bay 3",
  pricePerKwh: 29.5,
  campaignName: "Mercedes EQS launch",
  tenantLabel: "sunfuel / adpod-pilot",
  showAdCard: true,
  tempThreshold: 58,
  environment: "production · mumbai-1",
};

export default function App() {
  const [tweaks] = useState(TWEAK_DEFAULTS);
  const { state, devSpikeTemp, acknowledgeAlert } = useSimState({
    tempThreshold: tweaks.tempThreshold,
    pricePerKwh: tweaks.pricePerKwh,
  });

  // Apply accent color live
  useEffect(() => {
    document.documentElement.style.setProperty("--blue", tweaks.accentColor);
  }, [tweaks.accentColor]);

  return (
    <div>
      <TopBar />
      <main
        style={{
          padding: "20px 24px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          maxWidth: 1440,
          margin: "0 auto",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            paddingBottom: 2,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--fg-2)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Fleet · EV Charger Network
            </div>
            <h1
              style={{
                fontFamily: "Manrope",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                margin: 0,
                color: "var(--ink)",
              }}
            >
              Charger 1
            </h1>
          </div>
        </div>

        <DeviceCard simState={state} onDevSpike={devSpikeTemp} tweaks={tweaks} />

        {/* Charts row — real RelayX telemetry */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <LiveChart
            title="Power draw"
            subtitle="power · mW · 5 min (live)"
            metric="power"
            color="#157A3E"
            unit="mW"
            decimals={2}
          />
          <LiveChart
            title="Current draw"
            subtitle="current · mA · 5 min (live)"
            metric="current"
            color="#E09E00"
            unit="mA"
            decimals={2}
          />
          <LiveChart
            title="Bus voltage"
            subtitle="volt · V · 5 min (live)"
            metric="volt"
            color="#1E5FAE"
            unit="V"
            decimals={2}
          />
        </div>

        {/* Events + alerts (simulated, server-side rules engine would drive these) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <EventsCard events={state.events} />
          <AlertsCard alerts={state.alerts} onAck={acknowledgeAlert} />
        </div>

      </main>
    </div>
  );
}
