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
      <div className="flex-1 relative bg-[#0B0D0C] border border-[#2A2E2B] overflow-hidden min-h-[440px] md:min-h-[520px] flex items-center justify-center group select-none">
        
        {/* Real Satellite Image */}
        <img
          src={imageUrl}
          alt="Satellite Observation"
          className="w-full h-full object-cover md:object-contain max-h-[640px]"
          loading="eager"
        />

        {/* Observation Sweep Thin Amber Scanline */}
        {isScanning && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-20"
            style={{
              left: `${scanProgress * 100}%`,
              width: "1px",
              background: "#D49A3A",
              boxShadow: "0 0 12px 1px rgba(212, 154, 58, 0.4)",
            }}
          >
            {/* Minimal scan indicator tick */}
            <div className="absolute top-4 -left-1.5 w-3 h-3 bg-[#D49A3A] rotate-45" />
            <div className="absolute bottom-4 -left-1.5 w-3 h-3 bg-[#D49A3A] rotate-45" />
          </div>
        )}

        {/* Spatial Grounding Bounding Boxes (Thin Amber Borders) */}
        {revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none z-10"
          >
            {boundingRegions.map((region, idx) => (
              <div
                key={idx}
                className="absolute border border-[#D49A3A] bg-[#D49A3A]/10 transition-all duration-300"
                style={{
                  top: region.top,
                  left: region.left,
                  width: region.width,
                  height: region.height,
                }}
              >
                {/* Corner crosshairs */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#E4B65A]" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#E4B65A]" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#E4B65A]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#E4B65A]" />

                {/* Region Tag */}
                <div className="absolute -top-6 left-0 bg-[#0B0D0C]/90 border border-[#D49A3A] px-2 py-0.5 font-mono text-[9px] text-[#E4B65A] font-bold flex items-center gap-1.5 whitespace-nowrap">
                  <span>{region.label}</span>
                  <span className="text-[#9A9A90] font-normal">[{region.confidence}]</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Top-Left Telemetry Overlay */}
        <div className="absolute top-3 left-3 bg-[#0B0D0C]/85 border border-[#2A2E2B] px-2.5 py-1.5 font-mono text-[10px] text-[#E9E5DA] backdrop-blur-sm z-20">
          <div className="text-[#D49A3A] font-bold tracking-wider">{meta.source}</div>
          <div className="text-[#9A9A90] text-[9px]">{meta.coords}</div>
        </div>

        {/* Bottom-Right Sweep Controller */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
          <button
            onClick={restartScan}
            className="px-2.5 py-1 bg-[#151817]/90 hover:bg-[#1D211F] border border-[#2A2E2B] hover:border-[#D49A3A] font-mono text-[10px] text-[#E9E5DA] transition-colors"
          >
            ↻ RE-SCAN
          </button>
        </div>
      </div>

      {/* ─── TECHNICAL EVIDENCE & VLM ANALYSIS PANEL ─── */}
      <div className="w-full lg:w-96 flex flex-col justify-between p-5 bg-[#151817] border border-[#2A2E2B]">
        <div className="space-y-4">
          
          {/* Natural Language Query */}
          <div>
            <div className="font-mono text-[9px] text-[#D49A3A] uppercase font-bold tracking-widest mb-1">
              OBSERVATION QUERY / {taskType}
            </div>
            <div className="text-sm font-semibold text-[#F3F0E8] leading-snug">
              "{query}"
            </div>
          </div>

          {/* Model Analysis State */}
          <div className="pt-3 border-t border-[#2A2E2B] font-mono text-xs">
            <div className="flex items-center justify-between text-[9px] text-[#9A9A90] uppercase tracking-wider mb-2">
              <span>SPECIALIST ENGINE</span>
              <span className="text-[#68745C]">GeoChat-VQA (UniRS)</span>
            </div>

            <AnimatePresence mode="wait">
              {revealed ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-[#0B0D0C] border-l-2 border-[#D49A3A]">
                    <span className="text-[9px] font-bold text-[#D49A3A] block mb-1 uppercase">
                      SATQUERY VLM ANSWER
                    </span>
                    <p className="font-sans text-xs text-[#E9E5DA] leading-relaxed">
                      {answer}
                    </p>
                  </div>

                  {/* Audit Evidence Breakdown */}
                  <div className="space-y-1.5 text-[10px] pt-1">
                    <div className="flex justify-between py-1 border-b border-[#2A2E2B]">
                      <span className="text-[#9A9A90]">MODEL CONFIDENCE</span>
                      <span className="text-[#E4B65A] font-bold">91.4% (VERIFIED)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2A2E2B]">
                      <span className="text-[#9A9A90]">TARGET LOCALIZATION</span>
                      <span className="text-[#76AEB0]">2 Bounding Sectors</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#2A2E2B]">
                      <span className="text-[#9A9A90]">CALIBRATION</span>
                      <span className="text-[#68745C]">WGS 84 / GSD 5m</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-[#0B0D0C] border border-[#2A2E2B] flex items-center justify-center gap-2 text-[#9A9A90] text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D49A3A] animate-ping" />
                  <span>Observation sweep in progress...</span>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-[#2A2E2B] mt-4">
          <button
            onClick={onActionClick}
            className="w-full py-2 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>INTERROGATE THIS SCENE</span>
            <span>↗</span>
          </button>
        </div>

      </div>

    </div>
  );
}

export default ObservationSweep;
