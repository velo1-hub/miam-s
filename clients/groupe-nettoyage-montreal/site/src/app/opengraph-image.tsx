import { ImageResponse } from "next/og";
export const alt = "Groupe Nettoyage Montréal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg,#07192d 0%,#0b2341 60%,#123259 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="52" height="52" viewBox="0 0 48 48"><path d="M10 25C16 15 25 11 36 12" fill="none" stroke="#0f1424" strokeWidth="4.6" strokeLinecap="round" /><path d="M35 24l1.9 4.6 4.6 1.9-4.6 1.9L35 37l-1.9-4.6-4.6-1.9 4.6-1.9z" fill="#f0a12e" /></svg></div>
          <div style={{ fontSize: 34, fontWeight: 700, display: "flex" }}>Groupe Nettoyage Montréal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, display: "flex" }}>Des locaux impeccables,</div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2, color: "#e9a84c", display: "flex" }}>sans y penser.</div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,.75)", display: "flex" }}>Bureaux · Restaurants · Immeubles · Locations court terme · Montréal, Laval, Rive-Sud</div>
        </div>
        <div style={{ display: "flex", gap: 36, fontSize: 24, color: "rgba(255,255,255,.85)" }}><div style={{ display: "flex" }}>Assurés · CNESST</div><div style={{ display: "flex" }}>Même équipe</div><div style={{ display: "flex" }}>Rapport photo</div><div style={{ display: "flex" }}>Soumission en 24 h</div></div>
      </div>
    ), { ...size },
  );
}
