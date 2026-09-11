import React from "react";

export function SatellitePassTracker({ satelliteName = "SENTINEL-2 MSI", orbitStatus = "ACTIVE" }) {
  return (
    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#171821] border border-[#292B32] text-xs font-mono">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold tracking-widest text-[#687078] uppercase">
          SATELLITE PASS
        </span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[#3A3D47]">───</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D99A2B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D99A2B]"></span>
          </span>
          <span className="text-[#3A3D47]">─────</span>
        </div>
      </div>
      
      <div className="flex flex-col border-l border-[#292B32] pl-3">
        <span className="text-[10px] font-bold text-[#F5F6F3] tracking-wide">
          {satelliteName}
        </span>
        <span className="text-[9px] text-[#D99A2B] font-semibold tracking-wider">
          ORBIT {orbitStatus}
        </span>
      </div>
    </div>
  );
}

export default SatellitePassTracker;
