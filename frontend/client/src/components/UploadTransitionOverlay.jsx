import React from "react";

export function UploadTransitionOverlay({ isTransitioning = false, thumbnailSrc = "" }) {
  if (!isTransitioning) return null;

  return (
    <div className="sq-upload-transition-overlay fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#040708]/80 backdrop-blur-sm transition-opacity duration-500">
      <div className="relative flex items-center justify-center">
        {thumbnailSrc && (
          <div className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-[#12A5B8] animate-pulse">
            <img src={thumbnailSrc} alt="Ingesting..." className="w-full h-full object-cover" />
          </div>
        )}

        <div className="absolute w-72 h-72 rounded-full border border-[#12A5B8] opacity-70 animate-ping" />
        <div className="absolute w-96 h-96 rounded-full border border-[#22D3EE] opacity-40 animate-pulse" />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-[#0D171C] border border-[#12A5B8] text-xs font-mono text-[#12A5B8] tracking-widest uppercase font-bold shadow-[0_0_15px_rgba(18,165,184,0.4)]">
            ORBITAL INGESTION ACTIVE • CALIBRATING GSD
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadTransitionOverlay;
