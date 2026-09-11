import React from "react";
import { Check, Loader2 } from "lucide-react";

export function AnalysisTraceStepper({ currentStep = 5, isAnalyzing = false }) {
  const steps = [
    { id: 1, label: "IMAGE INGEST", detail: "GeoTIFF bands & dimensions validated" },
    { id: 2, label: "INTENT CLASSIFIED", detail: "Query mapped to spatial task" },
    { id: 3, label: "TASK ROUTED", detail: "Specialist VLM adapter selected" },
    { id: 4, label: "VISION MODEL", detail: "Native patch reasoning & grounding" },
    { id: 5, label: "EVIDENCE GENERATED", detail: "Audited finding & confidence bound" },
  ];

  return (
    <div className="w-full py-3 px-4 bg-background border border-card rounded-xl font-mono">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold tracking-widest text-[#D99A2B] uppercase">
          EXECUTION TRACE • AUDIT LOG
        </span>
        <span className="text-[10px] text-[#687078]">
          DEFENSE-GRADE DETERMINISTIC PIPELINE
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
        {steps.map((step, idx) => {
          const isDone = idx + 1 < currentStep || (idx + 1 === currentStep && !isAnalyzing);
          const isActive = idx + 1 === currentStep && isAnalyzing;

          return (
            <div 
              key={step.id} 
              className={`p-2.5 rounded-lg border transition-all ${
                isDone 
                  ? "bg-[#292B32]/40 border-[#607C57]/50 text-[#F5F6F3]" 
                  : isActive
                  ? "bg-[#D99A2B]/10 border-[#D99A2B] text-[#D99A2B] shadow-[0_0_12px_rgba(217,154,43,0.2)]"
                  : "bg-[#171821]/60 border-[#292B32] text-[#687078]"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold opacity-75">0{step.id}</span>
                {isDone && <Check size={12} className="text-[#607C57]" />}
                {isActive && <Loader2 size={12} className="animate-spin text-[#D99A2B]" />}
              </div>
              <div className="text-[11px] font-bold tracking-wide truncate">
                {step.label}
              </div>
              <div className="text-[9px] opacity-70 truncate mt-0.5 font-sans">
                {step.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalysisTraceStepper;
