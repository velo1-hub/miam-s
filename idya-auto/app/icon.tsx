import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Favicon — brief §3.9, from the official logo: red swoosh over a white italic « I » on near-black. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080A",
          color: "#fff",
          borderRadius: 14,
        }}
      >
        <svg viewBox="0 0 200 44" width="52" height="12" fill="#E21F26">
          <path d="M0 37C34 24 70 9 114 5c33-3 62 5 86 22l-3 3C173 16 146 10 115 11 73 13 38 27 3 40z" />
          <path d="M56 34c30-10 68-15 112-8l-2 3c-42-5-78-1-108 9z" />
        </svg>
        <div style={{ fontSize: 34, fontWeight: 800, fontStyle: "italic", fontFamily: "sans-serif", lineHeight: 1, marginTop: 2 }}>I</div>
      </div>
    ),
    size,
  );
}
