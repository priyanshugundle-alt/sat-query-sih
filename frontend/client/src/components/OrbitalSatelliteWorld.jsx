import React, { useEffect, useRef } from "react";

/**
 * OrbitalSatelliteWorld (ISRO)
 * 
 * Background Satellite & Remote-Sensing World:
 * - Subtle realistic satellite silhouettes travelling slowly on orbital arcs
 * - Broken / faded orbital trajectory arcs
 * - Technical telemetry labels (ORBIT / 04, ALT / 684 KM, LAT / 18.5312, LON / 73.8478)
 * - Remote-sensing footprint geometry & coordinate ticks
 * - 3-depth plane parallax (FAR: stars & arcs, MID: satellite silhouettes & beams, NEAR: interactive space)
 */
import { useReducedMotion } from '@/hooks/useReducedMotion';

export function OrbitalSatelliteWorld({ className = "", opacity = 1 }) {
  const containerRef = useRef(null);

  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return undefined; // skip mousemove handling when reduced motion is preferred
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 15;
      const y = (e.clientY / window.innerHeight - 0.5) * 15;
      containerRef.current.style.setProperty("--parallax-x", `${x}px`);
      containerRef.current.style.setProperty("--parallax-y", `${y}px`);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reduced]);
// Removed duplicate effect

  return (
    <div
      ref={containerRef}
      style={{ opacity }}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none transition-opacity duration-1000 ${className}`}
    >
      {/* ─── PLANE 1: FAR DEPTH (Stars, coordinate ticks, fine orbital arcs) ─── */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: "translate(calc(var(--parallax-x, 0px) * 0.3), calc(var(--parallax-y, 0px) * 0.3))" }}
      >
        <svg className="w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="orbitalArcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0E7C8A" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#12A5B8" stopOpacity="0.2" />
              <stop offset="80%" stopColor="#0B4F58" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#040708" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="orbitalArcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#12A5B8" stopOpacity="0.3" />
              <stop offset="60%" stopColor="#0E7C8A" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#040708" stopOpacity="0" />
            </linearGradient>

            {/* Technical grid pattern */}
            <pattern id="techGridTick" width="120" height="120" patternUnits="userSpaceOnUse">
              <path d="M 120 0 L 0 0 0 120" fill="none" stroke="#F0F6F8" strokeWidth="0.4" strokeOpacity="0.06" strokeDasharray="2 4" />
              <circle cx="0" cy="0" r="1" fill="#12A5B8" fillOpacity="0.3" />
            </pattern>
          </defs>

          {/* Deep space coordinate grid */}
          <rect width="100%" height="100%" fill="url(#techGridTick)" />

          {/* Broken orbital trajectory arc 1 (Sun-Synchronous Orbit 98.2° Inclination) */}
          <path
            d="M -100 250 C 300 80, 850 140, 1400 350 C 1800 500, 2100 800, 2400 1200"
            fill="none"
            stroke="url(#orbitalArcGrad1)"
            strokeWidth="1"
            strokeDasharray="8 6 2 6"
          />

          {/* Broken orbital trajectory arc 2 (Equatorial Observation Track) */}
          <path
            d="M -150 750 C 450 650, 1100 480, 1850 620 C 2200 700, 2500 900, 2800 1100"
            fill="none"
            stroke="url(#orbitalArcGrad2)"
            strokeWidth="0.75"
            strokeDasharray="4 8"
          />

          {/* Remote-sensing ground swath footprint boundary */}
          <polygon
            points="120,180 340,140 460,320 220,380"
            fill="#0E7C8A"
            fillOpacity="0.02"
            stroke="#12A5B8"
            strokeWidth="0.5"
            strokeOpacity="0.25"
            strokeDasharray="3 3"
          />

          {/* Subtle observation center crosshair */}
          <g transform="translate(290, 260)" stroke="#12A5B8" strokeWidth="0.6" strokeOpacity="0.35">
            <line x1="-12" y1="0" x2="12" y2="0" />
            <line x1="0" y1="-12" x2="0" y2="12" />
            <circle cx="0" cy="0" r="4" fill="none" strokeDasharray="1 1" />
          </g>
        </svg>

        {/* Technical telemetry corner labels */}
        <div className="absolute top-16 left-8 font-mono text-[9px] text-[#8AA3AD]/50 tracking-widest uppercase space-y-1">
          <div>ORBIT / 04 · SUN-SYNC 98.2°</div>
          <div>SWATH / 120 KM · GSD 0.5M</div>
          <div>TRACK / 2391 · SENSOR: OPTICAL</div>
        </div>

        <div className="absolute bottom-16 right-8 font-mono text-[9px] text-[#8AA3AD]/50 tracking-widest uppercase text-right space-y-1">
          <div>LAT / 18.5204° N · LON / 73.8567° E</div>
          <div>ALT / 684.2 KM · WGS 84 (EPSG:4326)</div>
          <div>PASS / 2026.09.09 16:34 UTC</div>
        </div>
      </div>

      {/* ─── PLANE 2: MID DEPTH (Satellite silhouettes & observation beam) ─── */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: "translate(calc(var(--parallax-x, 0px) * 0.7), calc(var(--parallax-y, 0px) * 0.7))" }}
      >
        {/* Subtle realistic satellite silhouette tracking along orbital arc */}
        <div className="absolute top-[18%] left-[24%] opacity-65 animate-[pulse_8s_ease-in-out_infinite]">
          <svg width="44" height="28" viewBox="0 0 60 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Satellite body */}
            <rect x="24" y="13" width="12" height="12" rx="1" fill="#F0F6F8" fillOpacity="0.4" stroke="#12A5B8" strokeWidth="0.8" />
            {/* Left solar panel array */}
            <rect x="2" y="10" width="18" height="18" rx="0.5" fill="#0D171C" stroke="#1C323B" strokeWidth="0.6" />
            <line x1="8" y1="10" x2="8" y2="28" stroke="#12A5B8" strokeWidth="0.4" strokeOpacity="0.5" />
            <line x1="14" y1="10" x2="14" y2="28" stroke="#12A5B8" strokeWidth="0.4" strokeOpacity="0.5" />
            <line x1="20" y1="19" x2="24" y2="19" stroke="#F0F6F8" strokeWidth="0.8" strokeOpacity="0.4" />
            {/* Right solar panel array */}
            <rect x="40" y="10" width="18" height="18" rx="0.5" fill="#0D171C" stroke="#1C323B" strokeWidth="0.6" />
            <line x1="46" y1="10" x2="46" y2="28" stroke="#12A5B8" strokeWidth="0.4" strokeOpacity="0.5" />
            <line x1="52" y1="10" x2="52" y2="28" stroke="#12A5B8" strokeWidth="0.4" strokeOpacity="0.5" />
            <line x1="36" y1="19" x2="40" y2="19" stroke="#F0F6F8" strokeWidth="0.8" strokeOpacity="0.4" />
            {/* Optical sensor lens dish */}
            <circle cx="30" cy="27" r="2.5" fill="#12A5B8" fillOpacity="0.85" />
          </svg>

          {/* Thin subtle observation swath beam to Earth surface */}
          <div
            className="absolute top-[26px] left-[29px] w-[180px] h-[1px] origin-top-left rotate-[52deg] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, rgba(18, 165, 184, 0.45) 0%, rgba(18, 165, 184, 0.1) 60%, transparent 100%)",
            }}
          />
        </div>

        {/* Second faint high-altitude satellite node (far right orbit) */}
        <div className="absolute top-[42%] right-[16%] opacity-40">
          <svg width="32" height="20" viewBox="0 0 60 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="26" y="15" width="8" height="8" rx="0.5" fill="#F0F6F8" fillOpacity="0.3" stroke="#8AA3AD" strokeWidth="0.5" />
            <rect x="8" y="12" width="14" height="14" rx="0.5" fill="#0D171C" stroke="#1C323B" strokeWidth="0.5" />
            <rect x="38" y="12" width="14" height="14" rx="0.5" fill="#0D171C" stroke="#1C323B" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default OrbitalSatelliteWorld;
