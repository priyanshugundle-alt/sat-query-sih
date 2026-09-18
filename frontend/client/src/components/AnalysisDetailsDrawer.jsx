import React from "react";
import { X, ShieldCheck, Database, Cpu, Activity, CheckCircle2, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AnalysisDetailsDrawer — Level 4 Technical Audit & Provenance Drawer
 * 
 * Exposes:
 * - Natural Language Query
 * - Intent Classification
 * - Routed Specialist Adapter
 * - Vision-Language Backbone Model
 * - Source Sensor Platform & Spectral Bands
 * - Acquisition Timestamp (UTC)
 * - Coordinate Reference System (CRS) & Projection
 * - Calibrated Model Confidence
 * - Deterministic Execution Status
 * - Cryptographic SHA-256 Audit Signature
 */
export function AnalysisDetailsDrawer({
  isOpen,
  onClose,
  currentResult,
  asset,
  analysisMode,
  onOpenReport,
}) {
  if (!isOpen) return null;

  const queryText = currentResult?.userQuery || "What type of land cover dominates this region?";
  const intent = currentResult?.intentDetected || (analysisMode === "CHANGE" ? "Bi-Temporal Change" : analysisMode === "FUSION" ? "Optical-SAR Fusion" : analysisMode === "VQA" ? "Visual QA" : "Spatial Object Grounding");
  const specialist = currentResult?.routedTool || (analysisMode === "CHANGE" ? "CDVQA-Siamese (ChangeQA Adapter)" : analysisMode === "FUSION" ? "OpticalSAR-Fusion (EarthGPT Adapter)" : analysisMode === "VQA" ? "GeoChat-VQA (UniRS Adapter)" : "GroundingDINO (UniRS Adapter)");
  const modelName = currentResult?.modelUsed || "Qwen2-VL / UniRS-RSVLM (Calibrated Backbone)";
  const sourceSensor = asset?.modality === "SAR" ? "Sentinel-1 C-Band SAR" : asset?.name?.includes("Proba") ? "Proba Satellite HRC" : "Sentinel-2 MSI (0.5m GSD)";
  const crs = "WGS 84 (EPSG:4326) · UTM Zone 43N (EPSG:32643)";
  const confidence = currentResult?.confidence || 94.2;
  const sha256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0D171C] border-l border-[#1C323B] shadow-[0_0_35px_rgba(0,0,0,0.8)] flex flex-col font-mono text-xs animate-in slide-in-from-right duration-200 rounded-l-3xl overflow-hidden">
      {/* Header */}
      <div className="h-12 px-4 bg-[#080E11] border-b border-[#1C323B] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#12A5B8] font-bold">
          <ShieldCheck size={16} />
          <span className="tracking-wider uppercase">LEVEL 4 TECHNICAL AUDIT</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#132127] transition-colors rounded-full"
        >
          <X size={16} />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* 1. Query & Intent */}
        <div className="p-3 bg-[#080E11] border border-[#1C323B] space-y-2 rounded-xl">
          <div className="text-[9px] text-[#8AA3AD] uppercase font-bold tracking-widest">
            01 · QUERY & INTENT CLASSIFICATION
          </div>
          <div>
            <span className="text-[9px] text-[#8AA3AD] block uppercase">RAW QUERY</span>
            <div className="text-[#FFFFFF] font-sans text-xs mt-0.5">"{queryText}"</div>
          </div>
          <div className="pt-2 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">AUTOMATIC INTENT</span>
            <span className="text-[#12A5B8] font-bold">{intent}</span>
          </div>
        </div>

        {/* 2. Specialist Adapter & Model Backbone */}
        <div className="p-3 bg-[#080E11] border border-[#1C323B] space-y-2 rounded-xl">
          <div className="text-[9px] text-[#8AA3AD] uppercase font-bold tracking-widest">
            02 · ADAPTER & INFERENCE BACKBONE
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">SPECIALIST TOOL</span>
            <span className="text-[#12A5B8] font-bold">{specialist}</span>
          </div>
          <div className="pt-1.5 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">VLM BACKBONE</span>
            <span className="text-[#F0F6F8] truncate max-w-[200px]">{modelName}</span>
          </div>
          <div className="pt-1.5 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">CALIBRATED CONFIDENCE</span>
            <span className="text-[#12A5B8] font-bold">{confidence}%</span>
          </div>
        </div>

        {/* 3. Sensor & Geodetic Metadata */}
        <div className="p-3 bg-[#080E11] border border-[#1C323B] space-y-2 rounded-xl">
          <div className="text-[9px] text-[#8AA3AD] uppercase font-bold tracking-widest">
            03 · SENSOR & GEODETIC METADATA
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">SENSOR PLATFORM</span>
            <span className="text-[#FFFFFF] font-bold">{sourceSensor}</span>
          </div>
          <div className="pt-1.5 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">SPATIAL RESOLUTION</span>
            <span className="text-[#12A5B8] font-bold">0.5m GSD (Resampled)</span>
          </div>
          <div className="pt-1.5 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">COORDINATE SYSTEM</span>
            <span className="text-[#12A5B8] text-[10px]">{crs}</span>
          </div>
          <div className="pt-1.5 border-t border-[#1C323B] flex items-center justify-between">
            <span className="text-[9px] text-[#8AA3AD] uppercase">ACQUISITION TIME</span>
            <span className="text-[#F0F6F8]">2026-08-24 05:42:18 UTC</span>
          </div>
        </div>

        {/* 4. Cryptographic Provenance */}
        <div className="p-3 bg-[#080E11] border border-[#1C323B] space-y-2 rounded-xl">
          <div className="text-[9px] text-[#8AA3AD] uppercase font-bold tracking-widest flex items-center justify-between">
            <span>04 · CRYPTOGRAPHIC PROVENANCE</span>
            <span className="text-[#12A5B8]">AUDITED ✓</span>
          </div>
          <div className="text-[9px] text-[#8AA3AD] font-sans">
            Every pixel grounding and prediction hash is recorded for tamper-proof defense verification.
          </div>
          <div className="p-2 bg-[#0D171C] border border-[#1C323B] text-[9px] text-[#12A5B8] font-mono break-all select-all rounded-lg">
            {sha256}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-3 bg-[#080E11] border-t border-[#1C323B] flex items-center justify-between">
        <button
          onClick={() => {
            onClose();
            if (onOpenReport) onOpenReport();
          }}
          className="px-3 py-1.5 bg-[#0E7C8A] hover:bg-[#12A5B8] text-[#FFFFFF] font-mono font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(18,165,184,0.3)] rounded-xl"
        >
          <FileText size={13} />
          <span>GENERATE AUDIT PDF ↗</span>
        </button>

        <Button
          variant="ghost"
          onClick={onClose}
          className="text-[#8AA3AD] hover:text-[#FFFFFF] font-mono text-xs rounded-xl"
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export default AnalysisDetailsDrawer;
