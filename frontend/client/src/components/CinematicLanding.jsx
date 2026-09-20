import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import PersonalizationModal from "./PersonalizationModal";
import { useLanguage } from "../context/LanguageContext";


/**
 * CinematicLanding (SIH26167 · ISRO · SatQuery AI)
 *
 * LAYOUT SYSTEM:
 * Fixed 3D Earth stays behind all sections.
 * Each section content lives in a SOLID dark panel on the side opposite the Earth.
 * - Earth LEFT  → content panel RIGHT
 * - Earth RIGHT → content panel LEFT
 * - Full-width sections (Technical, CTA) have solid dark backgrounds.
 *
 * Stages / Earth positions:
 *   hero       Earth RIGHT  → panel LEFT
 *   vqa        Earth LEFT   → panel RIGHT
 *   grounding  Earth LEFT   → panel RIGHT
 *   nepal      Earth LEFT   → panel RIGHT
 *   sar        Earth RIGHT  → panel LEFT
 *   evidence   Earth LEFT   → panel RIGHT
 *   technical  Earth LEFT   → full-width solid
 *   final_cta  Earth CENTER → centered panel
 */
export function CinematicLanding({
  onStartInvestigation,
  onOpenLibrary,
  onAttachImagery,
}) {
  const [activeSection, setActiveSection] = useState("hero");
  const [hoveredStep, setHoveredStep] = useState("03"); // Default to 03 SPECIALIST step
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const { currentLanguage } = useLanguage();

  const SPECIALIST_ROUTES = [
    {
      id: "vqa",
      code: "TASK HEAD 01 · VQA",
      title: "BigEarthNet-Tuned VQA Head",
      task: "Visual Question Answering & Land-Cover",
      desc: "Fine-tuned Qwen / RSVQA head parses multi-spectral pixel embeddings to answer natural language queries on land-cover classes, building density, and coastal terrain.",
      sensors: "Sentinel-2 MSI · Cartosat-3 · Landsat-9",
      output: "Grounded Text Answer + Pixel Trace",
      sectionId: "vqa-section",
      color: "#F59E0B",
      mode: "VQA",
      presetQuery: "What type of land cover dominates this region?"
    },
    {
      id: "grounding",
      code: "TASK HEAD 02 · GROUNDING",
      title: "GroundingDINO Referring Head",
      task: "Spatial Referring Expression Bounding Boxes",
      desc: "Translates natural language prompts ('port docks', 'residential clusters') into precise bounding box pixel coordinates over satellite rasters.",
      sensors: "High-Res MX (0.28m - 5m GSD)",
      output: "Normalized Bounding Boxes [x, y, w, h]",
      sectionId: "grounding-section",
      color: "#06B6D4",
      mode: "GROUNDING",
      presetQuery: "Where are the major built-up areas?"
    },
    {
      id: "change",
      code: "TASK HEAD 03 · BI-TEMPORAL",
      title: "CDVQA Bi-Temporal Change Head",
      task: "Pairwise Terrain & Landslide Analysis",
      desc: "Compares co-registered dual-pass acquisitions across timestamps to map landslide scarring, flood extents, and urban expansion.",
      sensors: "Sentinel-2 Dual-Pass GeoTIFF Archives",
      output: "Difference Raster Mask + Affected Area (ha)",
      sectionId: "nepal-section",
      color: "#10B981",
      mode: "CHANGE",
      presetQuery: "Assess landslide damage in Syabru Besi"
    },
    {
      id: "sar",
      code: "TASK HEAD 04 · SAR FUSION",
      title: "Sentinel-1 SAR + Optical Fusion Head",
      task: "Microwave Backscatter & Optical Blending",
      desc: "Fuses Sentinel-1 C-band SAR microwave backscatter with Sentinel-2 optical reflectance to penetrate clouds, monsoon haze, and shadow.",
      sensors: "Sentinel-1 C-Band GRD (VV/VH) + Sentinel-2 MSI",
      output: "Dual-Pol Composite + Radar Double-Bounce",
      sectionId: "fusion-section",
      color: "#8B5CF6",
      mode: "FUSION",
      presetQuery: "Fuse Optical + SAR for cloud-covered area"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const pos = window.scrollY;
      const h = window.innerHeight;
      if (pos < h * 0.75)        setActiveSection("hero");
      else if (pos < h * 1.75)   setActiveSection("vqa");
      else if (pos < h * 2.75)   setActiveSection("grounding");
      else if (pos < h * 3.9)    setActiveSection("nepal");
      else if (pos < h * 4.9)    setActiveSection("sar");
      else if (pos < h * 5.9)    setActiveSection("evidence");
      else if (pos < h * 6.9)    setActiveSection("technical");
      else                        setActiveSection("final_cta");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLaunchWorkstation = (preset = null) => onStartInvestigation(preset);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ─── Shared section-panel class strings ───────────────────────────
  const PANEL = "bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl relative overflow-hidden rounded-xl";
  const PANEL_PAD = "p-6 md:p-8";

  return (
    <div className="relative w-full min-h-screen bg-transparent text-[#E9E5DA] font-sans selection:bg-[#D49A3A] selection:text-[#0B0D0C]">

      {/* ── Deep Space starfield (fixed) ── */}
      <DeepSpaceBackground opacity={1} />

      {/* ── Persistent 3D Earth (fixed, behind everything) ── */}
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

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 h-12 px-6 md:px-12 bg-[#0E1110]/80 backdrop-blur-xl border-b border-[#2A2E2B]/80 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => scrollToSection("hero-section")}
            className="flex items-center gap-2 text-[#F3F0E8] font-bold text-sm hover:text-[#D49A3A] transition-colors cursor-pointer"
          >
            <span className="w-2 h-2 bg-[#D49A3A] shadow-[0_0_8px_#D49A3A]" />
            <span>SATQUERY AI</span>
          </button>
        </div>

        <nav className="hidden lg:flex items-center gap-6 text-[11px] text-[#9A9A90]">
          {[
            { id: "hero-section",      label: "01 EARTH"     },
            { id: "vqa-section",       label: "02 VQA"       },
            { id: "grounding-section", label: "03 GROUNDING" },
            { id: "nepal-section",     label: "04 CHANGE"    },
            { id: "fusion-section",    label: "05 FUSION"    },
            { id: "evidence-section",  label: "06 EVIDENCE"  },
            { id: "technical-section", label: "07 PIPELINE"  },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`hover:text-[#D49A3A] transition-colors cursor-pointer ${
                activeSection === item.id.replace("-section", "") ? "text-[#D49A3A]" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPersonalizationOpen(true)}
            className="px-2.5 py-1.5 bg-[#171B18] border border-[#2A2E2B] hover:border-[#D49A3A] text-[#E9E5DA] hover:text-[#D49A3A] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Change Personalization & Indian Language (27 Languages)"
          >
            <Globe size={13} className="text-[#D49A3A]" />
            <span className="font-sans font-bold text-[#F3F0E8]">{currentLanguage.nativeName}</span>
            <span className="text-[10px] text-[#9A9A90] font-mono">({currentLanguage.code.toUpperCase()})</span>
          </button>

          <button
            onClick={() => handleLaunchWorkstation()}
            className="px-3.5 py-1.5 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span>START INVESTIGATION</span>
            <span>↗</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════
          CHAPTERS — relative z-20 so they sit above fixed Earth (z-10)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-20 flex flex-col">

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            01 HERO — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="hero-section"
          className="min-h-screen flex items-center px-4 md:px-10 lg:px-16 py-16 overflow-hidden"
        >
          <div className="max-w-7xl w-full mx-auto flex items-center">
            {/* Left solid panel — Earth on right so this side is clear */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className={`w-full lg:w-[58%] ${PANEL} ${PANEL_PAD} space-y-5`}
            >
              {/* Eyebrow */}
              <div className="font-mono text-[10px] tracking-[0.20em] text-[#D49A3A] uppercase font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#D49A3A] shadow-[0_0_6px_#D49A3A]" />
                <span>01 / EARTH · REMOTE SENSING VISION-LANGUAGE</span>
              </div>

              {/* Main heading */}
              <div>
                <h1 className="font-sans text-[clamp(46px,5.8vw,86px)] font-bold tracking-tight text-[#F3F0E8] leading-[0.96]">
                  SATQUERY AI
                </h1>
                <div className="font-sans text-[clamp(22px,2.6vw,38px)] font-extrabold text-[#F3F0E8] tracking-tight leading-tight mt-2">
                  ASK EARTH.<br />
                  <span className="text-[#9A9A90]">UNDERSTAND IT.</span>
                </div>
              </div>

              {/* Description */}
              <p className="font-sans text-sm sm:text-base text-[#C8C3B5] max-w-md leading-relaxed">
                Query satellite imagery in plain language. SatQuery routes your question to the right vision-language specialist and returns a traceable, evidence-backed answer grounded in real pixels.
              </p>

              {/* Quick-test prompt pills */}
              <div className="pt-2 space-y-2 font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                  TEST AN INVESTIGATION ROUTE:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "🔍 Land Cover VQA", target: "vqa-section" },
                    { label: "🎯 Built-Up Grounding", target: "grounding-section" },
                    { label: "🕒 Nepal Landslide Change", target: "nepal-section" },
                    { label: "📡 Optical + SAR Fusion", target: "fusion-section" }
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => scrollToSection(p.target)}
                      className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-slate-300 hover:text-amber-300 text-xs transition-all cursor-pointer rounded"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2 font-mono text-xs">
                <button
                  onClick={() => scrollToSection("vqa-section")}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20 rounded"
                >
                  <span>EXPLORE OBSERVATION JOURNEY</span>
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => handleLaunchWorkstation()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer rounded font-medium"
                >
                  <span>LAUNCH WORKSTATION</span>
                  <span>↗</span>
                </button>
              </div>

              {/* Stage indicator */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#2A2E2B]">
                {["hero","vqa","grounding","nepal","sar","evidence","technical"].map((s) => (
                  <div
                    key={s}
                    className={`h-[2px] flex-1 transition-all duration-500 ${
                      activeSection === s ? "bg-[#D49A3A]" : "bg-[#2A2E2B]"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#9A9A90]/50 flex flex-col items-center gap-1 animate-pulse pointer-events-none">
            <span>SCROLL TO DESCEND INTO SATELLITE DATA</span>
            <ChevronDown size={13} />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            02 VQA — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="vqa-section"
          className="min-h-screen flex items-start justify-start px-4 md:px-10 lg:px-16 py-16 border-t border-[#2A2E2B]/40"
        >
          <div className={`w-full lg:w-[65%] ${PANEL} ${PANEL_PAD} space-y-6`}>
            {/* Section header */}
            <div className="border-b border-[#2A2E2B] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] text-[#D49A3A] uppercase tracking-[0.18em] font-bold">
                  02 / VQA
                </div>
                <h2 className="font-sans text-[clamp(32px,3.8vw,56px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.0]">
                  ASK THE IMAGE.
                </h2>
                <p className="font-sans text-sm text-[#C8C3B5] max-w-2xl mt-2 leading-relaxed">
                  Submit a natural language question against a single satellite scene. The VQA engine interprets spectral content, identifies land-cover classes, and localises features — all grounded in raw pixel evidence.
                </p>
              </div>
              <div className="font-mono text-[11px] text-[#C8C3B5] flex items-center gap-2 flex-shrink-0">
                <MapPin size={12} className="text-[#D49A3A]" />
                <span>19.0760° N, 72.8777° E · PROBA SATELLITE</span>
              </div>
            </div>

            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="VQA"
              query="What type of land cover dominates this region?"
              answer="Dense urban residential agglomeration flanked by deep-water harbor logistics docks on the eastern bay and high-salinity tidal inlets."
              boundingRegions={[
                { label: "URBAN RESIDENTIAL GRID", confidence: "94.2%", top: "32%", left: "26%", width: "44%", height: "38%" },
                { label: "MARITIME HARBOR",         confidence: "89.6%", top: "44%", left: "56%", width: "24%", height: "26%" },
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            03 GROUNDING — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="grounding-section"
          className="min-h-screen flex items-start justify-start px-4 md:px-10 lg:px-16 py-16 border-t border-[#2A2E2B]/40"
        >
          <div className={`w-full lg:w-[65%] ${PANEL} ${PANEL_PAD} space-y-6`}>
            <div className="border-b border-[#2A2E2B] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] text-[#76AEB0] uppercase tracking-[0.18em] font-bold">
                  03 / GROUNDING
                </div>
                <h2 className="font-sans text-[clamp(32px,3.8vw,56px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  FIND WHAT MATTERS.
                </h2>
                <p className="font-sans text-sm text-[#C8C3B5] max-w-2xl mt-2 leading-relaxed">
                  Point the Grounding engine at a referring expression — "port docks", "residential blocks", "river channel" — and it returns precise bounding-box coordinates over the satellite scene.
                </p>
              </div>
              <div className="font-mono text-[11px] text-[#C8C3B5] flex items-center gap-2 flex-shrink-0">
                <Target size={12} className="text-[#76AEB0]" />
                <span>GROUNDINGDINO / UNIRS ADAPTER</span>
              </div>
            </div>

            <ObservationSweep
              imageUrl="/assets/imagery/mumbai_proba.jpg"
              taskType="GROUNDING"
              query="Where are the major built-up areas?"
              answer="GroundingDINO localized 3 distinct high-density industrial and residential clusters with high confidence (91.4% average agreement)."
              boundingRegions={[
                { label: "BUILT-UP SECTOR A", confidence: "91.4%", top: "28%", left: "30%", width: "24%", height: "22%" },
                { label: "BUILT-UP SECTOR B", confidence: "93.1%", top: "52%", left: "28%", width: "30%", height: "26%" },
                { label: "PORT DOCKS",         confidence: "88.7%", top: "40%", left: "54%", width: "20%", height: "20%" },
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

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            04 BI-TEMPORAL — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="nepal-section"
          className="min-h-screen flex items-start justify-start px-4 md:px-10 lg:px-16 py-16 border-t border-[#2A2E2B]/40"
        >
          <div className={`w-full lg:w-[65%] ${PANEL} ${PANEL_PAD} space-y-6`}>
            <div className="border-b border-[#2A2E2B] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] text-[#D49A3A] uppercase tracking-[0.18em] font-bold">
                  04 / BI-TEMPORAL
                </div>
                <h2 className="font-sans text-[clamp(32px,3.8vw,56px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  SEE WHAT CHANGED.
                </h2>
                <p className="font-sans text-sm text-[#C8C3B5] max-w-2xl mt-2 leading-relaxed">
                  Pair two satellite acquisitions from different dates. The bi-temporal engine maps where and how the terrain changed — landslides, flood extents, urban expansion — and quantifies the affected area.
                </p>
              </div>
              <div className="font-mono text-[11px] text-[#C8C3B5] flex items-center gap-2 flex-shrink-0">
                <Clock size={12} className="text-[#D49A3A]" />
                <span>SYABRU BESI, NEPAL · OCT 2023 ↔ AUG 2026</span>
              </div>
            </div>

            <BiTemporalInvestigator
              onInvestigateInWorkstation={(preset) => handleLaunchWorkstation({
                query: preset.query,
                mode: "CHANGE",
                sampleImage: "/assets/imagery/nepal_2026_08_27.jpg"
              })}
            />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            05 OPTICAL + SAR — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="fusion-section"
          className="min-h-screen flex items-start justify-start px-4 md:px-10 lg:px-16 py-16 border-t border-[#2A2E2B]/40"
        >
          <div className={`w-full lg:w-[65%] ${PANEL} ${PANEL_PAD} space-y-6`}>
            <div className="border-b border-[#2A2E2B] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] text-[#76AEB0] uppercase tracking-[0.18em] font-bold">
                  05 / OPTICAL + SAR
                </div>
                <h2 className="font-sans text-[clamp(32px,3.8vw,56px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.02]">
                  SEE BEYOND ONE SENSOR.
                </h2>
                <p className="font-sans text-sm text-[#C8C3B5] max-w-2xl mt-2 leading-relaxed">
                  Fuse optical reflectance with SAR microwave backscatter to interrogate the same location under cloud cover or at night. Structural features confirmed by double-bounce radar cannot be fabricated by optical artefacts.
                </p>
              </div>
              <div className="font-mono text-[11px] text-[#C8C3B5] flex items-center gap-2 flex-shrink-0">
                <Radar size={12} className="text-[#76AEB0]" />
                <span>SENTINEL-1 C-BAND + SENTINEL-2 MSI</span>
              </div>
            </div>

            <OpticalSarFusion
              onInvestigateInWorkstation={(preset) => handleLaunchWorkstation({
                query: preset.query,
                mode: "FUSION",
                sampleImage: "/satquery-prism-optical.png"
              })}
            />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            06 EVIDENCE — Earth RIGHT → panel LEFT
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="evidence-section"
          className="min-h-screen flex items-start justify-start px-4 md:px-10 lg:px-16 py-16 border-t border-[#2A2E2B]/40"
        >
          <div className={`w-full lg:w-[65%] ${PANEL} ${PANEL_PAD} space-y-6`}>
            <div className="border-b border-[#2A2E2B] pb-4">
              <div className="font-mono text-[10px] text-[#D49A3A] uppercase tracking-[0.18em] font-bold">
                06 / EVIDENCE
              </div>
              <h2 className="font-sans text-[clamp(32px,3.8vw,56px)] font-bold text-[#F3F0E8] tracking-tight mt-1 leading-[1.0]">
                SEE THE PROOF.
              </h2>
              <p className="font-sans text-sm text-[#C8C3B5] max-w-xl mt-2 leading-relaxed">
                Every answer is tethered to the pixel evidence that produced it. Coordinates, timestamps, sensor IDs and model confidence are auditable at every step — not an afterthought.
              </p>
            </div>

            <EvidenceProofMatrix
              onInvestigatePreset={(preset) => handleLaunchWorkstation(preset)}
            />
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            07 TECHNICAL — full-width dark section (Earth fades)
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="technical-section"
          className="min-h-screen flex flex-col justify-center px-4 md:px-10 lg:px-16 py-20 border-t border-[#2A2E2B]/40 bg-[#0E1110]/75 backdrop-blur-xl"
        >
          <div className="max-w-7xl w-full mx-auto space-y-8">

            {/* Header */}
            <div className="border-b border-slate-800 pb-5">
              <div className="font-mono text-xs text-amber-400 uppercase tracking-widest font-semibold">
                07 / SYSTEM ARCHITECTURE &amp; PIPELINE
              </div>
              <h2 className="font-sans text-3xl md:text-5xl font-extrabold text-white tracking-tight mt-1">
                AGENTIC ORCHESTRATION PIPELINE
              </h2>
              <p className="font-sans text-sm sm:text-base text-slate-300 max-w-3xl mt-2 leading-relaxed">
                A deterministic Java AgentController coordinates query classification, GeoTIFF constraint validation, and tool registry selection before dispatching payloads to Python shared vision-language task heads.
              </p>
            </div>

            {/* Agentic pipeline flow with interactive Specialist Hover Pop-up */}
            <div className={`${PANEL} p-6 space-y-5`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="font-mono text-xs text-amber-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>AGENTIC ORCHESTRATION LOOP</span>
                </div>
                <div className="font-mono text-xs text-slate-400">
                  HOVER OR CLICK ANY STEP TO INSPECT PIPELINE HANDLERS &amp; TASK HEADS
                </div>
              </div>

              {/* 5-Step Pipeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 font-mono text-xs">
                {[
                  { step: "01", title: "CLASSIFY",     desc: "QueryClassifier.java",       sub: "Natural Prompt & Image Count Parse",       color: "#FFFFFF" },
                  { step: "02", title: "VALIDATE",     desc: "InputValidator.java",       sub: "GeoTIFF Format & Geo-Overlap Check",      color: "#F59E0B" },
                  { step: "03", title: "ORCHESTRATE", desc: "HandlerFactory.java",       sub: "Dynamic Tool Registry Handler Selection",  color: "#06B6D4" },
                  { step: "04", title: "AI BACKEND",   desc: "FastAPI Shared Brain",       sub: "BigEarthNet Qwen + PyTorch Task Heads",    color: "#10B981" },
                  { step: "05", title: "AUDIT TRACE",  desc: "AgentController.java",      sub: "SHA-256 Execution Log & GeoTIFF Display", color: "#8B5CF6" },
                ].map((st, i) => {
                  const isActive = hoveredStep === st.step;
                  return (
                    <div
                      key={st.step}
                      onMouseEnter={() => setHoveredStep(st.step)}
                      onClick={() => setHoveredStep(st.step)}
                      className={`p-4 bg-slate-900/90 backdrop-blur-sm border transition-all duration-300 flex flex-col justify-between relative cursor-pointer group rounded-lg ${
                        isActive
                          ? "border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-slate-800/90"
                          : "border-slate-800 hover:border-amber-400/60"
                      }`}
                    >
                      {/* Arrow connector */}
                      {i < 4 && (
                        <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-slate-600 font-mono text-sm">
                          →
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 block font-semibold">{st.step} · PHASE</span>
                          {(st.step === "02" || st.step === "03" || st.step === "04") && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40 rounded">
                              HANDLER
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-sm block mt-1.5" style={{ color: st.color }}>
                          {st.title}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-slate-800 mt-3 text-xs">
                        <div className="text-slate-200 font-semibold group-hover:text-amber-400 transition-colors">
                          {st.desc}
                        </div>
                        <div className="text-slate-400 text-xs mt-1 leading-snug">{st.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Interactive Pop-up Drawer showing Active Specialist Models */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="pt-4 border-t border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu size={14} className="text-cyan-400" />
                      <span className="font-bold text-white uppercase tracking-wide">
                        PYTORCH TASK HEADS &amp; TOOL HANDLER REGISTRY
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      4 REGISTERED SPECIALIST HANDLERS
                    </span>
                  </div>

                  {/* 4 Specialist Route Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono text-xs">
                    {SPECIALIST_ROUTES.map((spec) => (
                      <div
                        key={spec.id}
                        className="p-4 bg-slate-900/90 border border-slate-800 hover:border-cyan-400/80 transition-all flex flex-col justify-between gap-3 group relative overflow-hidden rounded-lg"
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: spec.color }}
                        />
                        <div className="space-y-1.5">
                          <div
                            className="text-xs font-bold uppercase tracking-wider"
                            style={{ color: spec.color }}
                          >
                            {spec.code}
                          </div>
                          <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {spec.title}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                            {spec.desc}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-800">
                          <div className="text-xs text-slate-400">
                            <span className="text-slate-200 font-semibold">SENSORS:</span> {spec.sensors}
                          </div>
                          <div className="text-xs text-slate-400">
                            <span className="text-slate-200 font-semibold">OUTPUT:</span> {spec.output}
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => scrollToSection(spec.sectionId)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 hover:text-amber-400 transition-colors flex items-center gap-1 cursor-pointer flex-1 justify-center rounded"
                            >
                              <span>DEMO</span>
                              <span>↓</span>
                            </button>
                            <button
                              onClick={() =>
                                handleLaunchWorkstation({
                                  query: spec.presetQuery,
                                  mode: spec.mode,
                                })
                              }
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/40 text-xs text-amber-400 font-bold transition-colors flex items-center gap-1 cursor-pointer flex-1 justify-center rounded"
                            >
                              <span>RUN</span>
                              <span>↗</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sensor + Benchmarks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Sensor Compatibility */}
              <div className={`${PANEL} p-6`}>
                <div className="font-mono text-xs text-cyan-400 uppercase tracking-widest font-semibold mb-2">
                  REMOTE-SENSING SENSOR COMPATIBILITY
                </div>
                <h3 className="font-sans text-xl font-bold text-white mb-4">
                  Multi-Spectral &amp; Radar Constellations
                </h3>
                <div className="space-y-2.5 font-mono text-xs">
                  {[
                    { sensor: "SENTINEL-2 MSI",         spec: "10m Band B2, B3, B4, B8, B11, B12",    use: "Multi-spectral land cover & VQA"          },
                    { sensor: "SENTINEL-1 SAR",         spec: "C-Band Synthetic Aperture Radar",      use: "All-weather monsoon VV/VH dual-pol"        },
                    { sensor: "ISRO CARTOSAT-3",        spec: "0.28m PAN / 1.12m MX",                 use: "High-resolution referring expression"     },
                    { sensor: "RESOURCESAT-2A / L9",    spec: "LISS-IV (5.8m) & OLI-2 (15m)",         use: "Bi-temporal change & agricultural parcel" },
                  ].map((s) => (
                    <div key={s.sensor} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
                      <div>
                        <span className="text-white font-bold block text-sm">{s.sensor}</span>
                        <span className="text-slate-400 text-xs">{s.use}</span>
                      </div>
                      <span className="text-amber-400 text-xs font-semibold shrink-0 text-right">{s.spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmarks */}
              <div className={`${PANEL} p-6`}>
                <div className="font-mono text-xs text-emerald-400 uppercase tracking-widest font-semibold mb-2">
                  SYSTEM BENCHMARK EVALUATION
                </div>
                <h3 className="font-sans text-xl font-bold text-white mb-4">
                  Calibrated Remote-Sensing Evaluation
                </h3>
                <div className="grid grid-cols-2 gap-3.5 font-mono text-xs">
                  {[
                    { label: "INTENT ROUTING ACCURACY", value: "100%",     color: "#06B6D4", note: "QueryClassifier.java test suite"    },
                    { label: "TASK HEAD PASS RATE",      value: "100%",     color: "#F59E0B", note: "RSVQA & VRSBench validation split" },
                    { label: "MEAN MODEL CONFIDENCE",    value: "74.96%",   color: "#10B981", note: "Calibrated remote-sensing patches"  },
                    { label: "ORCHESTRATION LATENCY",    value: "11.8 ms",  color: "#8B5CF6", note: "Java AgentController p50 latency"  },
                  ].map((m) => (
                    <div key={m.label} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg">
                      <span className="text-xs text-slate-400 uppercase block font-medium">{m.label}</span>
                      <span className="text-2xl font-extrabold block mt-1" style={{ color: m.color }}>{m.value}</span>
                      <span className="text-xs text-slate-400 mt-1 block">{m.note}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>DETERMINISTIC EVALUATION</span>
                  <span className="text-amber-400 font-semibold">VERIFIED BENCHMARKS</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            08 CTA — Earth centered → centered panel
            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          id="final-section"
          className="min-h-screen flex flex-col justify-center items-center text-center px-4 md:px-16 py-24 border-t border-[#2A2E2B]/40"
        >
          <div className={`max-w-2xl w-full ${PANEL} ${PANEL_PAD} space-y-6 mx-auto`}>

            <div className="font-mono text-xs tracking-[0.20em] text-[#D49A3A] uppercase font-bold">
              08 / CALL TO ACTION
            </div>

            <h2 className="font-sans text-[clamp(34px,4.5vw,62px)] font-bold text-[#F3F0E8] tracking-tight leading-[1.02]">
              DON'T JUST GET AN ANSWER.<br />
              <span className="text-[#D49A3A]">SEE THE PROOF.</span>
            </h2>

            <p className="font-sans text-sm sm:text-base text-[#C8C3B5] leading-relaxed">
              Upload your satellite imagery, type your question, and watch SatQuery route it to the right specialist model — VQA, Grounding, Change Detection, or SAR Fusion — and return a finding you can verify pixel by pixel.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono text-xs pt-2">
              <button
                onClick={() => handleLaunchWorkstation()}
                className="px-8 py-3.5 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-lg w-full sm:w-auto justify-center"
              >
                <span>START INVESTIGATION</span>
                <span>↗</span>
              </button>
              <button
                onClick={onOpenLibrary}
                className="px-6 py-3.5 bg-[#151817] hover:bg-[#1D211F] border border-[#2A2E2B] text-[#E9E5DA] flex items-center gap-2 transition-colors cursor-pointer w-full sm:w-auto justify-center"
              >
                <Database size={14} className="text-[#D49A3A]" />
                <span>EXPLORE SATELLITE CATALOG</span>
              </button>
            </div>

          </div>
        </section>

      </div>

      {/* Personalization & Language Modal */}
      <PersonalizationModal
        isOpen={personalizationOpen}
        onClose={() => setPersonalizationOpen(false)}
      />
    </div>
  );
}

export default CinematicLanding;
