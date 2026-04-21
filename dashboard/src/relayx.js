import { RelayApp } from "@relay-x/app-sdk";

/**
 * Single RelayApp instance shared across the dashboard. Configured from Vite
 * env vars — copy .env.example to .env.local and fill in your creds.
 */
export const app = new RelayApp({
  api_key: import.meta.env.VITE_RELAYX_API_KEY,
  secret: import.meta.env.VITE_RELAYX_SECRET,
  mode: import.meta.env.VITE_RELAYX_MODE || "production",
});

export const DEVICE_IDENT =
  import.meta.env.VITE_DEVICE_IDENT || "cold-storage-001";
