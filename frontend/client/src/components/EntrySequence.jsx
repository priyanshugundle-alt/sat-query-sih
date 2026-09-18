/**
 * EntrySequence.jsx — SatQuery AI Cinematic Entrance
 *
 * VISUAL SEQUENCE (~2.5s total, CSS-only, no external libs):
 *
 *   0.0s  Dark navy base + subtle Earth-tone radial glow
 *   0.3s  Geographic grid lines emerge (very faint)
 *   0.8s  Thin amber observation line sweeps left → right
 *   1.2s  "SATQUERY AI" wordmark fades in as scan passes
 *   1.6s  Subtitle / tagline appears
 *   1.9s  Status line: "INITIALIZING ANALYSIS ENVIRONMENT"
 *   2.4s  Entire entry dissolves (opacity 0, scale 1.01)
 *         → Investigation workspace is already underneath
 *
 * Reduced motion: instant app reveal, no animation.
 *
 * NO spinners. NO progress bars. NO particles. NO terminal text.
 * The visual language is: satellite observation scan revealing a title.
 */

import { useEffect, useRef, useState } from "react";

export function EntrySequence({ onComplete }) {
  const [phase, setPhase] = useState(0);
  // phase 0 = base; 1 = grid; 2 = scan; 3 = wordmark; 4 = subtitle; 5 = status; 6 = dissolving

  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) {
      onComplete?.();
      return;
    }

    const timings = [
      [1,   250],   // grid lines
      [2,   720],   // scan line starts
      [3,  1150],   // wordmark
      [4,  1600],   // subtitle
      [5,  1950],   // status
      [6,  2350],   // dissolve begins
    ];

    const ids = timings.map(([p, t]) =>
      setTimeout(() => setPhase(p), t)
    );

    // Remove component after dissolve completes
    const done = setTimeout(() => onComplete?.(), 2900);

    return () => {
      ids.forEach(clearTimeout);
      clearTimeout(done);
    };
  }, []);

  if (prefersReduced) return null;

  return (
    <div
      aria-hidden="true"
      className="entry-sequence"
      style={{
        opacity:    phase >= 6 ? 0    : 1,
        transform:  phase >= 6 ? "scale(1.015)" : "scale(1)",
        transition: phase >= 6 ? "opacity 500ms ease-out, transform 500ms ease-out" : "none",
        pointerEvents: phase >= 6 ? "none" : "all",
      }}
    >
      {/* ── Layer 1: Deep navy base (always visible) ────────── */}
      <div className="entry-base" />

      {/* ── Layer 2: Radial atmospheric glow ────────────────── */}
      <div
        className="entry-glow"
        style={{
          opacity:    phase >= 1 ? 1 : 0,
          transition: "opacity 1.2s ease-out",
        }}
      />

      {/* ── Layer 3: Geographic / topographic grid SVG ───────── */}
      <svg
        className="entry-grid"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{
          opacity:    phase >= 1 ? 1 : 0,
          transition: "opacity 1.0s ease-out 0.1s",
        }}
      >
        {/* Lat/lon grid lines */}
        {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((r, i) => (
          <line
            key={`h${i}`}
            x1="0" y1={r * 900} x2="1440" y2={r * 900}
            stroke="#4D88A8" strokeWidth="0.4" strokeOpacity="0.25"
            strokeDasharray="6 10"
          />
        ))}
        {[0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9].map((c, i) => (
          <line
            key={`v${i}`}
            x1={c * 1440} y1="0" x2={c * 1440} y2="900"
            stroke="#4D88A8" strokeWidth="0.4" strokeOpacity="0.25"
            strokeDasharray="6 10"
          />
        ))}

        {/* Subtle topographic contour arc */}
        <path
          d="M -80 520 C 200 440, 520 590, 840 480 C 1160 370, 1380 510, 1540 450"
          fill="none"
          stroke="#4D88A8"
          strokeWidth="0.7"
          strokeOpacity="0.18"
        />
        <path
          d="M -80 580 C 220 500, 540 650, 860 540 C 1180 430, 1400 570, 1560 510"
          fill="none"
          stroke="#4D88A8"
          strokeWidth="0.5"
          strokeOpacity="0.12"
        />

        {/* Orbital arc (partial ellipse, upper right) */}
        <ellipse
          cx="1150" cy="180" rx="340" ry="140"
          fill="none"
          stroke="#D6A23A"
          strokeWidth="0.6"
          strokeOpacity="0.18"
          strokeDasharray="8 14"
        />

        {/* Corner coordinate labels */}
        <text x="28" y="880" fontFamily="'Noto Sans Mono', monospace" fontSize="9" fill="#4D88A8" opacity="0.4">
          18.52° N 73.86° E
        </text>
        <text x="1300" y="880" fontFamily="'Noto Sans Mono', monospace" fontSize="9" fill="#4D88A8" opacity="0.4">
          WGS 84 / EPSG:4326
        </text>
        <text x="28" y="24" fontFamily="'Noto Sans Mono', monospace" fontSize="9" fill="#4D88A8" opacity="0.4">
          ISRO · SPACE TECHNOLOGY
        </text>
      </svg>

      {/* ── Layer 4: Amber scan line sweeping L→R ────────────── */}
      {phase >= 2 && (
        <div
          className="entry-scanline"
          style={{ animationPlayState: "running" }}
        />
      )}

      {/* ── Layer 5: Brand wordmark ─────────────────────────── */}
      <div className="entry-wordmark">
        <div
          className="entry-wordmark-title"
          style={{
            opacity:    phase >= 3 ? 1 : 0,
            transform:  phase >= 3 ? "translateY(0)"   : "translateY(12px)",
            transition: "opacity 700ms ease-out, transform 700ms ease-out",
          }}
        >
          SATQUERY AI
        </div>

        {/* Thin amber line beneath title */}
        <div
          className="entry-wordmark-rule"
          style={{
            transform:  phase >= 3 ? "scaleX(1)" : "scaleX(0)",
            transition: "transform 600ms cubic-bezier(0.4, 0, 0.2, 1) 200ms",
          }}
        />

        <div
          className="entry-wordmark-sub"
          style={{
            opacity:    phase >= 4 ? 1 : 0,
            transform:  phase >= 4 ? "translateY(0)"  : "translateY(8px)",
            transition: "opacity 600ms ease-out, transform 600ms ease-out",
          }}
        >
          INTERACTIVE VISION-LANGUAGE ASSISTANT
          <br />
          REMOTE-SENSING IMAGE ANALYSIS
        </div>

        <div
          className="entry-wordmark-status"
          style={{
            opacity:    phase >= 5 ? 1 : 0,
            transition: "opacity 500ms ease-out",
          }}
        >
          <span className="entry-status-dot" />
          INITIALIZING ANALYSIS ENVIRONMENT
        </div>
      </div>
    </div>
  );
}
