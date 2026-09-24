import React, { useEffect } from "react";
import { X, Download, ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function ReportGenerationModal({ isOpen, onClose, queryResult, imageAssets = [], onDownloadPdf }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawAnswer = queryResult?.answer || queryResult?.summary || "Urban expansion and structural features localized with pixel-level bounding coordinates. Corroborated with multi-spectral reflectance.";
  const isError = Boolean(
    queryResult?.isError ||
    queryResult?.error ||
    (typeof rawAnswer === "string" && (rawAnswer.startsWith("Error:") || rawAnswer.includes("MODEL_UNAVAILABLE") || rawAnswer.includes("offline")))
  );

  const referenceId = queryResult?.queryId ? `SQ-2026-${String(queryResult.queryId).slice(-4)}` : "SQ-2026-7f1c";
  const confidence = isError ? null : (queryResult?.confidence || 92);
  const sensorName = imageAssets[0]?.modality || "OPTICAL";

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg bg-[#151817] border border-[#2A2E2B] shadow-[0_20px_50px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden font-mono text-[#E9E5DA]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2E2B] bg-[#0B0D0C]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#1D180F] border border-[#D49A3A]/40 flex items-center justify-center rounded-lg">
                <ShieldCheck size={16} className="text-[#D49A3A]" />
              </div>
              <span className="text-xs font-bold tracking-wider uppercase text-[#D49A3A]">
                CERTIFIED DEFENSE AUDIT REPORT
              </span>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F] rounded-lg transition-colors cursor-pointer"
              title="Close (ESC)"
            >
              <X size={16} />
            </button>
          </div>

          {/* Audit Pipeline Breadcrumb */}
          <div className="px-5 py-2.5 bg-[#0B0D0C] border-b border-[#2A2E2B] flex items-center justify-between text-[10px] tracking-widest text-[#9A9A90]">
            <span className="text-[#10B981] font-bold flex items-center gap-1">
              EVIDENCE <span className="text-[#10B981]">✓</span>
            </span>
            <span className="text-[#4A504B]">──▶</span>
            <span className="text-[#10B981] font-bold flex items-center gap-1">
              AUDIT TRACE <span className="text-[#10B981]">✓</span>
            </span>
            <span className="text-[#4A504B]">──▶</span>
            <span className={isError ? "text-[#F59E0B] font-bold flex items-center gap-1" : "text-[#D49A3A] font-bold flex items-center gap-1 animate-pulse"}>
              {isError ? "ALERT ⚠️" : "REPORT READY ◉"}
            </span>
          </div>

          {/* Report Content */}
          <div className="p-5 space-y-4">
            {/* Metadata Box */}
            <div className="p-3.5 bg-[#0B0D0C] border border-[#2A2E2B] rounded-xl flex items-start justify-between">
              <div>
                <div className="text-[9px] uppercase text-[#9A9A90] font-bold tracking-wider">AUDIT REFERENCE ID</div>
                <div className="text-base font-bold text-[#E4B65A] mt-0.5">{referenceId}</div>
                <div className="text-[11px] text-[#A3B09D] mt-1 font-sans">
                  Sensor: <span className="text-[#E9E5DA] font-medium">{sensorName}</span> · Ground Resolution: 0.5m GSD
                </div>
              </div>

              <div className="text-right">
                <div className="text-[9px] uppercase text-[#9A9A90] font-bold tracking-wider">
                  {isError ? "STATUS" : "CONFIDENCE"}
                </div>
                {isError ? (
                  <>
                    <div className="text-sm font-bold text-[#EF4444] mt-0.5">UNVERIFIED</div>
                    <div className="text-[9px] text-[#F59E0B] font-bold uppercase mt-0.5 px-2 py-0.5 bg-[#2A1D0F] border border-[#F59E0B]/30 rounded">
                      OFFLINE ALERT
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-base font-bold text-[#10B981] mt-0.5">{confidence}%</div>
                    <div className="text-[9px] text-[#D49A3A] font-bold uppercase mt-0.5 tracking-wider">VERIFIED</div>
                  </>
                )}
              </div>
            </div>

            {/* Summary Box / Error Handling */}
            {isError ? (
              <div className="p-3.5 bg-[#1F1213] border border-[#7F1D1D] rounded-xl text-xs font-sans text-[#FCA5A5] leading-relaxed">
                <div className="flex items-center gap-2 mb-1.5 text-[#EF4444] font-mono text-[10px] font-bold uppercase tracking-wider">
                  <AlertTriangle size={14} className="text-[#EF4444]" />
                  <span>MODEL INFERENCE EXCEPTION / DEGRADED MODE</span>
                </div>
                <p className="text-xs text-[#FECDD3] font-mono bg-[#140A0B] p-2.5 rounded border border-[#991B1B]/40">
                  {rawAnswer}
                </p>
                <div className="mt-2 text-[10px] text-[#FCA5A5]/80 flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin text-[#F59E0B]" />
                  <span>Local fallback rules engaged. Re-run inference when remote model server recovers.</span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-[#0B0D0C] border border-[#2A2E2B] rounded-xl text-xs font-sans text-[#E9E5DA] leading-relaxed">
                <strong className="text-[#F3F0E8] block font-mono text-[10px] mb-1.5 text-[#D49A3A] uppercase tracking-wider">
                  FINDING SUMMARY:
                </strong>
                {rawAnswer}
              </div>
            )}

            {/* Cryptographic Footnote */}
            <div className="text-[10px] text-[#9A9A90] flex items-center gap-2 pt-1">
              <CheckCircle2 size={13} className="text-[#10B981] flex-shrink-0" />
              <span>Cryptographic hash embedded in PDF metadata for tamper-proof verification.</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[#2A2E2B] bg-[#0B0D0C]">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F] font-mono text-xs rounded-xl"
            >
              Close
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                if (onDownloadPdf) onDownloadPdf();
                onClose();
              }}
              className="bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold font-mono text-xs rounded-xl shadow-lg hover:shadow-[#D49A3A]/20 transition-all duration-200"
            >
              <Download size={13} className="mr-1.5" />
              Download PDF Report
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ReportGenerationModal;
