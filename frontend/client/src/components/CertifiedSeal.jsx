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
      <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#3a3a3e] bg-[#1a1a1c] rounded">
        <div className="flex items-center justify-center w-5 h-5 relative">
          <div className="absolute w-4 h-4 border border-[#e8a33d] rounded-full" />
          <div className="absolute w-2.5 h-2.5 border border-[#e8a33d] rotate-45" />
        </div>
        <span className="font-mono text-[9px] text-[#e8a33d] uppercase tracking-wider">
          {referenceId} · {confidence}%
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="inline-flex flex-col items-center gap-2 px-4 py-3 border border-[#3a3a3e] bg-[#1a1a1c]">
        <div className="flex items-center justify-center w-6 h-6 relative">
          <div className="absolute w-5 h-5 border border-[#e8a33d] rounded-full" />
          <div className="absolute w-3 h-3 border border-[#e8a33d] rotate-45" />
        </div>
        <div className="font-serif text-[9px] font-semibold text-[#f2ece2] uppercase tracking-wide text-center">
          Verified
        </div>
        <div className="w-full h-[1px] bg-[#3a3a3e]" />
        <div className="font-mono text-[8px] text-[#8a7f6d] text-center leading-snug">
          {referenceId}
        </div>
        <div className="font-mono text-[7px] text-[#e8a33d] uppercase tracking-widest">
          TRACED
        </div>
      </div>
    );
  }

  // Default full seal
  return (
    <div className="certified-seal">
      {/* Abstract Geometric Mark (NOT official government emblem) */}
      <div className="certified-seal-mark">
        {/* Outer circle */}
        <div className="absolute w-6 h-6 border-2 border-[#e8a33d] rounded-full" />
        {/* Inner rotated square/diamond */}
        <div className="absolute w-[14px] h-[14px] border-2 border-[#e8a33d] rotate-45" />
      </div>

      {/* Title */}
      <div className="certified-seal-title">
        Verified Analysis
      </div>

      {/* Divider */}
      <div className="certified-seal-divider" />

      {/* Metadata */}
      <div className="certified-seal-meta">
        <div className="mb-1">REF: {referenceId}</div>
        <div className="mb-1">MODEL: {model}</div>
        <div className="mb-1">CONF: {confidence}%</div>
        <div>SOURCE: {sensor}</div>
      </div>

      {/* Divider */}
      <div className="certified-seal-divider" />

      {/* Footer */}
      <div className="certified-seal-footer">
        Traced · Auditable
      </div>
    </div>
  );
}
