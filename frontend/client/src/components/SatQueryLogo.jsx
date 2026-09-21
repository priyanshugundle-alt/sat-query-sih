import React from "react";

/**
 * SatQueryLogo — Official Earth Observation Intelligence Brand Mark
 * 
 * Segmented aperture Q ring in soft ivory with precision dark cyan antenna probe.
 * Replaces previous orange probe with dark cyan (#0B4F58 / #0E7C8A).
 * 
 * @param {number|string} size - Pixel dimension (default: 28)
 * @param {"icon"|"transparent"} variant - "icon" includes the squircle black badge, "transparent" is mark-only
 * @param {string} className - Additional CSS classes
 */
export default function SatQueryLogo({
  size = 28,
  variant = "icon",
  theme = "dark",
  className = "",
  style = {},
}) {
  const isIcon = variant === "icon";
  const isLight = theme === "light";

  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block flex-shrink-0 ${className}`}
      style={{ verticalAlign: "middle", ...style }}
    >
      <defs>
        <linearGradient id="sqDarkCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0E7C8A" />
          <stop offset="100%" stopColor="#0B4F58" />
        </linearGradient>
      </defs>

      {/* Rounded Squircle Container for "icon" variant */}
      {isIcon && (
        <>
          <rect
            width="512"
            height="512"
            rx="112"
            fill={isLight ? "#FFFFFF" : "#060A0D"}
          />
          <rect
            width="512"
            height="512"
            rx="112"
            fill="none"
            stroke={isLight ? "#CBD5E1" : "#1C323B"}
            strokeWidth={isLight ? "8" : "4"}
            opacity={isLight ? "1" : "0.6"}
          />
        </>
      )}

      {/* Segmented Aperture Q-Ring: Black in light mode, Ivory in dark mode */}
      <g fill={isLight ? "#000000" : "#F4F2EB"}>
        {/* Arc 1: Top-Right to Bottom-Right */}
        <path d="M 261.65 94.10 A 162.0 162.0 0 0 1 393.39 341.85 L 357.77 319.59 A 120.0 120.0 0 0 0 260.19 136.07 Z" />
        {/* Arc 2: Bottom to Left */}
        <path d="M 341.85 393.39 A 162.0 162.0 0 0 1 94.10 261.65 L 136.07 260.19 A 120.0 120.0 0 0 0 319.59 357.77 Z" />
        {/* Arc 3: Top-Left */}
        <path d="M 94.10 250.35 A 162.0 162.0 0 0 1 250.35 94.10 L 251.81 136.07 A 120.0 120.0 0 0 0 136.07 251.81 Z" />
      </g>

      {/* Diagonal Antenna Probe (Dark Cyan #0B4F58 / #0E7C8A) */}
      <g fill="url(#sqDarkCyanGradient)">
        <polygon points="230.56,241.88 241.88,230.56 400.25,388.94 388.94,400.25" />
        <circle cx="394.60" cy="394.60" r="23" />
      </g>
    </svg>
  );
}
