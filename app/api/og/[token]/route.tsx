import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getSharedTrack } from "@/lib/share";
import { isValidShareToken } from "@/lib/share/token";

export const runtime = "edge";

// OG Image dimensions
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Extract BPM from Tone.js code
 */
function extractBPM(code: string): number | null {
  // Look for bpm.value = X or Transport.bpm = X patterns
  const patterns = [
    /bpm\.value\s*=\s*(\d+)/,
    /Transport\.bpm\s*=\s*(\d+)/,
    /\.bpm\s*=\s*(\d+)/,
    /bpm:\s*(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = code.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

/**
 * Generate waveform bars for visual effect
 */
function generateWaveformBars(count: number, seed: string): number[] {
  // Use track name as seed for consistent waveform per track
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash = hash & hash;
  }

  const bars: number[] = [];
  for (let i = 0; i < count; i++) {
    // Create visually pleasing waveform pattern
    const val =
      30 +
      Math.abs(Math.sin(i * 0.3 + hash) * 25) +
      Math.abs(Math.cos(i * 0.7 + hash) * 20) +
      Math.abs(Math.sin(i * 1.2) * 15);
    bars.push(Math.min(90, Math.max(20, val)));
  }
  return bars;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Validate token
  if (!isValidShareToken(token)) {
    return new Response("Invalid token", { status: 400 });
  }

  // Get track data
  const track = await getSharedTrack(token);
  if (!track) {
    return new Response("Track not found", { status: 404 });
  }

  const bpm = extractBPM(track.current_code);
  const waveformBars = generateWaveformBars(60, track.name + track.id);

  return new ImageResponse(
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.15,
        }}
      />

      {/* Glow effect at top */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 400,
          background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "60px 80px",
          flex: 1,
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Header with logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#22d3ee",
              boxShadow: "0 0 20px rgba(34,211,238,0.6)",
            }}
          />
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              background: "linear-gradient(90deg, #67e8f9, #22d3ee)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            LoField Music Lab
          </span>
        </div>

        {/* Track name */}
        <h1
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#f8fafc",
            margin: 0,
            marginBottom: 16,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          {track.name}
        </h1>

        {/* Author and BPM */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 40,
          }}
        >
          {track.author_name && (
            <span
              style={{
                fontSize: 24,
                color: "#94a3b8",
              }}
            >
              by {track.author_name}
            </span>
          )}
          {bpm && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(34,211,238,0.15)",
                border: "1px solid rgba(34,211,238,0.3)",
              }}
            >
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#22d3ee",
                }}
              >
                {bpm} BPM
              </span>
            </div>
          )}
        </div>

        {/* Waveform visualization */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 4,
            height: 180,
            marginTop: "auto",
          }}
        >
          {waveformBars.map((height, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: `${height}%`,
                background: `linear-gradient(to top, rgba(34,211,238,0.7), rgba(34,211,238,0.3))`,
                borderRadius: 4,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 80px",
          borderTop: "1px solid rgba(34,211,238,0.2)",
          background: "rgba(15,23,42,0.8)",
        }}
      >
        <span
          style={{
            fontSize: 20,
            color: "#64748b",
          }}
        >
          lofield.fm
        </span>
        <span
          style={{
            fontSize: 18,
            color: "#64748b",
          }}
        >
          AI-Powered Music Creation
        </span>
      </div>
    </div>,
    {
      width: WIDTH,
      height: HEIGHT,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
