// Tiny stroke icon set matching the design.
export const I = {
  bolt: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 1.5L3 9h4l-1 5.5L12 7H8l1-5.5z" />
    </svg>
  ),
  plug: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2v3M10 2v3M4.5 5h7v3a3.5 3.5 0 0 1-7 0V5zM8 11.5V14" />
    </svg>
  ),
  clock: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  ),
  stop: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
    </svg>
  ),
  play: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
      <path d="M5 3L12.5 8L5 13Z" />
    </svg>
  ),
  check: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5L6.5 12 13 4.5" />
    </svg>
  ),
  warn: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2L14.5 13.5h-13L8 2z" />
      <path d="M8 6.5v3M8 11.5v.01" />
    </svg>
  ),
  settings: (p) => (
    <svg {...p} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2" />
      <path d="M13 8a5 5 0 0 0-.07-.85l1.3-1-1.3-2.25-1.55.58a5 5 0 0 0-1.47-.85L9.7 2H6.3l-.2 1.63a5 5 0 0 0-1.47.85l-1.55-.58L1.77 6.15l1.3 1A5 5 0 0 0 3 8c0 .29.02.57.07.85l-1.3 1 1.3 2.25 1.55-.58a5 5 0 0 0 1.47.85l.2 1.63h3.4l.2-1.63a5 5 0 0 0 1.47-.85l1.55.58 1.3-2.25-1.3-1c.05-.28.07-.56.07-.85z" />
    </svg>
  ),
};
