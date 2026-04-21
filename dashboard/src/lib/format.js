export const fmt = (n, d = 1) =>
  n == null || isNaN(n) ? "—" : Number(n).toFixed(d);

export const fmtInt = (n) =>
  new Intl.NumberFormat("en-IN").format(Math.floor(n));

export const fmtINR = (n) =>
  "₹" +
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);

export const fmtDuration = (sec) => {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
};

export const relTime = (t) => {
  const d = (Date.now() - t) / 1000;
  if (d < 1) return "now";
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
};
