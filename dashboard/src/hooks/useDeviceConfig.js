import { useEffect, useState } from "react";
import { useRelayApp } from "@relay-x/ui";

/**
 * Fetches the device record once on mount and exposes the `config` KV blob.
 *
 * Returns:
 *   - config: {} until loaded, then whatever was set on the device (keys + values)
 *   - isLoading: true until the first successful fetch (or error)
 *   - error: Error | null
 *
 * The App SDK caches the device record for 2 hours by default, so repeat
 * mounts are cheap. Call `refresh()` to bust the cache and re-fetch.
 */
export function useDeviceConfig(deviceIdent) {
  const app = useRelayApp();
  const [config, setConfig] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    if (!app) return;
    let cancelled = false;

    (async () => {
      try {
        const device = await app.device.get({ ident: deviceIdent });
        if (cancelled) return;
        setConfig(device?.config ?? {});
        setIsLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [app, deviceIdent, refreshCount]);

  const refresh = () => {
    if (app?.device?.clearCache) app.device.clearCache();
    setRefreshCount((n) => n + 1);
  };

  return { config, isLoading, error, refresh };
}
