import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Target, Sparkles, CheckCircle2 } from "lucide-react";

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
    { label: "URBAN BUILT-UP", confidence: "91.4%", top: "35%", left: "28%", width: "42%", height: "36%" },
    { label: "PORT INFRASTRUCTURE", confidence: "88.2%", top: "42%", left: "54%", width: "22%", height: "24%" },
  ],
  meta = {
    source: "Proba Satellite / HRC Instrument",
    coords: "19.0760° N, 72.8777° E",
    resolution: "5m GSD Multi-spectral",
    timestamp: "2024-03-14T06:12:45Z",
  },
  onActionClick = null,
}) {
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const [revealed, setRevealed] = useState(false);

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
      <div className="relative border border-white/[0.08] overflow-hidden rounded-xl ios-glass-card flex-shrink-0 flex items-center justify-center select-none w-fit mx-auto lg:mx-0">
        
        {/* Real Satellite Image: Displayed unmagnified and uncropped at natural aspect ratio */}
        <img
          src={imageUrl}
          alt="Satellite Observation"
          className="max-h-[500px] sm:max-h-[540px] w-auto h-auto max-w-full block select-none"
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
                <div className="absolute -top-6 left-0 bg-[#040708]/95 border border-[#12A5B8] px-2 py-0.5 font-mono text-[9px] text-[#FFFFFF] font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm rounded-md">
                  <span>{region.label}</span>
                  <span className="text-[#8AA3AD] font-normal">[{region.confidence}]</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Top-Left Telemetry Overlay */}
        <div className="absolute top-3 left-3 bg-[#040708]/85 border border-white/[0.08] px-3 py-1.5 font-mono text-[10px] text-[#F0F6F8] backdrop-blur-md z-20 rounded-lg shadow-sm">
          <div className="text-[#12A5B8] font-bold tracking-wider">{meta.source}</div>
          <div className="text-[#8AA3AD] text-[9px]">{meta.coords}</div>
        </div>

        {/* Bottom-Right Sweep Controller */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
          <button
            onClick={restartScan}
            className="px-3 py-1.5 bg-[#040708]/85 hover:bg-[#132127] border border-white/[0.1] hover:border-[#12A5B8] font-mono text-[10px] text-[#F0F6F8] transition-all rounded-md cursor-pointer backdrop-blur-md shadow-sm"
          >
            ↻ RE-SCAN
          </button>
        </div>
      </div>

      {/* ─── RIGHT PANEL: DEDICATED FEATURE EXPLANATION OR GROUNDING AUDIT ─── */}
      {taskType === "VQA" ? (
        /* VQA FEATURE EXPLANATION PANEL */
        <div className="flex-1 min-w-0 flex flex-col justify-between p-6 ios-glass-card rounded-xl border border-white/[0.08] space-y-4">
          
          <div className="space-y-3.5">
            {/* Feature Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1C323B]/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
                <span className="font-mono text-[10px] text-[#12A5B8] uppercase font-bold tracking-wider">
                  FEATURE EXPLANATION · VQA
                </span>
              </div>
              <span className="font-mono text-[9px] px-2 py-0.5 rounded-md bg-[#12A5B8]/15 text-[#22D3EE] border border-[#12A5B8]/30">
                GeoChat + UniRS
              </span>
            </div>

            {/* Feature Title & Core Narrative */}
            <div>
              <h3 className="font-heading font-sora text-lg font-bold text-[#FFFFFF] leading-snug">
                Natural Language Geospatial Interrogation
              </h3>
              <p className="font-sans text-xs text-[#D0E3EA] leading-relaxed mt-1.5">
                The Vision Question Answering (VQA) engine enables operators to query complex Earth observation scenes using plain natural language—completely removing the need for manual GIS vectorization, spectral band mathematics, or custom Python scripts.
              </p>
            </div>

            {/* Key Feature Capabilities */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
              <div className="p-2.5 rounded-lg bg-[#040708]/65 border border-white/[0.06]">
                <div className="font-mono text-[9px] text-[#12A5B8] uppercase font-bold tracking-wider mb-1">
                  01 · SCENE UNDERSTANDING
                </div>
                <p className="text-[11px] text-[#8AA3AD] leading-relaxed">
                  Automatic zero-shot classification of urban density, land-cover (LULC), vegetation, and shorelines.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#040708]/65 border border-white/[0.06]">
                <div className="font-mono text-[9px] text-[#12A5B8] uppercase font-bold tracking-wider mb-1">
                  02 · SPATIAL REASONING
                </div>
                <p className="text-[11px] text-[#8AA3AD] leading-relaxed">
                  Correlates coastal geography, logistics docks, road corridors, and structural patterns across the scene.
                </p>
              </div>
            </div>

            {/* Live Interactive Query & Answer Box */}
            <div className="space-y-2 pt-2 border-t border-[#1C323B]/80">
              <div className="p-2.5 rounded-lg bg-[#040708]/75 border border-white/[0.06]">
                <div className="font-mono text-[9px] text-[#12A5B8] uppercase font-bold tracking-wider mb-0.5 flex items-center justify-between">
                  <span>INPUT QUERY</span>
                  <span className="text-[#8AA3AD] font-normal">5m GSD OPTICAL</span>
                </div>
                <div className="text-xs font-semibold text-[#FFFFFF]">
                  "{query}"
                </div>
              </div>

              <AnimatePresence mode="wait">
                {revealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-[#040708]/85 border-l-2 border-[#12A5B8] border-r border-t border-b border-white/[0.06] rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold text-[#12A5B8] uppercase tracking-wider">
                        SATQUERY VLM SYNTHESIS
                      </span>
                      <span className="font-mono text-[9px] text-[#22D3EE] font-bold">94.2% CONFIDENCE</span>
                    </div>
                    <p className="font-sans text-xs text-[#F0F6F8] leading-relaxed">
                      {answer}
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-[#040708]/60 border border-white/[0.06] flex items-center justify-center gap-2 text-[#8AA3AD] text-xs rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A5B8] animate-ping" />
                    <span className="font-mono text-[11px]">Sweeping raster bands & reasoning...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Telemetry & Provenance Footer */}
          <div className="pt-3 border-t border-[#1C323B]/80 flex items-center justify-between font-mono text-[9.5px]">
            <div className="flex items-center gap-2 text-[#D0E3EA]">
              <span className="text-[#8AA3AD]">BACKBONE:</span>
              <span className="text-[#12A5B8] font-bold">GeoChat-VQA (UniRS)</span>
            </div>
            <span className="text-[#8AA3AD]">ISO-19115 PROVENANCE</span>
          </div>

        </div>
      ) : (
        /* GROUNDING / SPATIAL AUDIT PANEL */
        <div className="flex-1 min-w-0 flex flex-col justify-between p-6 ios-glass-card rounded-xl border border-white/[0.08]">
          <div className="space-y-4">
            
            {/* Natural Language Query */}
            <div>
              <div className="font-mono text-[9px] text-[#12A5B8] uppercase font-bold tracking-widest mb-1">
                OBSERVATION QUERY / {taskType}
              </div>
              <div className="text-sm font-semibold text-[#FFFFFF] leading-snug">
                "{query}"
              </div>
            </div>

            {/* Model Analysis State */}
            <div className="pt-3 border-t border-[#1C323B]/80 font-mono text-xs">
              <div className="flex items-center justify-between text-[9px] text-[#8AA3AD] uppercase tracking-wider mb-2">
                <span>SPECIALIST ENGINE</span>
                <span className="text-[#12A5B8]">GroundingDINO (UniRS)</span>
              </div>

              <AnimatePresence mode="wait">
                {revealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="p-3 bg-[#040708]/85 border-l-2 border-[#12A5B8] border-r border-t border-b border-white/[0.06] rounded-lg">
                      <span className="text-[9px] font-bold text-[#12A5B8] block mb-1 uppercase tracking-wider">
                        SPATIAL LOCALIZATION FINDING
                      </span>
                      <p className="font-sans text-xs text-[#F0F6F8] leading-relaxed">
                        {answer}
                      </p>
                    </div>

                    {/* Audit Evidence Breakdown */}
                    <div className="space-y-1.5 text-[10px] pt-1">
                      <div className="flex justify-between py-1 border-b border-[#1C323B]/60">
                        <span className="text-[#8AA3AD]">MODEL CONFIDENCE</span>
                        <span className="text-[#12A5B8] font-bold">91.4% (VERIFIED)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#1C323B]/60">
                        <span className="text-[#8AA3AD]">TARGET LOCALIZATION</span>
                        <span className="text-[#22D3EE]">3 Bounding Sectors</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#1C323B]/60">
                        <span className="text-[#8AA3AD]">CALIBRATION</span>
                        <span className="text-[#0E7C8A]">WGS 84 / GSD 5m</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-[#040708]/60 border border-white/[0.06] flex items-center justify-center gap-2 text-[#8AA3AD] text-xs rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12A5B8] animate-ping" />
                    <span className="font-mono text-[11px]">Observation sweep in progress...</span>
                  </div>
                )}
              </AnimatePresence>
            </div>

          </div>

          {/* Verified Telemetry Status */}
          <div className="pt-4 border-t border-[#1C323B]/80 mt-4 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-2 text-[#12A5B8]">
              <span className="w-2 h-2 rounded-sm bg-[#12A5B8] shadow-[0_0_6px_#12A5B8]" />
              <span className="font-bold tracking-wide">VERIFIED SPATIAL GROUNDING</span>
            </div>
            <span className="text-[#8AA3AD]">ISO-19115 PROVENANCE</span>
          </div>

        </div>
      )}

    </div>
  );
}

export default ObservationSweep;
