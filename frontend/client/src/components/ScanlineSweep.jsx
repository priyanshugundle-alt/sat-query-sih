import React from "react";

export function ScanlineSweep({ active = true, duration = "2.2s", className = "" }) {
  if (!active) return null;

  return (
    <div className={`sq-scanline-container absolute inset-0 pointer-events-none overflow-hidden z-20 ${className}`}>
      <div 
        className="sq-scanline-beam absolute left-0 right-0"
        style={{
          animationDuration: duration,
        }}
      >
        <div className="h-10 w-full bg-gradient-to-b from-transparent to-[#D99A2B]/15" />
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#F0B84B] to-transparent shadow-[0_0_12px_rgba(217,154,43,0.8)]" />
        <div className="h-4 w-full bg-gradient-to-b from-[#D99A2B]/10 to-transparent" />
      </div>
    </div>
  );
}

export default ScanlineSweep;
