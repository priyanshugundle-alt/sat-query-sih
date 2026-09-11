import React from "react";

export function EarthObservationHero() {
  return (
    <div className="sq-earth-obs-bg absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
      <svg className="w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="geoGrid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#292B32" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="1.5" fill="#D99A2B" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#geoGrid)" />

        <g stroke="#171821" strokeWidth="0.8" fill="none" opacity="0.6">
          <path d="M -100 250 C 200 180, 450 340, 750 210 C 1050 80, 1350 260, 1650 180" />
          <path d="M -80 320 C 220 250, 480 400, 780 280 C 1080 160, 1380 330, 1680 250" />
          <path d="M -50 400 C 250 340, 520 480, 820 360 C 1120 240, 1420 410, 1720 330" />
          <path d="M -30 490 C 280 430, 560 560, 860 440 C 1160 320, 1460 490, 1760 410" />
          <path d="M 0 580 C 310 520, 600 640, 900 520 C 1200 400, 1500 570, 1800 490" />
        </g>

        <g className="opacity-90">
          <path
            d="M -150 150 Q 800 50 1800 450"
            fill="none"
            stroke="#D99A2B"
            strokeWidth="1.2"
            strokeDasharray="6 6"
          />

          <g className="sq-satellite-transit">
            <circle cx="0" cy="0" r="4" fill="#D99A2B" />
            <circle cx="0" cy="0" r="9" stroke="#F0B84B" strokeWidth="0.75" strokeDasharray="2 2" />
            <line x1="-12" y1="0" x2="-4" y2="0" stroke="#171821" strokeWidth="1.5" />
            <line x1="4" y1="0" x2="12" y2="0" stroke="#171821" strokeWidth="1.5" />
          </g>
        </g>
      </svg>

      <div className="absolute top-20 left-8 font-mono text-[10px] text-[#687078] tracking-widest opacity-60">
        LAT 18°31'13"N • LON 73°51'24"E • GSD 0.5M
      </div>
      <div className="absolute top-20 right-8 font-mono text-[10px] text-[#687078] tracking-widest opacity-60">
        SENTINEL-2 / LANDSAT-9 • ORBIT INC 98.62°
      </div>
      <div className="absolute bottom-12 left-8 font-mono text-[10px] text-[#687078] tracking-widest opacity-60">
        WGS 84 / UTM ZONE 43N • EPSG:32643
      </div>
      <div className="absolute bottom-12 right-8 font-mono text-[10px] text-[#687078] tracking-widest opacity-60">
        SATQUERY SATELLITE INTELLIGENCE
      </div>
    </div>
  );
}

export default EarthObservationHero;
