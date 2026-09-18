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
 * CinematicLanding (ISRO · SatQuery AI)
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
  const [activeSpecialist, setActiveSpecialist] = useState("geochat");

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
    <div className="relative w-full min-h-screen bg-[#040708] text-[#F0F6F8] font-sans selection:bg-[#0E7C8A] selection:text-[#FFFFFF]">
      
      {/* ─── 1. DEEP SPACE ENVIRONMENT (SUBTLE STARS & FAINT GALACTIC DUST) ─── */}
      <DeepSpaceBackground opacity={1} />

      {/* ─── 2. PERSISTENT 3D THREE.JS EARTH SCENE (ONE ENGINE, REVERSIBLE) ─── */}
      <div className="fixed inset-0 pointer-events-auto z-10 overflow-hidden">
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
      <header className="sticky top-0 z-50 h-14 px-6 md:px-12 ios-glass-header flex items-center justify-between">
        
        {/* Brand */}
        <button
          onClick={() => scrollToSection("hero-section")}
          className="flex items-center gap-2.5 text-[#FFFFFF] font-bold text-base hover:text-[#12A5B8] transition-colors cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] shadow-[0_0_10px_#12A5B8]" />
          <span className="tracking-wide">SATQUERY AI</span>
        </button>

        {/* Primary Workstation CTA (Sole Workstation Entry Point on Landing Page) */}
        <button
          id="ask-query-header-btn"
          onClick={() => handleLaunchWorkstation()}
          className="px-4 py-2 ios-glass-primary active:scale-95 text-[#FFFFFF] font-bold text-xs tracking-wider rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(18,165,184,0.3)]"
        >
          <span>ASK QUERY</span>
          <span className="text-sm leading-none">↗</span>
        </button>

      </header>

      {/* ─── 4. EIGHT CORE CHAPTERS ─── */}
      <div className="relative z-20 flex flex-col pointer-events-none">

        {/* ════════════════════════════════════════════════════════════════
            01 EARTH — SATQUERY AI · ASK EARTH. UNDERSTAND IT.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="hero-section"
          className="min-h-screen relative flex flex-col justify-center px-6 md:px-14 lg:px-20 py-16 overflow-hidden pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20">
            
            {/* Left Column: Headline & Supporting Text */}
            <div className="lg:col-span-6 flex flex-col justify-center z-30 pointer-events-auto">
              
              {/* High-Contrast Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-mono text-xs tracking-[0.16em] text-[#12A5B8] uppercase font-bold mb-3 flex items-center gap-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
              >
                <span className="w-2 h-2 rounded-sm bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
                <span>MULTIMODAL SATELLITE INTELLIGENCE</span>
              </motion.div>

              {/* Display Heading: Sora */}
              <motion.div
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="font-heading font-sora text-[clamp(52px,6.2vw,92px)] font-extrabold tracking-tight text-[#FFFFFF] leading-[0.96] mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
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
                <div className="font-heading font-sora text-[clamp(26px,3vw,44px)] font-bold text-[#FFFFFF] tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  ASK EARTH.<br />
                  <span className="text-[#A2BAC5] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">UNDERSTAND IT.</span>
                </div>

                <p className="font-sans text-base sm:text-lg text-[#D0E3EA] max-w-md leading-relaxed pt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
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
                  className="px-4 py-2.5 ios-glass-primary active:scale-95 text-[#FFFFFF] font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(18,165,184,0.25)]"
                >
                  <span>EXPLORE OBSERVATION JOURNEY</span>
                  <ChevronDown size={14} />
                </button>
              </motion.div>

            </div>

            {/* Right Column: 3D Earth space occupies right-center */}
            <div className="lg:col-span-6 min-h-[380px] pointer-events-none" />

          </div>

          {/* Scroll Cue */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-[#8AA3AD] flex flex-col items-center gap-1.5 pointer-events-none">
            <span className="text-[11px] tracking-wider uppercase">SCROLL TO EXPLORE SATELLITE DATA</span>
            <ChevronDown size={16} className="text-[#12A5B8] animate-bounce" />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            02 VQA — ASK THE IMAGE.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="vqa-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                  02 / VQA
                </div>
                <h2 className="font-heading font-sora text-[clamp(36px,4.2vw,62px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  ASK THE IMAGE.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-2xl mt-2 leading-relaxed">
                  Query a single remote-sensing image using natural language to understand land cover, agriculture, infrastructure, urban areas and other visible features.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#8AA3AD] flex items-center gap-2 flex-shrink-0">
                <MapPin size={13} className="text-[#12A5B8]" />
                <span>19.0760° N, 72.8777° E · PROBA SATELLITE (TIFF)</span>
              </div>
            </div>

            {/* Observation Sweep Demonstration (VQA: No bounding highlights, pure natural language query) */}
            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="VQA"
              query="What type of land cover dominates this region?"
              answer="Dense urban residential agglomeration flanked by deep-water harbor logistics docks on the eastern bay and high-salinity tidal inlets."
              boundingRegions={[]}
              meta={{
                source: "Bombay Seen by Proba Satellite",
                coords: "19.0760° N, 72.8777° E",
                resolution: "5m GSD Multispectral",
                timestamp: "2024-03-14T06:12:45Z",
              }}
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            03 GROUNDING — FIND WHAT MATTERS.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="grounding-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                  03 / GROUNDING
                </div>
                <h2 className="font-heading font-sora text-[clamp(34px,4.0vw,58px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  FIND WHAT MATTERS.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-2xl mt-2 leading-relaxed">
                  Locate specific objects or regions in satellite imagery and connect the answer directly to visual evidence.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#8AA3AD] flex items-center gap-2 flex-shrink-0">
                <Target size={13} className="text-[#12A5B8]" />
                <span>GEOCHAT-GROUNDING / UNIRS ADAPTER</span>
              </div>
            </div>

            {/* Target Grounding on Mumbai Imagery */}
            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="GROUNDING"
              query="Where are the major built-up areas?"
              answer="GeoChat-Grounding localized 3 distinct high-density industrial and residential clusters with high confidence (91.4% average agreement)."
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
            />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            04 BI-TEMPORAL — SEE WHAT CHANGED.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="nepal-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                  04 / BI-TEMPORAL
                </div>
                <h2 className="font-heading font-sora text-[clamp(34px,4.0vw,58px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  SEE WHAT CHANGED.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-2xl mt-2 leading-relaxed">
                  Compare historical and recent satellite observations to detect spatial difference, landslides, urban expansion, and terrain alteration.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#8AA3AD] flex items-center gap-2 flex-shrink-0">
                <Clock size={13} className="text-[#12A5B8]" />
                <span>SYABRU BESI, NEPAL · 18 OCT 2023 ↔ 27 AUG 2026</span>
              </div>
            </div>

            {/* Interactive Bi-Temporal Investigation Canvas */}
            <BiTemporalInvestigator />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            05 OPTICAL + SAR — SEE BEYOND ONE SENSOR.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="fusion-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div>
                <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                  05 / OPTICAL + SAR
                </div>
                <h2 className="font-heading font-sora text-[clamp(34px,4.0vw,58px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  SEE BEYOND ONE SENSOR.
                </h2>
                <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-2xl mt-2 leading-relaxed">
                  Combine optical and synthetic-aperture radar observations to analyze the same geographic region from complementary sensing perspectives.
                </p>
              </div>

              <div className="font-mono text-[11px] text-[#8AA3AD] flex items-center gap-2 flex-shrink-0">
                <Radar size={13} className="text-[#12A5B8]" />
                <span>SENTINEL-1 C-BAND + SENTINEL-2 MSI</span>
              </div>
            </div>

            {/* Optical + SAR Fusion System */}
            <OpticalSarFusion />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            06 EVIDENCE — SEE THE PROOF.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="evidence-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                06 / EVIDENCE
              </div>
              <h2 className="font-heading font-sora text-[clamp(34px,4.2vw,62px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                SEE THE PROOF.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-xl mt-2 leading-relaxed">
                Every finding remains connected to the imagery that supports it through verifiable provenance.
              </p>
            </div>

            {/* 6-Pillar Forensic Proof Matrix */}
            <EvidenceProofMatrix />

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            07 TECHNICAL PIPELINE — REAL SYSTEM ARCHITECTURE & AGENTIC DISPATCH
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="technical-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-6 pointer-events-auto">
            
            {/* Section Header */}
            <div className="border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                07 / SYSTEM PIPELINE · AGENTIC ORCHESTRATION
              </div>
              <h2 className="font-heading font-sora text-[clamp(32px,3.8vw,56px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                REAL REMOTE-SENSING PIPELINE.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-3xl mt-2 leading-relaxed">
                Decoupled Java 21 AgentController coordinating query classification, GeoTIFF spatial validation, and tool selection before dispatching to task-specialized Python RS-VLM engines.
              </p>
            </div>

            {/* 1. Core End-to-End Execution Flow (5 Sequential Steps) */}
            <div className="p-5 sm:p-6 ios-glass-card border border-white/[0.08] rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div className="font-mono text-[10px] text-[#12A5B8] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
                  <span>5-STAGE AGENTIC EXECUTION FLOW</span>
                </div>
                <div className="font-mono text-[10px] text-[#8AA3AD]">
                  <span>CONTRACT: </span>
                  <span className="text-[#10B981] font-bold">DETERMINISTIC · ZERO HALLUCINATION</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
                {[
                  {
                    step: "01",
                    badge: "PARSER",
                    title: "CLASSIFIER",
                    engine: "QueryClassifier.java",
                    desc: "NLP Intent & Modality Ingestion",
                    sub: "Parses prompt & image count. Routes to VQA, Grounding, Change, or Fusion.",
                    color: "#FFFFFF",
                  },
                  {
                    step: "02",
                    badge: "SAFETY",
                    title: "GEO-VALIDATOR",
                    engine: "InputValidator.java",
                    desc: "CRS & BBox Overlap Check",
                    sub: "Validates GeoTIFF metadata, WGS 84 spatial overlap, and GSD resolution bounds.",
                    color: "#12A5B8",
                  },
                  {
                    step: "03",
                    badge: "CONTROLLER",
                    title: "TOOL REGISTRY",
                    engine: "ToolRegistry.java",
                    desc: "Deterministic Task Selection",
                    sub: "Zero-Spring Java 21 engine verifies parameter rules and picks specialist handler.",
                    color: "#0E7C8A",
                  },
                  {
                    step: "04",
                    badge: "RS-VLMS",
                    title: "MULTI-VLM SERVING",
                    engine: "FastAPI :8000 (PyTorch)",
                    desc: "Specialist Adapter Ingestion",
                    sub: "Dispatches tensor payload to GeoChat, VisTA, or BigEarthNet-MM backbones.",
                    color: "#22D3EE",
                  },
                  {
                    step: "05",
                    badge: "FORENSICS",
                    title: "AUDIT TRACE",
                    engine: "satquery.db (SQLite)",
                    desc: "Cryptographic Provenance",
                    sub: "Computes SHA-256 hash, calibrated confidence score, and persistent evidence trace.",
                    color: "#10B981",
                  },
                ].map((st) => (
                  <div
                    key={st.step}
                    className="p-3.5 bg-[#040708]/35 border border-white/[0.08] hover:border-[#12A5B8]/40 transition-all flex flex-col justify-between rounded-lg backdrop-blur-sm shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#8AA3AD]">{st.step} · STEP</span>
                        <span className="text-[8.5px] px-1.5 py-0.5 bg-white/[0.06] rounded font-bold text-[#D0E3EA]">
                          {st.badge}
                        </span>
                      </div>
                      <span className="font-bold text-sm block mt-1" style={{ color: st.color }}>
                        {st.title}
                      </span>
                      <span className="text-[9.5px] text-[#12A5B8] block font-mono mt-0.5">
                        {st.engine}
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-[#1C323B]/60 mt-3 text-[11px]">
                      <div className="text-[#F0F6F8] font-semibold text-[11px] leading-snug">{st.desc}</div>
                      <div className="text-[#8AA3AD] text-[9.5px] mt-1 leading-relaxed">{st.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Interactive Multi-Specialist Engine Deep Dive */}
            <div className="p-5 sm:p-6 ios-glass-card border border-white/[0.08] rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div className="font-mono text-[10px] text-[#12A5B8] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-sm bg-[#22D3EE] shadow-[0_0_8px_#22D3EE]" />
                  <span>TASK-SPECIALIZED VLM ENGINES (NO MONOLITHIC MODEL)</span>
                </div>
                <div className="font-mono text-[10px] text-[#8AA3AD]">
                  <span>SERVING PORT: </span>
                  <span className="text-[#12A5B8] font-bold">PYTHON FASTAPI :8000</span>
                </div>
              </div>

              {/* Specialist Selector Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                {[
                  {
                    id: "geochat",
                    name: "UniRSAdapter · GeoChat",
                    task: "Single-Image RS-VQA & Grounding",
                    tag: "MBZUAI / VRSBench",
                  },
                  {
                    id: "vista",
                    name: "ChangeQaAdapter · VisTA",
                    task: "Bi-Temporal Change Reasoning",
                    tag: "CDVQA Benchmark",
                  },
                  {
                    id: "bigearthnet",
                    name: "EarthGptAdapter · BigEarthNet",
                    task: "Optical + SAR Cross-Sensor Fusion",
                    tag: "110GB Dual Sentinel Dataset",
                  },
                ].map((spec) => {
                  const isActive = activeSpecialist === spec.id;
                  return (
                    <button
                      key={spec.id}
                      onClick={() => setActiveSpecialist(spec.id)}
                      className={`p-3 text-left transition-all rounded-lg cursor-pointer border ${
                        isActive
                          ? "bg-[#12A5B8]/15 border-[#12A5B8] text-[#FFFFFF] shadow-[0_0_12px_rgba(18,165,184,0.2)]"
                          : "bg-[#040708]/30 border-white/[0.08] text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#040708]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#F0F6F8]">{spec.name}</span>
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#12A5B8] shadow-[0_0_6px_#12A5B8]" />}
                      </div>
                      <div className="text-[10.5px] mt-1 text-[#D0E3EA]">{spec.task}</div>
                      <div className="text-[9px] text-[#12A5B8] mt-1 font-semibold">{spec.tag}</div>
                    </button>
                  );
                })}
              </div>

              {/* Active Specialist Details Container */}
              <div className="p-4 bg-[#040708]/35 border border-white/[0.08] rounded-lg font-mono text-xs space-y-3">
                {activeSpecialist === "geochat" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#12A5B8] font-bold uppercase text-[10px]">MISSION:</span>
                        <span className="text-[#FFFFFF] font-semibold text-xs">Zero-Shot Natural Language RS-VQA & Target Grounding</span>
                      </div>
                      <p className="font-sans text-xs text-[#D0E3EA] leading-relaxed">
                        Fine-tuned on 120,000 remote-sensing visual question pairs (VRSBench & RSVQA). Ingests high-resolution optical rasters, reasons across land cover and infrastructure, and localizes targets with normalized spatial bounding boxes <code className="text-[#12A5B8] bg-white/[0.06] px-1 py-0.5 rounded">[ymin, xmin, ymax, xmax]</code>.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#22D3EE]">VQA BLEU-4: 94.2%</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#12A5B8]">Grounding mIoU: 82.4%</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#10B981]">Temp: 0.0 (Deterministic)</span>
                      </div>
                    </div>
                    <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-4 text-[10px]">
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">JAVA ADAPTER</span>
                        <span className="text-[#FFFFFF] font-bold">UniRSAdapter.java</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">TOOL BINDING</span>
                        <span className="text-[#12A5B8]">VQA_TOOL / GROUNDING_TOOL</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">SPATIAL OUTPUT</span>
                        <span className="text-[#22D3EE]">Bounding Boxes (Normalized)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">BENCHMARK</span>
                        <span className="text-[#10B981]">VRSBench · DIOR · RSVQA</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSpecialist === "vista" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#12A5B8] font-bold uppercase text-[10px]">MISSION:</span>
                        <span className="text-[#FFFFFF] font-semibold text-xs">Bi-Temporal Multi-Year Change Detection & Disaster Forensics</span>
                      </div>
                      <p className="font-sans text-xs text-[#D0E3EA] leading-relaxed">
                        Trained on the CDVQA paired change detection dataset. Compares co-registered pre-event (T1) and post-event (T2) satellite rasters. Discriminates real structural changes (floods, landslides, new construction) from seasonal canopy and atmospheric illumination noise.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#22D3EE]">Change F1 Score: 89.1%</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#12A5B8]">Pair Validation: Strict WGS 84</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#10B981]">Co-Registration: &lt; 0.4px</span>
                      </div>
                    </div>
                    <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-4 text-[10px]">
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">JAVA ADAPTER</span>
                        <span className="text-[#FFFFFF] font-bold">ChangeQaAdapter.java</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">TOOL BINDING</span>
                        <span className="text-[#12A5B8]">CHANGE_UNDERSTANDING_TOOL</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">SPATIAL OUTPUT</span>
                        <span className="text-[#22D3EE]">Difference Mask & Pixel Delta</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">BENCHMARK</span>
                        <span className="text-[#10B981]">CDVQA · LEVIR-CD · S2Looking</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeSpecialist === "bigearthnet" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-7 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[#12A5B8] font-bold uppercase text-[10px]">MISSION:</span>
                        <span className="text-[#FFFFFF] font-semibold text-xs">All-Weather Cross-Modal Sentinel-1 SAR + Sentinel-2 Optical Fusion</span>
                      </div>
                      <p className="font-sans text-xs text-[#D0E3EA] leading-relaxed">
                        Foundation Remote-Sensing VLM fine-tuned on the 110GB BigEarthNet-v2.0 dataset (59GB Sentinel-1 C-band SAR + 51GB Sentinel-2 MSI). Leverages radar microwave backscatter to penetrate dense monsoon clouds and smoke while retaining optical spectral band accuracy.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#22D3EE]">Dataset: BigEarthNet-MM (110GB)</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#12A5B8]">Cloud Resilience: 100% (SAR Penetration)</span>
                        <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded text-[#10B981]">Modalities: Dual-Pass SAR + Optical</span>
                      </div>
                    </div>
                    <div className="md:col-span-5 space-y-1.5 border-t md:border-t-0 md:border-l border-white/[0.08] pt-2 md:pt-0 md:pl-4 text-[10px]">
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">JAVA ADAPTER</span>
                        <span className="text-[#FFFFFF] font-bold">EarthGptAdapter.java</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">TOOL BINDING</span>
                        <span className="text-[#12A5B8]">FUSION_TOOL</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">SPATIAL OUTPUT</span>
                        <span className="text-[#22D3EE]">Fused Land-Cover Class Vectors</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/[0.06]">
                        <span className="text-[#8AA3AD]">BENCHMARK</span>
                        <span className="text-[#10B981]">BigEarthNet-v2.0 · Corine LULC</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. System Architecture Standards Bar */}
            <div className="p-3 ios-glass-card border border-white/[0.08] rounded-xl flex flex-wrap items-center justify-between gap-3 text-[10px] text-[#8AA3AD] font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-[#D0E3EA] font-semibold">CORE JAVA 21 HTTP CONTROLLER (:8080)</span>
                <span className="text-[#8AA3AD] hidden sm:inline">· ZERO SPRING BOOT AUDITABILITY</span>
              </div>
              <div className="flex items-center gap-4">
                <span>SQLITE FORENSIC EVIDENCE DB</span>
                <span className="text-[#12A5B8]">GDAL WGS 84 CALIBRATION</span>
                <span className="text-[#10B981]">SHA-256 PROVENANCE</span>
              </div>
            </div>

          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            08 CTA — DON'T JUST GET AN ANSWER. SEE THE PROOF.
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="final-section"
          className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-16 py-24 pointer-events-none"
        >
          <div className="max-w-4xl mx-auto space-y-6 z-30 pointer-events-auto p-4 sm:p-8 text-center">
            
            <div className="font-mono text-xs tracking-[0.22em] text-[#12A5B8] uppercase font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              08 / CALL TO ACTION · ISRO EARTH OBSERVATION
            </div>

            <h2 className="font-heading font-sora text-[clamp(40px,5.5vw,76px)] font-bold text-[#FFFFFF] tracking-tight leading-[1.0] drop-shadow-[0_4px_24px_rgba(0,0,0,0.98)]">
              DON’T JUST GET AN ANSWER.<br />
              <span className="text-[#12A5B8] drop-shadow-[0_0_24px_rgba(18,165,184,0.45)]">SEE THE PROOF.</span>
            </h2>

            <p className="font-sans text-lg sm:text-2xl text-[#FFFFFF] font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-[0_4px_18px_rgba(0,0,0,0.98)]">
              Start an auditable satellite investigation across optical, microwave radar, and bi-temporal remote-sensing scenes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs">
              <button
                onClick={() => scrollToSection("hero-section")}
                className="px-6 py-3.5 ios-glass-primary text-[#FFFFFF] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer rounded-md shadow-[0_0_20px_rgba(18,165,184,0.35)]"
              >
                <span>RETURN TO TOP</span>
                <span>↑</span>
              </button>

              <button
                onClick={onOpenLibrary}
                className="px-6 py-3.5 ios-glass-btn text-[#F0F6F8] hover:text-[#FFFFFF] flex items-center gap-2 transition-colors cursor-pointer rounded-md shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
              >
                <Database size={14} className="text-[#12A5B8]" />
                <span>EXPLORE SATELLITE CATALOG</span>
              </button>
            </div>

            <div className="pt-10 border-t border-white/[0.12] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#D0E3EA] font-mono drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <span>INDIAN SPACE RESEARCH ORGANISATION · SPACE TECHNOLOGY</span>
              <span className="text-[#12A5B8] font-semibold">AI ANSWERS. IMAGERY PROVES.</span>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}

export default CinematicLanding;
