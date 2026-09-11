import React from "react";

export function UploadTransitionOverlay({ isTransitioning = false, thumbnailSrc = "" }) {
  if (!isTransitioning) return null;

  return (
    <div className="sq-upload-transition-overlay fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#171821]/70 backdrop-blur-sm transition-opacity duration-500">
      <div className="relative flex items-center justify-center">
        {thumbnailSrc && (
          <div className="w-48 h-48 rounded-xl overflow-hidden shadow-2xl border-2 border-[#D99A2B] animate-pulse">
            <img src={thumbnailSrc} alt="Ingesting..." className="w-full h-full object-cover" />
          </div>
        )}

        <div className="absolute w-72 h-72 rounded-full border border-[#D99A2B] opacity-70 animate-ping" />
        <div className="absolute w-96 h-96 rounded-full border border-[#F0B84B] opacity-40 animate-pulse" />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-[#171821] border border-[#D99A2B] text-xs font-mono text-[#D99A2B] tracking-widest uppercase font-bold shadow-lg">
            ORBITAL INGESTION ACTIVE • CALIBRATING GSD
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadTransitionOverlay;
