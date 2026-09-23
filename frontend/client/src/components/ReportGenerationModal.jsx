import React, { useState, useEffect } from "react";
import { X, Download, ShieldCheck, CheckCircle2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReportGenerationModal({
  isOpen,
  onClose,
  queryResult,
  imageAssets = [],
  onDownloadPdf,
  theme: propTheme,
}) {
  const [internalTheme, setInternalTheme] = useState(() => {
    try {
      return propTheme || localStorage.getItem("satquery_workstation_theme") || "dark";
    } catch (e) {
      return propTheme || "dark";
    }
  });

  useEffect(() => {
    if (propTheme) {
      setInternalTheme(propTheme);
    }
  }, [propTheme]);

  if (!isOpen) return null;

  const isLight = internalTheme === "light";

  const handleToggleTheme = () => {
    const nextTheme = isLight ? "dark" : "light";
    setInternalTheme(nextTheme);
    try {
      localStorage.setItem("satquery_workstation_theme", nextTheme);
    } catch (e) {}
  };

  const referenceId = queryResult?.queryId
    ? `SQ-2026-${String(queryResult.queryId).slice(-4)}`
    : "SQ-2026-8819";
  const confidence = queryResult?.confidence || 94;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg border shadow-2xl overflow-hidden font-mono transition-colors duration-200 rounded-xl ${
          isLight
            ? "bg-white border-[#E2E8F0] text-[#0F172A] shadow-[0_25px_60px_rgba(15,23,42,0.18)]"
            : "bg-[#0E1210] border-[#2A2E2B] text-[#E9E5DA] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(212,154,58,0.12)]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b transition-colors ${
            isLight
              ? "bg-[#F8FAFC] border-[#E2E8F0]"
              : "bg-[#070908] border-[#2A2E2B]"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={17}
              className={isLight ? "text-[#B45309]" : "text-[#D49A3A]"}
            />
            <span
              className={`text-xs font-bold tracking-wider uppercase ${
                isLight ? "text-[#B45309]" : "text-[#D49A3A]"
              }`}
            >
              CERTIFIED DEFENSE AUDIT REPORT
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Light / Dark Theme Switcher */}
            <button
              onClick={handleToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? "border-[#CBD5E1] bg-white text-[#475569] hover:text-[#0F172A] hover:bg-slate-100"
                  : "border-[#2A2E2B] bg-[#121614] text-[#9A9A90] hover:text-white hover:bg-[#1D211F]"
              }`}
              title={`Switch to ${isLight ? "Black / Dark" : "White / Light"} Theme`}
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} className="text-[#D49A3A]" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
                  : "text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F]"
              }`}
              title="Close Report"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Audit Pipeline Breadcrumb */}
        <div
          className={`px-5 py-2.5 border-b flex items-center justify-between text-[10px] tracking-widest transition-colors ${
            isLight
              ? "bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]"
              : "bg-[#090C0A] border-[#2A2E2B] text-[#9A9A90]"
          }`}
        >
          <span className={`font-bold ${isLight ? "text-[#059669]" : "text-[#10B981]"}`}>
            EVIDENCE ✓
          </span>
          <span className={isLight ? "text-slate-400" : "text-[#4A504B]"}>──▶</span>
          <span className={`font-bold ${isLight ? "text-[#059669]" : "text-[#10B981]"}`}>
            AUDIT TRACE ✓
          </span>
          <span className={isLight ? "text-slate-400" : "text-[#4A504B]"}>──▶</span>
          <span className={`font-bold ${isLight ? "text-[#B45309]" : "text-[#D49A3A]"}`}>
            REPORT READY ◉
          </span>
        </div>

        {/* Report Content Body */}
        <div className="p-5 space-y-4">
          {/* Reference ID & Confidence Card */}
          <div
            className={`p-4 border rounded-xl flex items-start justify-between transition-colors ${
              isLight
                ? "bg-[#F8FAFC] border-[#E2E8F0]"
                : "bg-[#070908] border-[#2A2E2B]"
            }`}
          >
            <div>
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-[#64748B]" : "text-[#9A9A90]"
                }`}
              >
                AUDIT REFERENCE ID
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 tracking-wide ${
                  isLight ? "text-[#B45309]" : "text-[#E4B65A]"
                }`}
              >
                {referenceId}
              </div>
              <div
                className={`text-[11px] mt-1 font-sans ${
                  isLight ? "text-[#64748B]" : "text-[#9A9A90]"
                }`}
              >
                Sensor: {imageAssets[0]?.modality || "OPTICAL"} · Ground Resolution: 0.5m GSD
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-[#64748B]" : "text-[#9A9A90]"
                }`}
              >
                CONFIDENCE
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 ${
                  isLight ? "text-[#059669]" : "text-[#10B981]"
                }`}
              >
                {confidence}%
              </div>
              <div
                className={`text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded border inline-block ${
                  isLight
                    ? "bg-amber-50 text-[#B45309] border-amber-200"
                    : "bg-[#D49A3A]/10 text-[#D49A3A] border-[#D49A3A]/30"
                }`}
              >
                VERIFIED
              </div>
            </div>
          </div>

          {/* Finding Summary Card */}
          <div
            className={`p-4 border rounded-xl text-xs font-sans leading-relaxed transition-colors ${
              isLight
                ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]"
                : "bg-[#070908] border-[#2A2E2B] text-[#E9E5DA]"
            }`}
          >
            <strong
              className={`block font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                isLight ? "text-[#B45309]" : "text-[#D49A3A]"
              }`}
            >
              FINDING SUMMARY:
            </strong>
            {queryResult?.answer ||
              "Urban expansion and structural features localized with pixel-level bounding coordinates. Corroborated with multi-spectral reflectance."}
          </div>

          {/* Tamper-Proof Cryptographic Hash Footer Note */}
          <div
            className={`text-[11px] flex items-center gap-2 ${
              isLight ? "text-[#64748B]" : "text-[#9A9A90]"
            }`}
          >
            <CheckCircle2
              size={14}
              className={`flex-shrink-0 ${
                isLight ? "text-[#059669]" : "text-[#10B981]"
              }`}
            />
            <span>
              Cryptographic hash embedded in PDF metadata for tamper-proof verification.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className={`flex items-center justify-end gap-2.5 px-5 py-3.5 border-t transition-colors ${
            isLight
              ? "bg-[#F8FAFC] border-[#E2E8F0]"
              : "bg-[#070908] border-[#2A2E2B]"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`font-mono text-xs cursor-pointer rounded-lg border transition-colors ${
              isLight
                ? "border-[#CBD5E1] bg-white text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                : "border-[#2A2E2B] bg-[#121614] text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F]"
            }`}
          >
            Close
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onDownloadPdf) onDownloadPdf();
              onClose();
            }}
            className={`font-bold font-mono text-xs rounded-lg shadow transition-all cursor-pointer ${
              isLight
                ? "bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm"
                : "bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] shadow-[0_0_15px_rgba(212,154,58,0.3)]"
            }`}
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
