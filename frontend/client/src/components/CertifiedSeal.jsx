/**
 * Certified Analysis Seal Component
 * 
 * A non-negotiable signature element that appears with every AI-generated answer.
 * Provides: Reference ID, Model Used, Confidence Score, Sensor/Source, and Traced/Auditable status.
 * 
 * CRITICAL: Do NOT use any official Indian government emblem, seal, or the Ashoka Chakra.
 * The geometric mark is an original abstract design (circle with rotated square/diamond).
 */

export function CertifiedSeal({ 
  referenceId = "SQ-2026-00000", 
  model = "Qwen2-VL",
  confidence = 88,
  sensor = "Sentinel-2 MSI",
  variant = "default" // "default" | "compact" | "inline"
}) {
  if (variant === "inline") {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#1C323B] bg-[#0D171C] rounded shadow-sm">
        <div className="flex items-center justify-center w-5 h-5 relative">
          <div className="absolute w-4 h-4 border border-[#12A5B8] rounded-full" />
          <div className="absolute w-2.5 h-2.5 border border-[#12A5B8] rotate-45" />
        </div>
        <span className="font-mono text-[9px] text-[#12A5B8] uppercase tracking-wider font-semibold">
          {referenceId} · {confidence}%
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-col items-center gap-2 px-4 py-3 border border-[#1C323B] bg-[#0D171C] rounded shadow-sm">
        <div className="flex items-center justify-center w-6 h-6 relative">
          <div className="absolute w-5 h-5 border border-[#12A5B8] rounded-full" />
          <div className="absolute w-3 h-3 border border-[#12A5B8] rotate-45" />
        </div>
        <div className="font-sans text-[9px] font-bold text-[#FFFFFF] uppercase tracking-wide text-center">
          Verified
        </div>
        <div className="w-full h-[1px] bg-[#1C323B]" />
        <div className="font-mono text-[8px] text-[#8AA3AD] text-center leading-snug">
          {referenceId}
        </div>
        <div className="font-mono text-[7px] text-[#12A5B8] font-bold uppercase tracking-widest">
          TRACED
        </div>
      </div>
    );
  }

  // Default full seal
  return (
    <div className="p-4 border border-[#1C323B] bg-[#0D171C] rounded flex flex-col items-center text-center max-w-[200px] shadow-sm">
      {/* Abstract Geometric Mark (NOT official government emblem) */}
      <div className="relative flex items-center justify-center w-8 h-8 mb-2">
        {/* Outer circle */}
        <div className="absolute w-7 h-7 border-2 border-[#12A5B8] rounded-full shadow-[0_0_8px_rgba(18,165,184,0.3)]" />
        {/* Inner rotated square/diamond */}
        <div className="absolute w-[16px] h-[16px] border-2 border-[#12A5B8] rotate-45" />
      </div>

      {/* Title */}
      <div className="font-sans text-xs font-bold text-[#FFFFFF] uppercase tracking-wider mb-2">
        Verified Analysis
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#1C323B] mb-2" />

      {/* Metadata */}
      <div className="font-mono text-[9px] text-[#8AA3AD] space-y-1 text-left w-full">
        <div>REF: <span className="text-[#F0F6F8]">{referenceId}</span></div>
        <div>MODEL: <span className="text-[#F0F6F8]">{model}</span></div>
        <div>CONF: <span className="text-[#12A5B8] font-bold">{confidence}%</span></div>
        <div>SOURCE: <span className="text-[#F0F6F8]">{sensor}</span></div>
      </div>

      {/* Divider */}
      <div className="w-full h-[1px] bg-[#1C323B] my-2" />

      {/* Footer */}
      <div className="font-mono text-[8px] text-[#12A5B8] font-bold uppercase tracking-widest">
        Traced · Auditable
      </div>
    </div>
  );
}
