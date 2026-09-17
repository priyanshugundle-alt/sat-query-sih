import React from "react";

export function OrbitalScanSignature({ variant = "symbol", className = "" }) {
  if (variant === "symbol") {
    return (
      <div 
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#0D171C] border border-[#1C323B] shadow-sm overflow-hidden flex-shrink-0 ${className}`}
        title="SatQuery Orbital Scanner"
      >
        <svg className="w-full h-full" viewBox="0 0 36 36" fill="none">
          <circle cx="18" cy="18" r="4" fill="#0D171C" stroke="#1C323B" strokeWidth="1" />
          <circle cx="18" cy="18" r="1.8" fill="#12A5B8" opacity="0.95" />
          <ellipse
            cx="18"
            cy="18"
            rx="13"
            ry="7.5"
            stroke="#12A5B8"
            strokeWidth="0.8"
            strokeDasharray="2 2"
            opacity="0.55"
            transform="rotate(-25 18 18)"
          />
          <g className="sq-orbit-spin origin-center">
            <circle cx="5.5" cy="15" r="1.8" fill="#22D3EE" />
            <line x1="3" y1="15" x2="8" y2="15" stroke="#22D3EE" strokeWidth="0.6" />
          </g>
          <path
            d="M 18 18 L 7 31 L 29 31 Z"
            fill="url(#scanGradientMini)"
            opacity="0.22"
            className="sq-scan-pulse origin-top"
          />
          <defs>
            <linearGradient id="scanGradientMini" x1="18" y1="18" x2="18" y2="31" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#12A5B8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#12A5B8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className={`relative w-24 h-24 mx-auto flex items-center justify-center ${className}`}>
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="14" fill="#0D171C" stroke="#1C323B" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="18" stroke="#1C323B" strokeWidth="0.75" strokeDasharray="3 3" opacity="0.6" />
          <circle cx="50" cy="50" r="4.5" fill="#12A5B8" opacity="0.95" />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="20"
            stroke="#12A5B8"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.65"
            transform="rotate(-28 50 50)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="42"
            ry="15"
            stroke="#0E7C8A"
            strokeWidth="0.6"
            strokeDasharray="2 4"
            opacity="0.4"
            transform="rotate(35 50 50)"
          />
          <g className="sq-orbit-spin-slow origin-center">
            <g transform="translate(14, 42)">
              <rect x="-3" y="-3" width="6" height="6" fill="#22D3EE" rx="1" />
              <line x1="-7" y1="0" x2="-3" y2="0" stroke="#FFFFFF" strokeWidth="1.2" />
              <line x1="3" y1="0" x2="7" y2="0" stroke="#FFFFFF" strokeWidth="1.2" />
              <path
                d="M 0 3 L -12 32 L 12 32 Z"
                fill="url(#heroScanBeam)"
                opacity="0.35"
              />
            </g>
          </g>
          <defs>
            <linearGradient id="heroScanBeam" x1="0" y1="3" x2="0" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#12A5B8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#12A5B8" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0D171C] border border-[#1C323B] text-xs font-mono text-[#FFFFFF] ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12A5B8] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#12A5B8]"></span>
      </span>
      <span className="tracking-wider uppercase text-[11px] text-[#12A5B8] font-semibold">ORBITAL SCAN</span>
      <span className="text-[#8AA3AD]">•</span>
      <span className="text-[#F0F6F8] text-[10px]">ACTIVE PASS</span>
    </div>
  );
}

export default OrbitalScanSignature;
