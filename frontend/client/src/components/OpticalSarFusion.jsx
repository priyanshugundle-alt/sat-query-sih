import React, { useState } from "react";
import { motion } from "framer-motion";
import { Radar, Eye, Layers, CheckCircle2, ShieldCheck, Activity } from "lucide-react";

/**
 * OpticalSarFusion — Feature 04: Multimodal Optical + SAR Radar Fusion
 * 
 * Sequence:
 * OPTICAL → SAR → SAME LOCATION → ALIGN → FUSE → EVIDENCE
 * 
 * Demonstrates:
 * - Natural Language Cross-Modal Query
 * - Sensor Cyan (#76AEB0) used sparingly for radar backscatter
 * - Structure validation through cloud/atmospheric scatter
 */
export function OpticalSarFusion({ onInvestigateInWorkstation }) {
  const [fusionMode, setFusionMode] = useState("fused"); // 'optical' | 'sar' | 'fused'
  const [blendOpacity, setBlendOpacity] = useState(50); // 0 (100% optical) to 100 (100% SAR)

  const opticalImg = "/assets/imagery/landcover_sample.jpg";
  const sarImg = "/assets/imagery/landcover_sar_sample.jpg";

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* ─── MAIN SENSOR COMPARISON VIEWPORT ─── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Center (Col 1-8): Dual Modality Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          
          <div className="relative w-full bg-[#080E11] border border-white/[0.08] overflow-hidden select-none min-h-[440px] md:min-h-[520px] flex items-center justify-center rounded-xl ios-glass-card">
            
            {/* Base Layer: Optical Multispectral */}
            <div className="absolute inset-0">
              <img
                src={opticalImg}
                alt="Optical Satellite Observation"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Overlaid Layer: SAR Radar (Blended) */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{
                opacity: fusionMode === "optical" ? 0 : fusionMode === "sar" ? 1 : blendOpacity / 100,
                mixBlendMode: fusionMode === "fused" ? "screen" : "normal",
              }}
            >
              <img
                src={sarImg}
                alt="SAR Synthetic Aperture Radar Observation"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Radar Corroboration Bounding Targets */}
            <div className="absolute top-[32%] left-[38%] w-[26%] h-[28%] border border-[#12A5B8] bg-[#12A5B8]/15 pointer-events-none z-20">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#12A5B8]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#12A5B8]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#12A5B8]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#12A5B8]" />

              <div className="absolute -top-6 left-0 bg-[#080E11]/90 border border-[#12A5B8] px-2 py-0.5 font-mono text-[9px] text-[#12A5B8] font-bold flex items-center gap-1.5 whitespace-nowrap rounded-md">
                <span className="w-1.5 h-1.5 bg-[#12A5B8] rounded-full animate-ping" />
                <span>SAR BACKSCATTER CO-REGISTERED</span>
              </div>
            </div>

            {/* Top-Left Sensor Mode Tag */}
            <div className="absolute top-3 left-3 bg-[#080E11]/85 border border-white/[0.08] px-3 py-1 font-mono text-[10px] text-[#F0F6F8] backdrop-blur-md z-30 rounded-lg shadow-sm">
              <span className="text-[#12A5B8] font-bold block">
                {fusionMode === "optical" ? "OPTICAL (SENTINEL-2 MSI)" : fusionMode === "sar" ? "SAR (SENTINEL-1 C-BAND)" : "FUSED CROSS-MODAL VIEW"}
              </span>
              <span className="text-[#8AA3AD] text-[9px]">SAME GEOGRAPHIC FOOTPRINT / EPSG:32643</span>
            </div>

            {/* Bottom-Right Cross-Modal Indicator */}
            <div className="absolute bottom-3 right-3 bg-[#080E11]/85 border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] text-[#12A5B8] backdrop-blur-md z-30 flex items-center gap-1.5 rounded-lg shadow-sm">
              <Radar size={12} />
              <span>RADAR PENETRATION ACTIVE</span>
            </div>

          </div>

          {/* Fusion Controls Bar */}
          <div className="p-3 ios-glass-card border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs rounded-xl">
            
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFusionMode("optical")}
                className={`px-3 py-1.5 text-xs border transition-all rounded-md cursor-pointer ${
                  fusionMode === "optical" ? "ios-glass-primary text-[#FFFFFF] font-bold shadow-[0_0_10px_rgba(18,165,184,0.3)]" : "bg-[#080E11] text-[#8AA3AD] border-white/[0.1] hover:text-[#FFFFFF]"
                }`}
              >
                OPTICAL
              </button>
              <button
                onClick={() => setFusionMode("sar")}
                className={`px-3 py-1.5 text-xs border transition-all rounded-md cursor-pointer ${
                  fusionMode === "sar" ? "bg-[#0B4F58] text-[#FFFFFF] border-[#12A5B8] font-bold shadow-[0_0_10px_rgba(18,165,184,0.3)]" : "bg-[#080E11] text-[#8AA3AD] border-white/[0.1] hover:text-[#FFFFFF]"
                }`}
              >
                SAR RADAR
              </button>
              <button
                onClick={() => setFusionMode("fused")}
                className={`px-3 py-1.5 text-xs border transition-all rounded-md cursor-pointer ${
                  fusionMode === "fused" ? "bg-[#12A5B8] text-[#040708] border-[#12A5B8] font-bold shadow-[0_0_10px_rgba(18,165,184,0.4)]" : "bg-[#080E11] text-[#8AA3AD] border-white/[0.1] hover:text-[#FFFFFF]"
                }`}
              >
                FUSED ⊙
              </button>
            </div>

            {/* Blend Slider (When Fused) */}
            {fusionMode === "fused" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] text-[#8AA3AD]">OPTICAL</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blendOpacity}
                  onChange={(e) => setBlendOpacity(Number(e.target.value))}
                  className="w-32 accent-[#12A5B8] cursor-pointer"
                />
                <span className="text-[10px] text-[#12A5B8]">SAR</span>
              </div>
            )}

          </div>

        </div>

        {/* Right (Col 9-12): Cross-Modal Natural Language Query Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between p-5 ios-glass-card border border-white/[0.08] rounded-xl">
          
          <div className="space-y-4">
            
            {/* Header / Query */}
            <div>
              <div className="font-mono text-[9px] text-[#12A5B8] uppercase font-bold tracking-widest mb-1">
                MULTIMODAL QUERY / FUSION
              </div>
              <div className="text-sm font-bold text-[#FFFFFF]">
                "Does the structure identified in the optical image have corresponding SAR evidence?"
              </div>
            </div>

            {/* Scientific Cross-Modal Findings */}
            <div className="space-y-2.5 pt-3 border-t border-[#1C323B]/80 font-mono text-xs">
              
              <div className="p-2.5 bg-[#080E11]/80 border border-white/[0.06] border-l-2 border-l-[#12A5B8] rounded-lg">
                <div className="text-[9px] font-bold text-[#12A5B8] uppercase tracking-wider mb-0.5">
                  OPTICAL EVIDENCE
                </div>
                <div className="font-sans text-xs text-[#F0F6F8]">
                  Identified rectangular commercial footprint with high spectral reflectance.
                </div>
              </div>

              <div className="p-2.5 bg-[#080E11]/80 border border-white/[0.06] border-l-2 border-l-[#0E7C8A] rounded-lg">
                <div className="text-[9px] font-bold text-[#0E7C8A] uppercase tracking-wider mb-0.5">
                  SAR RADAR CORROBORATION
                </div>
                <div className="font-sans text-xs text-[#F0F6F8]">
                  C-band backscatter confirms strong metallic corner-reflector dihedral return.
                </div>
              </div>

              <div className="p-2.5 bg-[#080E11]/80 border border-white/[0.06] border-l-2 border-l-[#22D3EE] rounded-lg">
                <div className="text-[9px] font-bold text-[#22D3EE] uppercase tracking-wider mb-0.5">
                  CROSS-SENSOR CONCLUSION
                </div>
                <div className="font-sans text-xs text-[#F0F6F8]">
                  Confirmed permanent industrial structure. Zero shadow or optical artifact.
                </div>
              </div>

            </div>

            {/* Sensor Source Details */}
            <div className="pt-2 border-t border-[#1C323B] space-y-1 font-mono text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#8AA3AD]">OPTICAL PASS</span>
                <span className="text-[#FFFFFF]">Sentinel-2 MSI (10m)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8AA3AD]">RADAR PASS</span>
                <span className="text-[#12A5B8]">Sentinel-1 C-Band SAR (GRD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8AA3AD]">CO-REGISTRATION</span>
                <span className="text-[#22D3EE]">&lt; 0.4 px GeoTIFF Alignment</span>
              </div>
            </div>

            {/* Specialist Engine */}
            <div className="pt-2 border-t border-[#1C323B] flex items-center justify-between font-mono text-[9px] text-[#8AA3AD]">
              <span>SPECIALIST ENGINE</span>
              <span className="text-[#12A5B8]">OpticalSAR-Fusion (EarthGPT)</span>
            </div>

          </div>

          {/* Cross-Sensor Coherence Status */}
          <div className="pt-4 border-t border-[#1C323B] mt-4 flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center gap-2 text-[#12A5B8]">
              <span className="w-2 h-2 rounded-sm bg-[#12A5B8] shadow-[0_0_6px_#12A5B8]" />
              <span className="font-bold tracking-wide">CROSS-SENSOR COHERENCE</span>
            </div>
            <span className="text-[#8AA3AD]">C-BAND + MSI DUAL PASS</span>
          </div>

        </div>

      </div>

    </div>
  );
}

export default OpticalSarFusion;
