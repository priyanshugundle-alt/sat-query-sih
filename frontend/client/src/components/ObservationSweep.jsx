import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Target, Sparkles, CheckCircle2, Info } from "lucide-react";

/**
 * ObservationSweep — Signature Scientific Scan Interaction
 * 
 * Features:
 * - A very thin amber line moves across the actual satellite image
 * - When it crosses the target sector:
 *   1. Evidence marker appears
 *   2. Relevant region is emphasized with thin amber boundaries
 *   3. AI Analysis & Answer revealed
 * - No laser effect, no neon, no excessive glow
 */
export function ObservationSweep({
  imageUrl = "/assets/imagery/mumbai_proba.jpg",
  taskType = "VQA", // 'VQA' | 'GROUNDING'
  query = "What type of land cover dominates this region?",
  answer = "Dense built-up urban agglomeration with major port infrastructure along the eastern coastal harbor and high-salinity tidal inlets.",
  boundingRegions = [
    { label: "BUILT-UP SECTOR A", confidence: "91.4%", top: "20%", left: "29%", width: "17.5%", height: "28%" },
    { label: "BUILT-UP SECTOR B", confidence: "93.1%", top: "54%", left: "36.5%", width: "11.5%", height: "28%" },
    { label: "PORT DOCKS", confidence: "88.7%", top: "38%", left: "47.5%", width: "12%", height: "33%" },
  ],
  meta = {
    source: "Proba Satellite / HRC Instrument",
    resolution: "5m GSD Multi-spectral",
    timestamp: "2024-03-14T06:12:45Z",
  },
  featureTitle = null,
  featureDescription = null,
  onActionClick = null,
}) {
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const featureInfo = taskType === "VQA" ? {
    badge: "02 / VISUAL QUESTION ANSWERING",
    title: "Natural Language Earth Intelligence",
    description: "Query satellite rasters using everyday language. The RS-VLM analyzes multispectral bands to understand land use, infrastructure, vegetation, and maritime topography without manual GIS labeling.",
    highlights: ["Zero-Shot RS-VQA", "Multispectral Synthesis", "Deterministic Output"],
    engine: "GeoChat-VQA (UniRS Adapter)",
    targetType: "Global Scene Context",
  } : {
    badge: "03 / SPATIAL TARGET GROUNDING",
    title: "Pixel-Level Evidence Localization",
    description: "Pins answers directly to physical pixels. The model identifies target features mentioned in natural language and draws calibrated bounding boxes with verified confidence scores.",
    highlights: ["Bounding Box Sectors", "Multi-Target Detection", "Spatial Confidence"],
    engine: "GeoChat-Grounding (UniRS Adapter)",
    targetType: "3 Bounding Sectors",
  };

  useEffect(() => {
    let startTime = Date.now();
    const duration = 2800; // 2.8s smooth sweep

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setScanProgress(progress);

      if (progress >= 0.55 && !revealed) {
        setRevealed(true);
      }

      if (progress >= 1) {
        setIsScanning(false);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [revealed]);

  const restartScan = () => {
    setScanProgress(0);
    setRevealed(false);
    setIsScanning(true);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch font-sans">
      
      {/* ─── SATELLITE IMAGE VIEWPORT (PRIMARY VISUAL HERO) ─── */}
      <div className="flex-1 relative bg-[#040708] border border-white/[0.08] overflow-hidden min-h-[460px] lg:min-h-[500px] self-stretch flex items-center justify-center group select-none rounded-xl ios-glass-card">
        
        {/* Real Satellite Image */}
        <img
          src={imageUrl}
          alt="Satellite Observation"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
        />

        {/* Observation Sweep Thin Cyan Scanline */}
        {isScanning && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: `${scanProgress * 100}%`,
              width: "1px",
              background: "#12A5B8",
              boxShadow: "0 0 12px 1px rgba(18, 165, 184, 0.5)",
            }}
          >
            {/* Minimal scan indicator tick */}
            <div className="absolute top-4 -left-1.5 w-3 h-3 bg-[#12A5B8] rotate-45" />
            <div className="absolute bottom-4 -left-1.5 w-3 h-3 bg-[#12A5B8] rotate-45" />
          </div>
        )}

        {/* Spatial Grounding Bounding Boxes (Thin Cyan Borders) - Only for GROUNDING mode */}
        {revealed && taskType !== "VQA" && boundingRegions && boundingRegions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {boundingRegions.map((region, idx) => (
              <div
                key={idx}
                className="absolute border border-[#12A5B8] bg-[#12A5B8]/15 transition-all duration-300"
                style={{
                  top: region.top,
                  left: region.left,
                  width: region.width,
                  height: region.height,
                }}
              >
                {/* Corner crosshairs */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#22D3EE]" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#22D3EE]" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#22D3EE]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#22D3EE]" />

                {/* Region Tag */}
                <div className="absolute -top-6 left-0 bg-[#040708]/95 border border-[#12A5B8] px-2.5 py-0.5 font-mono text-[10px] text-[#FFFFFF] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm rounded-md">
                  <span>{region.label}</span>
                  <span className="text-[#8AA3AD] font-normal">[{region.confidence}]</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Top-Left Telemetry Overlay */}
        <div className="absolute top-3 left-3 bg-[#040708]/90 border border-white/[0.1] px-3.5 py-2 font-mono text-xs text-[#F0F6F8] backdrop-blur-md z-20 rounded-lg shadow-sm">
          <div className="text-[#22D3EE] font-bold tracking-wider">{meta.source}</div>
          {meta.coords && <div className="text-[#8AA3AD] text-[10px] mt-0.5">{meta.coords}</div>}
        </div>

        {/* Bottom-Right Sweep Controller */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
          <button
            onClick={restartScan}
            className="px-3.5 py-2 bg-[#040708]/90 hover:bg-[#132127] border border-white/[0.12] hover:border-[#12A5B8] font-mono text-xs font-semibold text-[#F0F6F8] transition-all rounded-lg cursor-pointer backdrop-blur-md shadow-sm flex items-center gap-1.5"
          >
            ↻ RE-SCAN
          </button>
        </div>
      </div>

      {/* ─── TECHNICAL EVIDENCE & VLM ANALYSIS PANEL ─── */}
      <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between p-5 sm:p-6 ios-glass-card rounded-2xl border border-white/[0.1] shadow-2xl space-y-4 self-stretch">
          
          {/* 1. Feature Identification & Title */}
          <div className="pb-3 border-b border-white/[0.08]">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] shadow-[0_0_10px_#12A5B8]" />
                <span className="font-mono text-xs sm:text-[12.5px] text-[#22D3EE] uppercase font-bold tracking-wider">
                  {featureInfo.badge}
                </span>
              </div>
              <span className="font-mono text-[11px] px-2.5 py-0.5 bg-white/[0.08] text-[#9CB5C1] border border-white/[0.1] rounded-md font-medium tracking-wide">
                SPECIALIST RS-VLM
              </span>
            </div>
            <h3 className="font-heading font-sora text-xl sm:text-2xl font-bold text-[#FFFFFF] tracking-tight leading-tight">
              {featureTitle || featureInfo.title}
            </h3>
          </div>

          {/* 2. Feature Capability Explanation Card */}
          <div className="p-4 bg-[#040708]/60 border border-white/[0.08] rounded-xl space-y-2.5">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8AA3AD] uppercase font-bold tracking-wider">
              <Info size={14} className="text-[#22D3EE]" />
              <span>HOW THIS FEATURE WORKS</span>
            </div>
            <p className="font-sans text-sm sm:text-[14px] text-[#D0E3EA] leading-relaxed">
              {featureDescription || featureInfo.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.08]">
              {featureInfo.highlights.map((hl, idx) => (
                <span
                  key={idx}
                  className="font-mono text-[11px] sm:text-xs px-2.5 py-1 bg-[#12A5B8]/15 text-[#38BDF8] border border-[#12A5B8]/30 rounded-md font-medium"
                >
                  {hl}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Live Interactive Query Box */}
          <div className="p-4 bg-[#040708]/45 border border-white/[0.08] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#22D3EE] font-bold uppercase tracking-wider">
                DEMONSTRATION QUERY
              </span>
              <span className="text-[#9CB5C1] font-mono">{featureInfo.engine}</span>
            </div>
            <div className="text-sm sm:text-base font-semibold text-[#FFFFFF] leading-snug">
              "{query}"
            </div>
          </div>

          {/* 4. Model Analysis & Findings */}
          <div>
            <AnimatePresence mode="wait">
              {revealed ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2.5"
                >
                  <div className="p-4 bg-[#040708]/60 border-l-[3px] border-[#12A5B8] border-r border-t border-b border-white/[0.08] rounded-xl backdrop-blur-md shadow-inner">
                    <span className="text-[11px] sm:text-xs font-bold text-[#22D3EE] block mb-1.5 uppercase tracking-wider font-mono">
                      SATQUERY VLM {taskType === "VQA" ? "ANSWER" : "DETECTED FINDINGS"}
                    </span>
                    <p className="font-sans text-sm sm:text-[14.5px] font-medium text-[#F0F6F8] leading-relaxed">
                      {answer}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-[#040708]/50 border border-white/[0.08] flex items-center justify-center gap-3 text-sm rounded-xl">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] animate-ping" />
                  <span className="font-mono text-xs sm:text-sm text-[#D0E3EA]">
                    Sweeping imagery & synthesizing spatial response...
                  </span>
                </div>
              )}
            </AnimatePresence>
          </div>

      </div>

    </div>
  );
}

export default ObservationSweep;
