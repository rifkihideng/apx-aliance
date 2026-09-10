import { ImageResponse } from "next/og";

export const alt = "APX Alliance — Narco Empire";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 24,
              background: "#10b981",
              color: "#09090b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 900,
            }}
          >
            APX
          </div>
          <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>
            APX ALLIANCE
          </div>
        </div>
        <div style={{ marginTop: 28, fontSize: 36, color: "#a1a1aa" }}>
          Narco Empire — Aliansi Elit
        </div>
      </div>
    ),
    size
  );
}
