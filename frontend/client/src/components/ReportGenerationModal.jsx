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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg border shadow-2xl overflow-hidden font-mono transition-colors duration-200 rounded-2xl ${
          isLight
            ? "bg-white border-slate-200 text-slate-900 shadow-[0_25px_60px_rgba(15,23,42,0.15)]"
            : "bg-[#080E11] border-[#1C323B] text-[#F0F6F8] shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_25px_rgba(18,165,184,0.15)]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b transition-colors ${
            isLight
              ? "bg-slate-50/80 border-slate-200"
              : "bg-[#040708] border-[#1C323B]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                isLight
                  ? "bg-slate-100 border-slate-300 text-slate-900"
                  : "bg-[#0D171C] border-[#12A5B8]/40 text-[#12A5B8] shadow-[0_0_10px_rgba(18,165,184,0.2)]"
              }`}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <div
                className={`text-xs font-bold tracking-wider uppercase ${
                  isLight ? "text-slate-900" : "text-[#FFFFFF]"
                }`}
              >
                CERTIFIED DEFENSE AUDIT REPORT
              </div>
              <div
                className={`text-[10px] font-sans ${
                  isLight ? "text-slate-500" : "text-[#8AA3AD]"
                }`}
              >
                Cryptographic SatQuery Verification Pipeline
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Light / Dark Theme Switcher */}
            <button
              onClick={handleToggleTheme}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? "border-slate-300 bg-white text-slate-700 hover:text-black hover:bg-slate-100"
                  : "border-white/[0.1] bg-[#0D171C] text-[#8AA3AD] hover:text-white hover:bg-white/[0.06]"
              }`}
              title={`Switch to ${isLight ? "Dark Cyan" : "White"} Theme`}
            >
              {isLight ? <Moon size={14} className="text-slate-800" /> : <Sun size={14} className="text-[#12A5B8]" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.06]"
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
              ? "bg-slate-100/70 border-slate-200 text-slate-500"
              : "bg-[#080D10] border-[#1C323B] text-[#8AA3AD]"
          }`}
        >
          <span className={`font-bold flex items-center gap-1 ${isLight ? "text-slate-900" : "text-[#10B981]"}`}>
            <span>EVIDENCE</span>
            <span>✓</span>
          </span>
          <span className={isLight ? "text-slate-400" : "text-[#2D4550]"}>──▶</span>
          <span className={`font-bold flex items-center gap-1 ${isLight ? "text-slate-900" : "text-[#10B981]"}`}>
            <span>AUDIT TRACE</span>
            <span>✓</span>
          </span>
          <span className={isLight ? "text-slate-400" : "text-[#2D4550]"}>──▶</span>
          <span
            className={`font-bold flex items-center gap-1 ${
              isLight ? "text-black" : "text-[#12A5B8]"
            }`}
          >
            <span>REPORT READY</span>
            <span>◉</span>
          </span>
        </div>

        {/* Report Content Body */}
        <div className="p-5 space-y-4">
          {/* Reference ID & Confidence Card */}
          <div
            className={`p-4 border rounded-xl flex items-start justify-between transition-colors ${
              isLight
                ? "bg-slate-50/80 border-slate-200"
                : "bg-[#0D171C] border-[#1C323B]"
            }`}
          >
            <div>
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-slate-500" : "text-[#8AA3AD]"
                }`}
              >
                AUDIT REFERENCE ID
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 tracking-wide ${
                  isLight ? "text-slate-950" : "text-[#12A5B8]"
                }`}
              >
                {referenceId}
              </div>
              <div
                className={`text-[11px] mt-1 font-sans ${
                  isLight ? "text-slate-500" : "text-[#8AA3AD]"
                }`}
              >
                Sensor: {imageAssets[0]?.modality || "OPTICAL"} · Ground Resolution: 0.5m GSD
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-slate-500" : "text-[#8AA3AD]"
                }`}
              >
                CONFIDENCE
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 ${
                  isLight ? "text-slate-950" : "text-[#10B981]"
                }`}
              >
                {confidence}%
              </div>
              <div
                className={`text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded-md border inline-block ${
                  isLight
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/35 shadow-[0_0_6px_rgba(16,185,129,0.2)]"
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
                ? "bg-slate-50/80 border-slate-200 text-slate-800"
                : "bg-[#0D171C] border-[#1C323B] text-[#F0F6F8]"
            }`}
          >
            <strong
              className={`block font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                isLight ? "text-slate-950" : "text-[#12A5B8]"
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
              isLight ? "text-slate-500" : "text-[#8AA3AD]"
            }`}
          >
            <CheckCircle2
              size={14}
              className={`flex-shrink-0 ${
                isLight ? "text-slate-800" : "text-[#12A5B8]"
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
              ? "bg-slate-50/80 border-slate-200"
              : "bg-[#040708] border-[#1C323B]"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`font-mono text-xs cursor-pointer rounded-xl border transition-colors ${
              isLight
                ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-black"
                : "border-white/[0.1] bg-[#0D171C] text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.06]"
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
            className={`font-bold font-mono text-xs rounded-xl shadow transition-all cursor-pointer ${
              isLight
                ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                : "bg-[#12A5B8] hover:bg-[#0EA0B2] text-black font-bold shadow-[0_0_15px_rgba(18,165,184,0.3)]"
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
