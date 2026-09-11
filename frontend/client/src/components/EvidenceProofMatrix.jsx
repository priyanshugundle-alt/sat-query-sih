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
      image: "/satquery-prism-optical.png",
      mode: "FUSION",
    },
  ];

  const currentCase = proofCases[activeProofIndex];

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* ─── CASE SELECTOR TABS ─── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2E2B] pb-3">
        {proofCases.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setActiveProofIndex(idx)}
            className={`px-3 py-1.5 font-mono text-xs border transition-all ${
              activeProofIndex === idx
                ? "bg-[#D49A3A] text-[#0B0D0C] border-[#D49A3A] font-bold"
                : "bg-[#151817] text-[#9A9A90] border-[#2A2E2B] hover:text-[#E9E5DA]"
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
        <div className="lg:col-span-5 relative bg-[#0B0D0C] border border-[#2A2E2B] overflow-hidden min-h-[360px] flex items-center justify-center">
          <img
            src={currentCase.image}
            alt={currentCase.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D0C] via-transparent to-transparent pointer-events-none" />

          {/* Overlay Tag */}
          <div className="absolute top-3 left-3 bg-[#0B0D0C]/85 border border-[#2A2E2B] px-2.5 py-1 font-mono text-[10px] text-[#D49A3A] backdrop-blur-sm">
            {currentCase.id} / EVIDENCE RECORD
          </div>

          <div className="absolute bottom-3 left-3 right-3 font-mono text-xs">
            <div className="text-[10px] text-[#68745C] font-bold uppercase tracking-wider">
              {currentCase.verdict}
            </div>
            <div className="text-[#F3F0E8] font-bold text-sm">
              {currentCase.what}
            </div>
          </div>
        </div>

        {/* Right (Col 6-12): 6-Pillar Telemetry Grid */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 bg-[#151817] border border-[#2A2E2B]">
          
          <div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[#9A9A90] pb-3 mb-4 border-b border-[#2A2E2B]">
              <span className="text-[#D49A3A] font-bold uppercase tracking-widest">AUDIT TRAIL / FORENSIC PROOF</span>
              <span>ISRO SIH26167 SPECIFICATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              
              {/* 1. WHAT */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">01 · WHAT</span>
                <span className="font-bold text-[#F3F0E8] block text-xs">{currentCase.what}</span>
              </div>

              {/* 2. WHERE */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">02 · WHERE</span>
                <span className="font-bold text-[#76AEB0] block text-xs">{currentCase.where}</span>
              </div>

              {/* 3. WHEN */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">03 · WHEN</span>
                <span className="font-bold text-[#E9E5DA] block text-xs">{currentCase.when}</span>
              </div>

              {/* 4. SOURCE */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">04 · SOURCE</span>
                <span className="font-bold text-[#E9E5DA] block text-xs">{currentCase.source}</span>
              </div>

              {/* 5. CONFIDENCE */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">05 · MODEL CONFIDENCE</span>
                <span className="font-bold text-[#E4B65A] block text-xs">{currentCase.confidence}</span>
              </div>

              {/* 6. CROSS-MODAL SUPPORT */}
              <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                <span className="text-[9px] text-[#9A9A90] uppercase block mb-0.5">06 · CROSS-MODAL SUPPORT</span>
                <span className="font-bold text-[#68745C] block text-xs">{currentCase.crossModal}</span>
              </div>

            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-[#2A2E2B] mt-4 flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#9A9A90]">AI ANSWERS. IMAGERY PROVES.</span>
            <button
              onClick={() => onInvestigatePreset && onInvestigatePreset({
                query: currentCase.what,
                mode: currentCase.mode,
                sampleImage: currentCase.image
              })}
              className="px-4 py-2 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>INSPECT EVIDENCE IN WORKSTATION</span>
              <span>↗</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default EvidenceProofMatrix;
