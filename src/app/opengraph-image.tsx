import { ImageResponse } from "next/og";
import { PROJECT_TITLE, PROJECT_DESCRIPTION } from "~/lib/constants";

export const runtime = "edge";
export const alt = PROJECT_TITLE;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#39ff14",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        <div style={{ fontSize: 120, marginBottom: 24 }}>J</div>
        <div>{PROJECT_TITLE}</div>
        <div style={{ fontSize: 28, color: "#a1a1aa", marginTop: 16, fontWeight: 400 }}>
          {PROJECT_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size }
  );
}
