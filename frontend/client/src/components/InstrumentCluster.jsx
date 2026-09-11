/**
 * Live Instrument Cluster Component
 * 
 * A functioning instrument panel showing:
 * - Real, ticking UTC clock (updates every second)
 * - "Analyses sealed" counter (increments from DB or simulated)
 * - "SYSTEM LIVE" indicator with pulsing amber dot
 * - Oversized low-opacity reference ID as background graphic
 * 
 * This is NOT a static hero image — it's a live, functioning dashboard element.
 */

import { useState, useEffect } from "react";

export function InstrumentCluster({ 
  analysisCount = 0, 
  isSystemLive = true,
  variant = "hero" // "hero" | "header"
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [displayCount, setDisplayCount] = useState(analysisCount);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setDisplayCount(analysisCount);
  }, [analysisCount]);

  const formatUTC = (date) => {
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (variant === "header") {
    return (
      <div className="flex items-center gap-6">
        {/* System Live Indicator */}
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isSystemLive ? 'bg-[#ffb84d] live-pulse' : 'bg-[#5c5138]'}`} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#8a7f6d]">
            {isSystemLive ? 'System Live' : 'Offline'}
          </span>
        </div>

        {/* UTC Clock */}
        <div className="instrument-item">
          <div className="instrument-label">UTC</div>
          <div className="font-mono text-sm font-bold text-[#ffb84d]">
            {formatUTC(currentTime)}
          </div>
        </div>

        {/* Analysis Count */}
        <div className="instrument-item">
          <div className="instrument-label">Sealed</div>
          <div className="font-mono text-sm font-bold text-[#c4baa8]">
            {displayCount.toString().padStart(3, '0')}
          </div>
        </div>
      </div>
    );
  }

  // Hero variant - full instrument cluster
  return (
    <div className="relative">
      {/* Background Reference ID (oversized, very low opacity) */}
      <div 
        className="background-ref-id"
        style={{
          top: '-40px',
          right: '-20px',
          fontSize: '120px',
          lineHeight: '1',
        }}
        aria-hidden="true"
      >
        SQ-412
      </div>

      <div className="instrument-cluster relative z-10">
        {/* System Status */}
        <div className="instrument-item">
          <div className="instrument-label">System Status</div>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${isSystemLive ? 'bg-[#ffb84d] live-pulse' : 'bg-[#5c5138]'}`} />
            <span className="font-mono text-base font-bold text-[#ffb84d]">
              {isSystemLive ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* UTC Clock */}
        <div className="instrument-item">
          <div className="instrument-label">UTC Time</div>
          <div className="instrument-value">
            {formatUTC(currentTime)}
          </div>
          <div className="font-mono text-[10px] text-[#8a7f6d]">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Analyses Sealed Counter */}
        <div className="instrument-item">
          <div className="instrument-label">Analyses Sealed</div>
          <div className="instrument-value instrument-value-muted">
            {displayCount.toString().padStart(4, '0')}
          </div>
        </div>

        {/* Mode Indicator */}
        <div className="instrument-item">
          <div className="instrument-label">Mode</div>
          <div className="font-mono text-sm font-bold text-[#ffb84d]">
            LIVE BACKEND
          </div>
        </div>
      </div>
    </div>
  );
}
