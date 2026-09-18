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
import { AuthModal } from "./AuthModal";

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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("satquery_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleOpenAuth = (mode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem("satquery_user");
    } catch {}
  };

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

        {/* Navigation & Action Controls: Sign Up, Log In & Ask Query */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 ios-glass-card border border-white/[0.1] rounded-md font-mono text-xs flex items-center gap-2 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                <span className="text-[#FFFFFF] font-bold">{currentUser.name}</span>
                <span className="text-[#8AA3AD] text-[10px] hidden md:inline">({currentUser.role})</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1.5 ios-glass-btn text-[#8AA3AD] hover:text-[#B9654D] text-xs font-mono rounded-md transition-colors cursor-pointer"
                title="Log Out"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <>
              {/* Log In Button */}
              <button
                id="login-header-btn"
                onClick={() => handleOpenAuth("login")}
                className="px-3.5 py-1.5 ios-glass-btn hover:bg-white/[0.08] text-[#D0E3EA] hover:text-[#FFFFFF] text-xs font-mono font-medium rounded-md transition-all cursor-pointer"
              >
                LOG IN
              </button>

              {/* Sign Up Button */}
              <button
                id="signup-header-btn"
                onClick={() => handleOpenAuth("signup")}
                className="px-3.5 py-1.5 bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] hover:border-[#12A5B8]/50 text-[#FFFFFF] text-xs font-mono font-semibold rounded-md transition-all cursor-pointer shadow-sm"
              >
                SIGN UP
              </button>
            </>
          )}

          {/* Primary Workstation CTA */}
          <button
            id="ask-query-header-btn"
            onClick={() => handleLaunchWorkstation()}
            className="px-4 py-2 ios-glass-primary active:scale-95 text-[#FFFFFF] font-bold text-xs tracking-wider rounded-md flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(18,165,184,0.3)]"
          >
            <span>ASK QUERY</span>
            <span className="text-sm leading-none">↗</span>
          </button>
        </div>

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
            07 TECHNICAL SIGNAL — REMOTE-SENSING INPUT & AGENTIC ROUTING
            ════════════════════════════════════════════════════════════════ */}
        <section
          id="technical-section"
          className="min-h-screen flex flex-col justify-center px-6 md:px-14 lg:px-20 py-20 pointer-events-none"
        >
          <div className="max-w-7xl w-full mx-auto space-y-8 pointer-events-auto">
            
            {/* Section Header */}
            <div className="border border-white/[0.08] pb-4 ios-glass-card p-4 sm:p-5 rounded-xl">
              <div className="font-mono text-[10px] sm:text-[11px] text-[#12A5B8] uppercase tracking-[0.16em] font-bold">
                07 / TECHNICAL SIGNAL
              </div>
              <h2 className="font-heading font-sora text-[clamp(34px,4.2vw,62px)] font-bold text-[#FFFFFF] tracking-tight mt-1 leading-[1.0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                REMOTE-SENSING PIPELINE.
              </h2>
              <p className="font-sans text-sm sm:text-base text-[#D0E3EA] max-w-2xl mt-2 leading-relaxed">
                Deterministic agentic orchestration routing natural language inquiries to calibrated vision-language adapters.
              </p>
            </div>

            {/* 1. Architecture Flow Pipeline */}
            <div className="p-6 ios-glass-card border border-white/[0.08] rounded-xl">
              <div className="font-mono text-[10px] text-[#12A5B8] uppercase tracking-widest font-bold mb-4">
                AGENTIC TASK ROUTING FLOW
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono text-xs">
                {[
                  { step: "01", title: "QUERY", desc: "Natural Language Ingestion", sub: "User prompt parse", color: "#FFFFFF" },
                  { step: "02", title: "ROUTING", desc: "Intent Classification", sub: "VQA · Ground · Chg · Fuse", color: "#12A5B8" },
                  { step: "03", title: "SPECIALIST", desc: "Adapter Execution", sub: "GeoChat / GroundingDINO", color: "#0E7C8A" },
                  { step: "04", title: "EVIDENCE", desc: "Pixel Localization", sub: "BBox & Diff Raster Masks", color: "#22D3EE" },
                  { step: "05", title: "RESULT", desc: "Calibrated Audit Trace", sub: "SHA-256 Verified Finding", color: "#10B981" },
                ].map((st) => (
                  <div key={st.step} className="p-3.5 bg-[#040708]/80 border border-white/[0.07] flex flex-col justify-between rounded-lg">
                    <div>
                      <span className="text-[9px] text-[#8AA3AD] block">{st.step} · STEP</span>
                      <span className="font-bold text-sm block mt-0.5" style={{ color: st.color }}>{st.title}</span>
                    </div>
                    <div className="pt-3 border-t border-[#1C323B]/60 mt-3 text-[11px]">
                      <div className="text-[#F0F6F8] font-semibold">{st.desc}</div>
                      <div className="text-[#8AA3AD] text-[10px] mt-0.5">{st.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Sensor Compatibility & Validation Benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left (Col 1-6): Sensor Inputs */}
              <div className="lg:col-span-6 p-6 ios-glass-card border border-white/[0.08] flex flex-col justify-between rounded-xl">
                <div>
                  <div className="font-mono text-[10px] text-[#12A5B8] uppercase tracking-widest font-bold mb-2">
                    REMOTE-SENSING SENSOR COMPATIBILITY
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#FFFFFF] mb-3">
                    Multi-Spectral & Radar Constellations
                  </h3>
                  <div className="space-y-2 font-mono text-xs">
                    {[
                      { sensor: "ISRO CARTOSAT-3", spec: "0.28m PAN / 1.12m MX", use: "High-resolution object grounding" },
                      { sensor: "ISRO EOS-04 (RISAT-1A)", spec: "C-Band Synthetic Aperture Radar", use: "All-weather monsoon penetration" },
                      { sensor: "RESOURCESAT-2A", spec: "LISS-IV (5.8m Multi-Spectral)", use: "Agricultural parcel classification" },
                      { sensor: "SENTINEL-1 & SENTINEL-2", spec: "10m MSI + C-Band GRD Dual-Pass", use: "Bi-temporal change & cross-sensor fusion" },
                    ].map((s) => (
                      <div key={s.sensor} className="p-2.5 bg-[#040708]/80 border border-white/[0.07] flex items-center justify-between rounded-lg">
                        <div>
                          <span className="text-[#FFFFFF] font-bold block">{s.sensor}</span>
                          <span className="text-[#8AA3AD] text-[10px]">{s.use}</span>
                        </div>
                        <span className="text-[#12A5B8] text-[10px] font-bold">{s.spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right (Col 7-12): Academic Benchmarks */}
              <div className="lg:col-span-6 p-6 ios-glass-card border border-white/[0.08] flex flex-col justify-between rounded-xl">
                <div>
                  <div className="font-mono text-[10px] text-[#0E7C8A] uppercase tracking-widest font-bold mb-2">
                    BENCHMARK VALIDATION ACCURACY
                  </div>
                  <h3 className="font-sans text-lg font-bold text-[#FFFFFF] mb-3">
                    Calibrated Remote-Sensing Evaluation
                  </h3>
                  <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                    <div className="p-3 bg-[#040708]/80 border border-white/[0.07] rounded-lg">
                      <span className="text-[9px] text-[#8AA3AD] uppercase block">GROUNDING mIoU</span>
                      <span className="text-xl font-bold text-[#12A5B8] block mt-1">82.4%</span>
                      <span className="text-[9px] text-[#8AA3AD]">RSIVQA / DIOR Benchmark</span>
                    </div>
                    <div className="p-3 bg-[#040708]/80 border border-white/[0.07] rounded-lg">
                      <span className="text-[9px] text-[#8AA3AD] uppercase block">CHANGE F1 SCORE</span>
                      <span className="text-xl font-bold text-[#12A5B8] block mt-1">89.1%</span>
                      <span className="text-[9px] text-[#8AA3AD]">LEVIR-CD / S2Looking</span>
                    </div>
                    <div className="p-3 bg-[#040708]/80 border border-white/[0.07] rounded-lg">
                      <span className="text-[9px] text-[#8AA3AD] uppercase block">VQA BLEU-4</span>
                      <span className="text-xl font-bold text-[#22D3EE] block mt-1">94.2%</span>
                      <span className="text-[9px] text-[#8AA3AD]">EarthVQA Benchmark</span>
                    </div>
                    <div className="p-3 bg-[#040708]/80 border border-white/[0.07] rounded-lg">
                      <span className="text-[9px] text-[#8AA3AD] uppercase block">CO-REGISTRATION</span>
                      <span className="text-xl font-bold text-[#10B981] block mt-1">&lt; 0.4 px</span>
                      <span className="text-[9px] text-[#8AA3AD]">Sub-pixel GeoTIFF alignment</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#1C323B] mt-4 flex items-center justify-between text-[10px] text-[#8AA3AD] font-mono">
                  <span>DETERMINISTIC EVALUATION</span>
                  <span className="text-[#12A5B8]">ZERO HALLUCINATION AUDIT</span>
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
          className="min-h-screen flex flex-col justify-center items-center text-center px-6 md:px-16 py-24 pointer-events-none"
        >
          <div className="max-w-3xl mx-auto space-y-6 z-30 pointer-events-auto p-8 md:p-12 rounded-xl ios-glass-card border border-white/[0.1]">
            
            <div className="font-mono text-xs tracking-[0.20em] text-[#12A5B8] uppercase font-bold">
              08 / CALL TO ACTION · SIH26167 · ISRO
            </div>

            <h2 className="font-heading font-sora text-[clamp(38px,5vw,68px)] font-bold text-[#FFFFFF] tracking-tight leading-[1.02] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              DON’T JUST GET AN ANSWER.<br />
              <span className="text-[#12A5B8]">SEE THE PROOF.</span>
            </h2>

            <p className="font-sans text-base sm:text-lg text-[#D0E3EA] max-w-xl mx-auto leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              Start an auditable satellite investigation across optical, microwave radar, and bi-temporal remote-sensing scenes.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs">
              <button
                onClick={() => scrollToSection("hero-section")}
                className="px-6 py-3.5 ios-glass-primary text-[#FFFFFF] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer rounded-md shadow-[0_0_15px_rgba(18,165,184,0.25)]"
              >
                <span>RETURN TO TOP</span>
                <span>↑</span>
              </button>

              <button
                onClick={onOpenLibrary}
                className="px-6 py-3.5 ios-glass-btn text-[#F0F6F8] hover:text-[#FFFFFF] flex items-center gap-2 transition-colors cursor-pointer rounded-md"
              >
                <Database size={14} className="text-[#12A5B8]" />
                <span>EXPLORE SATELLITE CATALOG</span>
              </button>
            </div>

            <div className="pt-12 border-t border-[#1C323B]/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-[#8AA3AD] font-mono">
              <span>INDIAN SPACE RESEARCH ORGANISATION · SPACE TECHNOLOGY</span>
              <span>AI ANSWERS. IMAGERY PROVES.</span>
            </div>

          </div>
        </section>

      </div>

      {/* Authentication Modal: Log In & Sign Up Workflows */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem("satquery_user", JSON.stringify(user));
          } catch {}
        }}
      />

    </div>
  );
}

export default CinematicLanding;
