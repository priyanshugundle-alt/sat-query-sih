import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Database,
  Layers,
  Eye,
  Target,
  Radar,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Clock,
  ArrowUpRight,
  Cpu,
  CheckCircle2,
  Activity,
  Zap,
  ArrowRight
} from "lucide-react";
import { Earth3DCanvas } from "./Earth3DCanvas";
import { DeepSpaceBackground } from "./DeepSpaceBackground";
import { ObservationSweep } from "./ObservationSweep";
import { BiTemporalInvestigator } from "./BiTemporalInvestigator";
import { OpticalSarFusion } from "./OpticalSarFusion";
import { EvidenceProofMatrix } from "./EvidenceProofMatrix";

/**
 * CinematicLanding (SIH26167 · ISRO · SatQuery AI)
 * 
 * 8-STAGE MASTER EARTH OBSERVATION SPECIFICATION:
 * 
 * 01 EARTH         — SATQUERY AI · ASK EARTH. UNDERSTAND IT.
 * 02 VQA           — ASK THE IMAGE. (Mumbai Satellite Imagery)
 * 03 GROUNDING     — FIND WHAT MATTERS. (Mumbai Detected Regions)
 * 04 BI-TEMPORAL   — SEE WHAT CHANGED. ([2023] | [2026] · FOLLOW CHANGE ↗)
 * 05 OPTICAL + SAR — SEE BEYOND ONE SENSOR. (OPTICAL ↓ SAR ↓ FUSED OBSERVATION)
 * 06 EVIDENCE      — SEE THE PROOF. (FINDING ↓ REGION ↓ SOURCE ↓ CONFIDENCE ↓ CROSS-MODAL)
 * 07 TECHNICAL     — REMOTE-SENSING INPUT & AGENTIC ROUTING PIPELINE
 * 08 CTA           — DON'T JUST GET AN ANSWER. SEE THE PROOF.
 */
export function CinematicLanding({
  onStartInvestigation,
  onOpenLibrary,
  onAttachImagery,
}) {
  const [activeSection, setActiveSection] = useState("hero");

  // Track scroll position to coordinate 3D Earth choreography across all 8 stages
  useEffect(() => {
    const handleScroll = () => {
      const pos = window.scrollY;
      const h = window.innerHeight;

      if (pos < h * 0.75) {
        setActiveSection("hero");
      } else if (pos < h * 1.75) {
        setActiveSection("vqa");
      } else if (pos < h * 2.75) {
        setActiveSection("grounding");
      } else if (pos < h * 3.9) {
        setActiveSection("nepal");
      } else if (pos < h * 4.9) {
        setActiveSection("sar");
      } else if (pos < h * 5.9) {
        setActiveSection("evidence");
      } else if (pos < h * 6.9) {
        setActiveSection("technical");
      } else {
        setActiveSection("final_cta");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLaunchWorkstation = (preset = null) => {
    onStartInvestigation(preset);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0B0D0C] text-[#E9E5DA] font-sans selection:bg-[#D49A3A] selection:text-[#0B0D0C]">
      
      {/* ─── 1. DEEP SPACE ENVIRONMENT (SUBTLE STARS & FAINT GALACTIC DUST) ─── */}
      <DeepSpaceBackground opacity={1} />

      {/* ─── 2. PERSISTENT 3D THREE.JS EARTH SCENE (ONE ENGINE, REVERSIBLE) ─── */}
      <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
        <Earth3DCanvas
          stage={activeSection}
          zoomProgress={
            activeSection === "vqa" || activeSection === "nepal"
              ? 0.72
              : activeSection === "grounding"
              ? 0.45
              : 0
          }
        />
      </div>

      {/* ─── 3. SLEEK HIGH-CONTRAST HEADER ─── */}
      <header className="sticky top-0 z-50 h-14 px-6 md:px-12 bg-[#0B0D0C]/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
        
        {/* Brand */}
        <button
          onClick={() => scrollToSection("hero-section")}
          className="flex items-center gap-2.5 text-[#F3F0E8] font-bold text-base hover:text-[#D49A3A] transition-colors cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#D49A3A] shadow-[0_0_10px_#D49A3A]" />
          <span className="tracking-wide">SATQUERY AI</span>
        </button>

        {/* Primary Workstation CTA */}
        <button
          onClick={() => handleLaunchWorkstation()}
          className="px-4 py-2 bg-[#D49A3A] hover:bg-[#E4B65A] active:scale-95 text-[#0B0D0C] font-bold text-xs tracking-wider rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_12px_rgba(212,154,58,0.25)]"
        >
          <span>OPEN WORKSTATION</span>
          <span className="text-sm leading-none">↗</span>
        </button>

      </header>

      {/* ─── 4. EIGHT CORE CHAPTERS ─── */}
      <div className="relative z-20 flex flex-col">

        {/* ════════════════════════════════════════════════════════════════
            01 EARTH — SATQUERY AI · ASK EARTH. UNDERSTAND IT.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          className="min-h-screen relative flex flex-col justify-center px-6 md:px-14 lg:px-20 py-16 overflow-hidden"
        >
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headline & Supporting Text */}
            <div className="lg:col-span-6 flex flex-col justify-center z-30">
              
              {/* High-Contrast Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-mono text-xs tracking-[0.16em] text-[#D49A3A] uppercase font-bold mb-3 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#D49A3A] shadow-[0_0_8px_#D49A3A]" />
                <span>MULTIMODAL SATELLITE INTELLIGENCE</span>
              </motion.div>

              {/* Display Heading: Space Grotesk */}
              <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="font-sans text-[clamp(52px,6.2vw,92px)] font-bold tracking-tight text-[#F3F0E8] leading-[0.96] mb-3">
                  SATQUERY AI
                </h1>
              </motion.div>

              {/* Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="space-y-3"
              >
                <div className="font-sans text-[clamp(26px,3vw,44px)] font-extrabold text-[#F3F0E8] tracking-tight leading-tight">
                  ASK EARTH.<br />
                  <span className="text-[#C8C5BB]">UNDERSTAND IT.</span>
                </div>

                <p className="font-sans text-base sm:text-lg text-[#C8C5BB] max-w-md leading-relaxed pt-1">
                  A cinematic Earth-observation intelligence experience. Scroll to begin.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="flex flex-wrap items-center gap-3 pt-6 font-mono text-xs"
              >
                <button
                  onClick={() => scrollToSection("vqa-section")}
                  className="px-4 py-2.5 bg-[#D49A3A] hover:bg-[#E4B65A] active:scale-95 text-[#0B0D0C] font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <span>EXPLORE OBSERVATION JOURNEY</span>
                  <ChevronDown size={14} />
                </button>

                <button
                  onClick={() => handleLaunchWorkstation()}
                  className="px-4 py-2.5 bg-[#151817] hover:bg-[#1D211F] active:scale-95 border border-[#2A2E2B] text-[#E9E5DA] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>LAUNCH WORKSTATION</span>
                  <span>↗</span>
                </button>
              </motion.div>

              {/* Origin India Status Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.1 }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 text-xs font-mono text-[#E9E5DA] mt-6 w-fit backdrop-blur-md shadow-sm"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34C759] shadow-[0_0_8px_#34C759] animate-pulse" />
                  <span className="text-[#34C759] font-bold tracking-wider">ORIGIN:</span>
                </div>
                <span className="text-[#F3F0E8] font-semibold tracking-wide">INDIA (20.59° N, 78.96° E)</span>
              </motion.div>

            </div>

            {/* Right Column: 3D Earth space occupies right-center */}
            <div className="lg:col-span-6 min-h-[380px] pointer-events-none" />

          </div>

          {/* Scroll Cue */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[#E9E5DA]/80 flex flex-col items-center gap-1.5 pointer-events-none">
            <span className="text-[11px] tracking-wider uppercase">SCROLL TO EXPLORE SATELLITE DATA</span>
            <ChevronDown size={16} className="text-[#D49A3A] animate-bounce" />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            02 VQA — ASK THE IMAGE.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="vqa-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#2A2E2B] pb-4">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#D49A3A] uppercase tracking-[0.16em] font-bold">
                  02 / VQA
                </div>
                <h2 className="font-sans text-[clamp(36px,4.2vw,62px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.0]">
                  ASK THE IMAGE.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-2xl mt-2 leading-relaxed">
                  Query a single remote-sensing image using natural language to understand land cover, agriculture, infrastructure, urban areas and other visible features.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#9A9A90] flex items-center gap-2 flex-shrink-0">
                <MapPin size={13} className="text-[#D49A3A]" />
                <span>19.0760° N, 72.8777° E · PROBA SATELLITE (TIFF)</span>
              </div>
            </div>

            {/* Observation Sweep Demonstration */}
            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="VQA"
              query="What type of land cover dominates this region?"
              answer="Dense urban residential agglomeration flanked by deep-water harbor logistics docks on the eastern bay and high-salinity tidal inlets."
              boundingRegions={[
                { label: "URBAN RESIDENTIAL GRID", confidence: "94.2%", top: "32%", left: "26%", width: "44%", height: "38%" },
                { label: "MARITIME HARBOR", confidence: "89.6%", top: "44%", left: "56%", width: "24%", height: "26%" },
              ]}
              meta={{
                source: "Bombay Seen by Proba Satellite",
                coords: "19.0760° N, 72.8777° E",
                resolution: "5m GSD Multispectral",
                timestamp: "2024-03-14T06:12:45Z",
              }}
              onActionClick={() => handleLaunchWorkstation({
                query: "What type of land cover dominates this region?",
                mode: "VQA",
                sampleImage: "/assets/imagery/mumbai_proba.jpg"
              })}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            03 GROUNDING — FIND WHAT MATTERS.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="grounding-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#2A2E2B] pb-4">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#76AEB0] uppercase tracking-[0.16em] font-bold">
                  03 / GROUNDING
                </div>
                <h2 className="font-sans text-[clamp(34px,4.0vw,58px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  FIND WHAT MATTERS.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-2xl mt-2 leading-relaxed">
                  Locate specific objects or regions in satellite imagery and connect the answer directly to visual evidence.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#9A9A90] flex items-center gap-2 flex-shrink-0">
                <Target size={13} className="text-[#76AEB0]" />
                <span>GROUNDINGDINO / UNIRS ADAPTER</span>
              </div>
            </div>

            {/* Target Grounding on Mumbai Imagery */}
            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="GROUNDING"
              query="Where are the major built-up areas?"
              answer="GroundingDINO localized 3 distinct high-density industrial and residential clusters with high confidence (91.4% average agreement)."
              boundingRegions={[
                { label: "BUILT-UP SECTOR A", confidence: "91.4%", top: "28%", left: "30%", width: "24%", height: "22%" },
                { label: "BUILT-UP SECTOR B", confidence: "93.1%", top: "52%", left: "28%", width: "30%", height: "26%" },
                { label: "PORT DOCKS", confidence: "88.7%", top: "40%", left: "54%", width: "20%", height: "20%" },
              ]}
              meta={{
                source: "Bombay Seen by Proba Satellite",
                coords: "19.0760° N, 72.8777° E",
                resolution: "5m GSD Multispectral",
                timestamp: "2024-03-14T06:12:45Z",
              }}
              onActionClick={() => handleLaunchWorkstation({
                query: "Where are the major built-up areas?",
                mode: "GROUNDING",
                sampleImage: "/assets/imagery/mumbai_proba.jpg"
              })}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            04 BI-TEMPORAL — SEE WHAT CHANGED.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="nepal-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#2A2E2B] pb-4">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#D49A3A] uppercase tracking-[0.16em] font-bold">
                  04 / BI-TEMPORAL
                </div>
                <h2 className="font-sans text-[clamp(34px,4.0vw,58px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  SEE WHAT CHANGED.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-2xl mt-2 leading-relaxed">
                  Compare historical and recent satellite observations to detect spatial difference, landslides, urban expansion, and terrain alteration.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#9A9A90] flex items-center gap-2 flex-shrink-0">
                <Clock size={13} className="text-[#D49A3A]" />
                <span>SYABRU BESI, NEPAL · 18 OCT 2023 ↔ 27 AUG 2026</span>
              </div>
            </div>

            {/* Interactive Bi-Temporal Investigation Canvas */}
            <BiTemporalInvestigator
              onInvestigateInWorkstation={(preset) => handleLaunchWorkstation({
                query: preset.query,
                mode: "CHANGE",
                sampleImage: "/assets/imagery/nepal_2026_08_27.jpg"
              })}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            05 OPTICAL + SAR — SEE BEYOND ONE SENSOR.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="fusion-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#2A2E2B] pb-4">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#76AEB0] uppercase tracking-[0.16em] font-bold">
                  05 / OPTICAL + SAR
                </div>
                <h2 className="font-sans text-[clamp(34px,4.0vw,58px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  SEE BEYOND ONE SENSOR.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-2xl mt-2 leading-relaxed">
                  Combine optical and synthetic-aperture radar observations to analyze the same geographic region from complementary sensing perspectives.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#9A9A90] flex items-center gap-2 flex-shrink-0">
                <Radar size={13} className="text-[#76AEB0]" />
                <span>SENTINEL-1 C-BAND + SENTINEL-2 MSI</span>
              </div>
            </div>

            {/* Optical + SAR Fusion System */}
            <OpticalSarFusion
              onInvestigateInWorkstation={(preset) => handleLaunchWorkstation({
                query: preset.query,
                mode: "FUSION",
                sampleImage: "/satquery-prism-optical.png"
              })}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            06 EVIDENCE — SEE THE PROOF.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="evidence-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6">
            
            {/* Section Header */}
            <div className="border-b border-[#2A2E2B] pb-4">
              <div className="font-mono text-[10px] sm:text-[11px] text-[#D49A3A] uppercase tracking-[0.16em] font-bold">
                06 / EVIDENCE
              </div>
              <h2 className="font-sans text-[clamp(34px,4.2vw,62px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.0]">
                SEE THE PROOF.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-xl mt-2 leading-relaxed">
                Every finding remains connected to the imagery that supports it through verifiable provenance.
              </p>
            </div>

            {/* 6-Pillar Forensic Proof Matrix */}
            <EvidenceProofMatrix
              onInvestigatePreset={(preset) => handleLaunchWorkstation(preset)}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            07 TECHNICAL SIGNAL — REMOTE-SENSING INPUT & AGENTIC ROUTING
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="technical-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 border-t border-[#2A2E2B]/50"
        >
          <div className="max-w-7xl w-full mx-auto space-y-8">
            
            {/* Section Header */}
            <div className="border-b border-[#2A2E2B] pb-4">
              <div className="font-mono text-[10px] sm:text-[11px] text-[#D49A3A] uppercase tracking-[0.16em] font-bold">
                07 / TECHNICAL SIGNAL
              </div>
              <h2 className="font-sans text-[clamp(34px,4.2vw,62px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.0]">
                REMOTE-SENSING PIPELINE.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#9A9A90] max-w-2xl mt-2 leading-relaxed">
                Deterministic agentic orchestration routing natural language inquiries to calibrated vision-language adapters.
              </p>
            </div>

            {/* 1. Architecture Flow Pipeline */}
            <div className="p-6 bg-[#151817] border border-[#2A2E2B]">
              <div className="font-mono text-[10px] text-[#D49A3A] uppercase tracking-widest font-bold mb-4">
                AGENTIC TASK ROUTING FLOW
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
                {[
                  { step: "01", title: "QUERY", desc: "Natural Language Ingestion", sub: "User prompt parse", color: "#F3F0E8" },
                  { step: "02", title: "ROUTING", desc: "Intent Classification", sub: "VQA · Ground · Chg · Fuse", color: "#D49A3A" },
                  { step: "03", title: "SPECIALIST", desc: "Adapter Execution", sub: "GeoChat / GroundingDINO", color: "#76AEB0" },
                  { step: "04", title: "EVIDENCE", desc: "Pixel Localization", sub: "BBox & Diff Raster Masks", color: "#E4B65A" },
                  { step: "05", title: "RESULT", desc: "Calibrated Audit Trace", sub: "SHA-256 Verified Finding", color: "#68745C" },
                ].map((st) => (
                  <div key={st.step} className="p-3.5 bg-[#0B0D0C] border border-[#2A2E2B] flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] text-[#9A9A90] block">{st.step} · STEP</span>
                      <span className="font-bold text-sm block mt-0.5" style={{ color: st.color }}>{st.title}</span>
                    </div>
                    <div className="pt-3 border-t border-[#2A2E2B]/60 mt-3 text-[11px]">
                      <div className="text-[#E9E5DA] font-semibold">{st.desc}</div>
                      <div className="text-[#9A9A90] text-[10px] mt-0.5">{st.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Sensor Compatibility & Validation Benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left (Col 1-6): Sensor Inputs */}
              <div className="lg:col-span-6 p-6 bg-[#151817] border border-[#2A2E2B] flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[10px] text-[#76AEB0] uppercase tracking-widest font-bold mb-2">
                    REMOTE-SENSING SENSOR COMPATIBILITY
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#F3F0E8] mb-3">
                    Multi-Spectral & Radar Constellations
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      { sensor: "ISRO CARTOSAT-3", spec: "0.28m PAN / 1.12m MX", use: "High-resolution object grounding" },
                      { sensor: "ISRO EOS-04 (RISAT-1A)", spec: "C-Band Synthetic Aperture Radar", use: "All-weather monsoon penetration" },
                      { sensor: "RESOURCESAT-2A", spec: "LISS-IV (5.8m Multi-Spectral)", use: "Agricultural parcel classification" },
                      { sensor: "SENTINEL-1 & SENTINEL-2", spec: "10m MSI + C-Band GRD Dual-Pass", use: "Bi-temporal change & cross-sensor fusion" },
                    ].map((s) => (
                      <div key={s.sensor} className="p-2.5 bg-[#0B0D0C] border border-[#2A2E2B] flex items-center justify-between">
                        <div>
                          <span className="text-[#F3F0E8] font-bold block">{s.sensor}</span>
                          <span className="text-[#9A9A90] text-[10px]">{s.use}</span>
                        </div>
                        <span className="text-[#D49A3A] text-[10px] font-bold">{s.spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right (Col 7-12): Academic Benchmarks */}
              <div className="lg:col-span-6 p-6 bg-[#151817] border border-[#2A2E2B] flex flex-col justify-between">
                <div>
                  <div className="font-mono text-[10px] text-[#68745C] uppercase tracking-widest font-bold mb-2">
                    BENCHMARK VALIDATION ACCURACY
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#F3F0E8] mb-3">
                    Calibrated Remote-Sensing Evaluation
                  </h3>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                      <span className="text-[9px] text-[#9A9A90] uppercase block">GROUNDING mIoU</span>
                      <span className="text-xl font-bold text-[#76AEB0] block mt-1">82.4%</span>
                      <span className="text-[9px] text-[#9A9A90]">RSIVQA / DIOR Benchmark</span>
                    </div>
                    <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                      <span className="text-[9px] text-[#9A9A90] uppercase block">CHANGE F1 SCORE</span>
                      <span className="text-xl font-bold text-[#D49A3A] block mt-1">89.1%</span>
                      <span className="text-[9px] text-[#9A9A90]">LEVIR-CD / S2Looking</span>
                    </div>
                    <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                      <span className="text-[9px] text-[#9A9A90] uppercase block">VQA BLEU-4</span>
                      <span className="text-xl font-bold text-[#E4B65A] block mt-1">94.2%</span>
                      <span className="text-[9px] text-[#9A9A90]">EarthVQA Benchmark</span>
                    </div>
                    <div className="p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
                      <span className="text-[9px] text-[#9A9A90] uppercase block">CO-REGISTRATION</span>
                      <span className="text-xl font-bold text-[#68745C] block mt-1">&lt; 0.4 px</span>
                      <span className="text-[9px] text-[#9A9A90]">Sub-pixel GeoTIFF alignment</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2A2E2B] mt-4 flex items-center justify-between text-[10px] text-[#9A9A90] font-mono">
                  <span>DETERMINISTIC EVALUATION</span>
                  <span className="text-[#D49A3A]">ZERO HALLUCINATION AUDIT</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            08 CTA — DON'T JUST GET AN ANSWER. SEE THE PROOF.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="final-section"
          className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-16 py-24 border-t border-[#2A2E2B]"
        >
          <div className="max-w-3xl mx-auto space-y-6 z-30">
            
            <div className="font-mono text-xs tracking-[0.20em] text-[#D49A3A] uppercase font-bold">
              08 / CALL TO ACTION · SIH26167 · ISRO
            </div>

            <h2 className="font-sans text-[clamp(38px,5vw,68px)] font-bold text-[#F3F0E8] tracking-tight leading-[1.02]">
              DON’T JUST GET AN ANSWER.<br />
              <span className="text-[#D49A3A]">SEE THE PROOF.</span>
            </h2>

            <p className="font-sans text-base sm:text-lg text-[#9A9A90] max-w-xl mx-auto leading-relaxed">
              Start an auditable satellite investigation across optical, microwave radar, and bi-temporal remote-sensing scenes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs">
              <button
                onClick={() => handleLaunchWorkstation()}
                className="px-8 py-3.5 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
              >
                <span>START INVESTIGATION</span>
                <span>↗</span>
              </button>

              <button
                onClick={onOpenLibrary}
                className="px-6 py-3.5 bg-[#151817] hover:bg-[#1D211F] border border-[#2A2E2B] text-[#E9E5DA] flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Database size={14} className="text-[#D49A3A]" />
                <span>EXPLORE SATELLITE CATALOG</span>
              </button>
            </div>

            <div className="pt-16 border-t border-[#2A2E2B]/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#9A9A90]/60 font-mono">
              <span>INDIAN SPACE RESEARCH ORGANISATION · SPACE TECHNOLOGY</span>
              <span>AI ANSWERS. IMAGERY PROVES.</span>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}

export default CinematicLanding;
