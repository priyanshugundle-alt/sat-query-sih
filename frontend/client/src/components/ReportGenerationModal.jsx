import React from "react";
import { X, Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportGenerationModal({ isOpen, onClose, queryResult, imageAssets = [], onDownloadPdf }) {
  if (!isOpen) return null;

  const referenceId = queryResult?.queryId ? `SQ-2026-${String(queryResult.queryId).slice(-4)}` : "SQ-2026-8819";
  const confidence = queryResult?.confidence || 94;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0D171C] border border-[#1C323B] shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden font-mono text-[#F0F6F8]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1C323B] bg-[#080E11]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#12A5B8]" />
            <span className="text-xs font-bold tracking-wider uppercase text-[#12A5B8]">
              CERTIFIED DEFENSE AUDIT REPORT
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#132127]">
            <X size={16} />
          </button>
        </div>

        {/* Audit Pipeline Breadcrumb */}
        <div className="px-5 py-2.5 bg-[#080E11] border-b border-[#1C323B] flex items-center justify-between text-[10px] tracking-widest text-[#8AA3AD]">
          <span className="text-[#12A5B8] font-bold">EVIDENCE ✓</span>
          <span>──▶</span>
          <span className="text-[#12A5B8] font-bold">AUDIT TRACE ✓</span>
          <span>──▶</span>
          <span className="text-[#FFFFFF] bg-[#0B4F58]/40 border border-[#12A5B8]/40 px-1.5 py-0.5 font-bold">REPORT READY ◉</span>
        </div>

        {/* Report Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-[#080E11] border border-[#1C323B] flex items-start justify-between">
            <div>
              <div className="text-[9px] uppercase text-[#8AA3AD] font-bold">AUDIT REFERENCE ID</div>
              <div className="text-base font-bold text-[#FFFFFF] mt-0.5">{referenceId}</div>
              <div className="text-[11px] text-[#8AA3AD] mt-1 font-sans">
                Sensor: {imageAssets[0]?.modality || "OPTICAL"} · Ground Resolution: 0.5m GSD
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase text-[#8AA3AD] font-bold">CONFIDENCE</div>
              <div className="text-base font-bold text-[#12A5B8] mt-0.5">{confidence}%</div>
              <div className="text-[9px] text-[#12A5B8] font-bold uppercase mt-0.5">VERIFIED</div>
            </div>
          </div>

          <div className="p-3 bg-[#080E11] border border-[#1C323B] text-xs font-sans text-[#F0F6F8] leading-relaxed">
            <strong className="text-[#FFFFFF] block font-mono text-[10px] mb-1">FINDING SUMMARY:</strong>
            {queryResult?.answer || "Urban expansion and structural features localized with pixel-level bounding coordinates. Corroborated with multi-spectral reflectance."}
          </div>

          <div className="text-[10px] text-[#8AA3AD] flex items-center gap-2">
            <CheckCircle2 size={13} className="text-[#12A5B8]" />
            <span>Cryptographic hash embedded in PDF metadata for tamper-proof verification.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#1C323B] bg-[#080E11]">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#8AA3AD] hover:text-[#FFFFFF] font-mono text-xs">
            Close
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              if (onDownloadPdf) onDownloadPdf();
              onClose();
            }}
            className="bg-[#0E7C8A] hover:bg-[#12A5B8] text-[#FFFFFF] font-bold font-mono text-xs rounded-none shadow-[0_0_12px_rgba(18,165,184,0.3)] transition-all"
          >
            <Download size={13} className="mr-1.5" />
            Download PDF Report
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReportGenerationModal;
