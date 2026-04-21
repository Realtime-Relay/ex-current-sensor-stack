import relayLogo from "../assets/relay-logo.svg";

export function TopBar() {
  return (
    <header
      style={{
        height: 68,
        padding: "0 24px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        background: "rgba(245,242,234,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {/*
        Logo is the "white" variant from /graphics/relay_white_svg.svg. Toolbar
        background is cream — we invert to render the wordmark dark without
        touching the SVG, then hue-rotate to keep the brand orange orange.
      */}
      <img
        src={relayLogo}
        alt="RelayX"
        style={{
          height: 32,
          width: "auto",
          display: "block",
          filter: "invert(1) hue-rotate(180deg)",
        }}
      />
    </header>
  );
}
