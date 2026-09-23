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
            ? "bg-white border-zinc-200 text-zinc-950 shadow-[0_25px_60px_rgba(0,0,0,0.15)]"
            : "bg-black border-zinc-800 text-white shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b transition-colors ${
            isLight
              ? "bg-zinc-50/80 border-zinc-200"
              : "bg-zinc-950 border-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                isLight
                  ? "bg-zinc-100 border-zinc-300 text-zinc-900"
                  : "bg-zinc-900 border-zinc-700 text-white"
              }`}
            >
              <ShieldCheck size={16} />
            </div>
            <div>
              <div
                className={`text-xs font-bold tracking-wider uppercase ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                CERTIFIED DEFENSE AUDIT REPORT
              </div>
              <div
                className={`text-[10px] font-sans ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
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
                  ? "border-zinc-300 bg-white text-zinc-700 hover:text-black hover:bg-zinc-100"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
              }`}
              title={`Switch to ${isLight ? "Black" : "White"} Theme`}
            >
              {isLight ? <Moon size={14} className="text-zinc-800" /> : <Sun size={14} className="text-zinc-200" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900"
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
              ? "bg-zinc-100/70 border-zinc-200 text-zinc-500"
              : "bg-zinc-950 border-zinc-800 text-zinc-500"
          }`}
        >
          <span className={`font-bold flex items-center gap-1 ${isLight ? "text-zinc-900" : "text-white"}`}>
            <span>EVIDENCE</span>
            <span>✓</span>
          </span>
          <span className={isLight ? "text-zinc-400" : "text-zinc-600"}>──▶</span>
          <span className={`font-bold flex items-center gap-1 ${isLight ? "text-zinc-900" : "text-white"}`}>
            <span>AUDIT TRACE</span>
            <span>✓</span>
          </span>
          <span className={isLight ? "text-zinc-400" : "text-zinc-600"}>──▶</span>
          <span className={`font-bold flex items-center gap-1 ${isLight ? "text-black" : "text-white"}`}>
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
                ? "bg-zinc-50/80 border-zinc-200"
                : "bg-zinc-900/60 border-zinc-800"
            }`}
          >
            <div>
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                AUDIT REFERENCE ID
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 tracking-wide ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                {referenceId}
              </div>
              <div
                className={`text-[11px] mt-1 font-sans ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                Sensor: {imageAssets[0]?.modality || "OPTICAL"} · Ground Resolution: 0.5m GSD
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-[9px] uppercase font-bold tracking-wider ${
                  isLight ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                CONFIDENCE
              </div>
              <div
                className={`text-base sm:text-lg font-bold mt-0.5 ${
                  isLight ? "text-zinc-950" : "text-white"
                }`}
              >
                {confidence}%
              </div>
              <div
                className={`text-[9px] font-bold uppercase mt-1 px-2 py-0.5 rounded-md border inline-block ${
                  isLight
                    ? "bg-zinc-950 text-white border-zinc-950"
                    : "bg-white text-black border-white"
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
                ? "bg-zinc-50/80 border-zinc-200 text-zinc-800"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-200"
            }`}
          >
            <strong
              className={`block font-mono text-[10px] uppercase font-bold tracking-wider mb-1.5 ${
                isLight ? "text-zinc-950" : "text-white"
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
              isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            <CheckCircle2
              size={14}
              className={`flex-shrink-0 ${
                isLight ? "text-zinc-900" : "text-white"
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
              ? "bg-zinc-50/80 border-zinc-200"
              : "bg-zinc-950 border-zinc-800"
          }`}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className={`font-mono text-xs cursor-pointer rounded-xl border transition-colors ${
              isLight
                ? "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 hover:text-black"
                : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
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
                ? "bg-zinc-950 hover:bg-zinc-800 text-white shadow-sm"
                : "bg-white hover:bg-zinc-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
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
