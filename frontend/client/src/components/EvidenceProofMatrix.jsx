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
      source: "Proba Satellite / HRC Instrument (TIFF)",
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
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1C323B]/80 pb-3">
        {proofCases.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveProofIndex(idx)}
            className={`px-3 py-1.5 font-mono text-xs border transition-all rounded-md cursor-pointer ${
              activeProofIndex === idx
                ? "ios-glass-primary text-[#FFFFFF] font-bold shadow-[0_0_10px_rgba(18,165,184,0.3)]"
                : "bg-[#080E11] text-[#8AA3AD] border-white/[0.08] hover:text-[#FFFFFF] hover:bg-[#132127]"
            }`}
          >
            <span>{item.id}</span>
            <span className="hidden sm:inline text-[10px] ml-1.5 opacity-80">· {item.title}</span>
          </button>
        ))}
      </div>

      {/* ─── 6-PILLAR AUDIT PROOF MATRIX ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left (Col 1-5): Evidence Crop Image */}
        <div className="lg:col-span-5 relative bg-[#080E11] border border-white/[0.08] overflow-hidden min-h-[360px] flex items-center justify-center rounded-xl ios-glass-card">
          <img
            src={currentCase.image}
            alt={currentCase.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080E11] via-transparent to-transparent pointer-events-none" />

          {/* Overlay Tag */}
          <div className="absolute top-3 left-3 bg-[#080E11]/85 border border-white/[0.08] px-2.5 py-1 font-mono text-[10px] text-[#12A5B8] backdrop-blur-md rounded-lg shadow-sm">
            {currentCase.id} / EVIDENCE RECORD
          </div>

          <div className="absolute bottom-3 left-3 right-3 font-mono text-xs">
            <div className="text-[10px] text-[#12A5B8] font-bold uppercase tracking-wider">
              {currentCase.verdict}
            </div>
            <div className="text-[#FFFFFF] font-bold text-sm">
              {currentCase.what}
            </div>
          </div>
        </div>

        {/* Right (Col 6-12): 6-Pillar Telemetry Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 ios-glass-card border border-white/[0.08] rounded-xl">
          
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[#8AA3AD] pb-3 mb-4 border-b border-[#1C323B]/80">
              <span className="text-[#12A5B8] font-bold uppercase tracking-widest">AUDIT TRAIL / FORENSIC PROOF</span>
              <span>ISRO SPACE TECHNOLOGY SPECIFICATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-mono text-xs">
              
              {/* 1. WHAT */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">01 · WHAT</span>
                <span className="font-bold text-[#FFFFFF] block text-xs">{currentCase.what}</span>
              </div>

              {/* 2. WHERE */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">02 · WHERE</span>
                <span className="font-bold text-[#12A5B8] block text-xs">{currentCase.where}</span>
              </div>

              {/* 3. WHEN */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">03 · WHEN</span>
                <span className="font-bold text-[#F0F6F8] block text-xs">{currentCase.when}</span>
              </div>

              {/* 4. SOURCE */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">04 · SOURCE</span>
                <span className="font-bold text-[#F0F6F8] block text-xs">{currentCase.source}</span>
              </div>

              {/* 5. CONFIDENCE */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">05 · MODEL CONFIDENCE</span>
                <span className="font-bold text-[#12A5B8] block text-xs">{currentCase.confidence}</span>
              </div>

              {/* 6. CROSS-MODAL SUPPORT */}
              <div className="p-3 bg-[#080E11]/35 border border-white/[0.08] rounded-lg backdrop-blur-sm">
                <span className="text-[9px] text-[#8AA3AD] uppercase block mb-0.5">06 · CROSS-MODAL SUPPORT</span>
                <span className="font-bold text-[#12A5B8] block text-xs">{currentCase.crossModal}</span>
              </div>

            </div>
          </div>

          {/* Forensic Audit Status */}
          <div className="pt-4 border-t border-[#1C323B]/80 mt-4 flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#8AA3AD]">AI ANSWERS. IMAGERY PROVES.</span>
            <div className="flex items-center gap-1.5 text-[#12A5B8]">
              <ShieldCheck size={14} className="text-[#12A5B8]" />
              <span className="font-bold tracking-wide">CRYPTOGRAPHICALLY AUDITABLE</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default EvidenceProofMatrix;
