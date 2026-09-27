import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, Database, MapPin, Clock, Eye } from "lucide-react";

/**
 * EvidenceProofMatrix — Global Proof & Audit Forensics
 * 
 * Statement:
 * "DON'T JUST GET AN ANSWER. SEE THE EVIDENCE."
 * "AI ANSWERS. IMAGERY PROVES."
 * 
 * 6-Pillar Audit Structure:
 * WHAT · WHERE · WHEN · SOURCE · CONFIDENCE · CROSS-MODAL SUPPORT
 */
export function EvidenceProofMatrix({ onInvestigatePreset }) {
  const [activeProofIndex, setActiveProofIndex] = useState(0);

  const proofCases = [
    {
      id: "PROOF / 01",
      title: "Bi-Temporal Slope Inundation",
      what: "Debris flow & riverbed morphologic displacement",
      where: "Syabru Besi Sector, 28.15° N, 85.34° E (Approx)",
      when: "18 OCT 2023 vs 27 AUG 2026",
      source: "Project Satellite Temporal Pair",
      confidence: "89.4% (Calibrated)",
      crossModal: "UNAVAILABLE FOR THIS SCENE",
      verdict: "CONFIRMED GEOLOGICAL CHANGE",
      image: "/assets/imagery/nepal_2026_08_27.jpg",
      mode: "CHANGE",
    },
    {
      id: "PROOF / 02",
      title: "Urban Port Infrastructure Grounding",
      what: "High-density built-up maritime facility & harbor docks",
      where: "Mumbai Coastline, 19.0760° N, 72.8777° E",
      when: "2024-03-14T06:12:45Z",
      source: "Proba Satellite / HRC Instrument",
      confidence: "91.4% (Calibrated)",
      crossModal: "AVAILABLE (OPTICAL MULTISPECTRAL)",
      verdict: "SPATIALLY VERIFIED",
      image: "/assets/imagery/mumbai_proba.jpg",
      mode: "GROUNDING",
    },
    {
      id: "PROOF / 03",
      title: "All-Weather Optical-SAR Penetration",
      what: "Reinforced industrial structure verified under cloud deck",
      where: "Pune Sector 4, 18.5204° N, 73.8567° E",
      when: "2026-08-12T10:45:00Z",
      source: "Sentinel-1 SAR (C-Band) + Sentinel-2 MSI",
      confidence: "92.8% (Calibrated)",
      crossModal: "CORROBORATED (RADAR DOUBLE-BOUNCE)",
      verdict: "CROSS-MODAL CONFIRMED",
      image: "/assets/imagery/landcover_sar_sample.jpg",
      mode: "FUSION",
    },
  ];

  const currentCase = proofCases[activeProofIndex];

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* ─── CASE SELECTOR TABS ─── */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-[#1C323B]/80 pb-3.5">
        {proofCases.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveProofIndex(idx)}
            className={`px-3.5 py-2 font-mono text-xs sm:text-[13px] border transition-all rounded-lg cursor-pointer ${
              activeProofIndex === idx
                ? "ios-glass-primary text-[#FFFFFF] font-bold shadow-[0_0_12px_rgba(18,165,184,0.35)]"
                : "bg-[#080E11] text-[#8AA3AD] border-white/[0.08] hover:text-[#FFFFFF] hover:bg-[#132127]"
            }`}
          >
            <span>{item.id}</span>
            <span className="hidden sm:inline text-xs ml-1.5 opacity-85">· {item.title}</span>
          </button>
        ))}
      </div>

      {/* ─── 6-PILLAR AUDIT PROOF MATRIX ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left (Col 1-5): Evidence Crop Image */}
        <div className="lg:col-span-5 relative bg-[#080E11] border border-white/[0.1] overflow-hidden min-h-[380px] flex items-center justify-center rounded-2xl ios-glass-card shadow-xl">
          <img
            src={currentCase.image}
            alt={currentCase.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080E11] via-transparent to-transparent pointer-events-none" />

          {/* Overlay Tag */}
          <div className="absolute top-3 left-3 bg-[#080E11]/90 border border-white/[0.1] px-3 py-1.5 font-mono text-xs text-[#22D3EE] font-bold backdrop-blur-md rounded-lg shadow-sm">
            {currentCase.id} / EVIDENCE RECORD
          </div>

          <div className="absolute bottom-4 left-4 right-4 font-mono">
            <div className="text-xs sm:text-[12px] text-[#22D3EE] font-bold uppercase tracking-wider mb-1">
              {currentCase.verdict}
            </div>
            <div className="text-[#FFFFFF] font-bold text-base sm:text-lg leading-snug">
              {currentCase.what}
            </div>
          </div>
        </div>

        {/* Right (Col 6-12): 6-Pillar Telemetry Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-7 ios-glass-card border border-white/[0.1] rounded-2xl shadow-xl">
          
          <div>
            <div className="flex items-center justify-between font-mono text-xs sm:text-[12.5px] pb-3.5 mb-4 border-b border-[#1C323B]/80">
              <span className="text-[#22D3EE] font-bold uppercase tracking-wider">AUDIT TRAIL / FORENSIC PROOF</span>
              <span className="text-[#8AA3AD]">SPACE TECHNOLOGY SPECIFICATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono">
              
              {/* 1. WHAT */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">01 · WHAT</span>
                <span className="font-bold text-[#FFFFFF] block text-sm sm:text-[14px] leading-snug">{currentCase.what}</span>
              </div>

              {/* 2. WHERE */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">02 · WHERE</span>
                <span className="font-bold text-[#22D3EE] block text-sm sm:text-[14px] leading-snug">{currentCase.where}</span>
              </div>

              {/* 3. WHEN */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">03 · WHEN</span>
                <span className="font-bold text-[#F0F6F8] block text-sm sm:text-[14px] leading-snug">{currentCase.when}</span>
              </div>

              {/* 4. SOURCE */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">04 · SOURCE</span>
                <span className="font-bold text-[#F0F6F8] block text-sm sm:text-[14px] leading-snug">{currentCase.source}</span>
              </div>

              {/* 5. CONFIDENCE */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">05 · MODEL CONFIDENCE</span>
                <span className="font-bold text-[#22D3EE] block text-sm sm:text-[14px] leading-snug">{currentCase.confidence}</span>
              </div>

              {/* 6. CROSS-MODAL SUPPORT */}
              <div className="p-3.5 sm:p-4 bg-[#080E11]/50 border border-white/[0.08] rounded-xl backdrop-blur-sm">
                <span className="text-[10.5px] sm:text-[11px] text-[#8AA3AD] font-bold uppercase tracking-wider block mb-1">06 · CROSS-MODAL SUPPORT</span>
                <span className="font-bold text-[#38BDF8] block text-sm sm:text-[14px] leading-snug">{currentCase.crossModal}</span>
              </div>

            </div>
          </div>

          {/* Forensic Audit Status */}
          <div className="pt-4 border-t border-[#1C323B]/80 mt-4 flex items-center justify-between font-mono text-xs sm:text-[12.5px]">
            <span className="text-[#8AA3AD]">AI ANSWERS. IMAGERY PROVES.</span>
            <div className="flex items-center gap-2 text-[#22D3EE]">
              <ShieldCheck size={16} className="text-[#22D3EE]" />
              <span className="font-bold tracking-wide">CRYPTOGRAPHICALLY AUDITABLE</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default EvidenceProofMatrix;
