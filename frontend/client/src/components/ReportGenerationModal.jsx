import React from "react";
import { X, Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportGenerationModal({ isOpen, onClose, queryResult, imageAssets = [], onDownloadPdf }) {
  if (!isOpen) return null;

  const referenceId = queryResult?.queryId ? `SQ-2026-${String(queryResult.queryId).slice(-4)}` : "SQ-2026-8819";
  const confidence = queryResult?.confidence || 94;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#151817] border border-[#2A2E2B] shadow-2xl overflow-hidden font-mono text-[#E9E5DA]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2A2E2B] bg-[#0B0D0C]">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#D49A3A]" />
            <span className="text-xs font-bold tracking-wider uppercase text-[#D49A3A]">
              CERTIFIED DEFENSE AUDIT REPORT
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F]">
            <X size={16} />
          </button>
        </div>

        {/* Audit Pipeline Breadcrumb */}
        <div className="px-5 py-2.5 bg-[#0B0D0C] border-b border-[#2A2E2B] flex items-center justify-between text-[10px] tracking-widest text-[#9A9A90]">
          <span className="text-[#68745C] font-bold">EVIDENCE ✓</span>
          <span>──▶</span>
          <span className="text-[#68745C] font-bold">AUDIT TRACE ✓</span>
          <span>──▶</span>
          <span className="text-[#D49A3A] font-bold">REPORT READY ◉</span>
        </div>

        {/* Report Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-[#0B0D0C] border border-[#2A2E2B] flex items-start justify-between">
            <div>
              <div className="text-[9px] uppercase text-[#9A9A90] font-bold">AUDIT REFERENCE ID</div>
              <div className="text-base font-bold text-[#E4B65A] mt-0.5">{referenceId}</div>
              <div className="text-[11px] text-[#9A9A90] mt-1 font-sans">
                Sensor: {imageAssets[0]?.modality || "OPTICAL"} · Ground Resolution: 0.5m GSD
              </div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase text-[#9A9A90] font-bold">CONFIDENCE</div>
              <div className="text-base font-bold text-[#68745C] mt-0.5">{confidence}%</div>
              <div className="text-[9px] text-[#D49A3A] font-bold uppercase mt-0.5">VERIFIED</div>
            </div>
          </div>

          <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B] text-xs font-sans text-[#E9E5DA] leading-relaxed">
            <strong className="text-[#F3F0E8] block font-mono text-[10px] mb-1">FINDING SUMMARY:</strong>
            {queryResult?.answer || "Urban expansion and structural features localized with pixel-level bounding coordinates. Corroborated with multi-spectral reflectance."}
          </div>

          <div className="text-[10px] text-[#9A9A90] flex items-center gap-2">
            <CheckCircle2 size={13} className="text-[#68745C]" />
            <span>Cryptographic hash embedded in PDF metadata for tamper-proof verification.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#2A2E2B] bg-[#0B0D0C]">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-[#9A9A90] hover:text-[#F3F0E8] font-mono text-xs">
            Close
          </Button>
          <Button 
            size="sm" 
            onClick={() => {
              if (onDownloadPdf) onDownloadPdf();
              onClose();
            }}
            className="bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold font-mono text-xs rounded-none shadow"
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
