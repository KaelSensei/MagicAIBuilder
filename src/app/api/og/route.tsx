import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const MANA_COLORS: Record<string, string> = {
  W: "#f9faf4",
  U: "#0e68ab",
  B: "#6b21a8",
  R: "#d3202a",
  G: "#00733e",
  C: "#9ca3af",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "My Commander Deck";
  const commander = searchParams.get("commander") ?? "";
  const colors = searchParams.get("colors")?.split("") ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundColor: "#0a0a0f",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg, #6366f1, #818cf8)",
          }}
        />

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            top: "48px",
            right: "60px",
            color: "#6366f1",
            fontSize: "22px",
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          MagicAIBuilder
        </div>

        {/* Color pips */}
        {colors.length > 0 && (
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            {colors.map((c) => (
              <div
                key={c}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: MANA_COLORS[c] ?? "#9ca3af",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        )}

        {/* Deck title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "#e8e8ec",
            lineHeight: 1.1,
            letterSpacing: "-1px",
            maxWidth: "900px",
          }}
        >
          {title}
        </div>

        {/* Commander name */}
        {commander && (
          <div
            style={{
              marginTop: "16px",
              fontSize: "28px",
              color: "#8888a0",
              fontWeight: 500,
            }}
          >
            Commander: {commander}
          </div>
        )}

        {/* Tagline */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "20px",
            color: "#4a4a6a",
          }}
        >
          Built with MagicAIBuilder · MTG Commander Deck Builder
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
