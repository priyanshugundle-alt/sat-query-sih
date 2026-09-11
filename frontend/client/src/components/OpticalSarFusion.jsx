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

  const opticalImg = "/satquery-prism-optical.png";
  const sarImg = "/satquery-prism-sar.png";

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* ─── MAIN SENSOR COMPARISON VIEWPORT ─── */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left/Center (Col 1-8): Dual Modality Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          
          <div className="relative w-full bg-[#0B0D0C] border border-[#2A2E2B] overflow-hidden select-none min-h-[440px] md:min-h-[520px] flex items-center justify-center">
            
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
            <div className="absolute top-[32%] left-[38%] w-[26%] h-[28%] border border-[#76AEB0] bg-[#76AEB0]/15 pointer-events-none z-20">
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#76AEB0]" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#76AEB0]" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#76AEB0]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#76AEB0]" />

              <div className="absolute -top-6 left-0 bg-[#0B0D0C]/90 border border-[#76AEB0] px-2 py-0.5 font-mono text-[9px] text-[#76AEB0] font-bold flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-[#76AEB0] rounded-full animate-ping" />
                <span>SAR BACKSCATTER CO-REGISTERED</span>
              </div>
            </div>

            {/* Top-Left Sensor Mode Tag */}
            <div className="absolute top-3 left-3 bg-[#0B0D0C]/85 border border-[#2A2E2B] px-3 py-1 font-mono text-[10px] text-[#E9E5DA] backdrop-blur-sm z-30">
              <span className="text-[#D49A3A] font-bold block">
                {fusionMode === "optical" ? "OPTICAL (SENTINEL-2 MSI)" : fusionMode === "sar" ? "SAR (SENTINEL-1 C-BAND)" : "FUSED CROSS-MODAL VIEW"}
              </span>
              <span className="text-[#9A9A90] text-[9px]">SAME GEOGRAPHIC FOOTPRINT / EPSG:32643</span>
            </div>

            {/* Bottom-Right Cross-Modal Indicator */}
            <div className="absolute bottom-3 right-3 bg-[#0B0D0C]/85 border border-[#76AEB0] px-2.5 py-1 font-mono text-[9px] text-[#76AEB0] backdrop-blur-sm z-30 flex items-center gap-1.5">
              <Radar size={12} />
              <span>RADAR PENETRATION ACTIVE</span>
            </div>

          </div>

          {/* Fusion Controls Bar */}
          <div className="p-3 bg-[#151817] border border-[#2A2E2B] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
            
            {/* View Mode Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFusionMode("optical")}
                className={`px-3 py-1 text-xs border transition-colors ${
                  fusionMode === "optical" ? "bg-[#D49A3A] text-[#0B0D0C] border-[#D49A3A] font-bold" : "bg-[#0B0D0C] text-[#9A9A90] border-[#2A2E2B]"
                }`}
              >
                OPTICAL
              </button>
              <button
                onClick={() => setFusionMode("sar")}
                className={`px-3 py-1 text-xs border transition-colors ${
                  fusionMode === "sar" ? "bg-[#76AEB0] text-[#0B0D0C] border-[#76AEB0] font-bold" : "bg-[#0B0D0C] text-[#9A9A90] border-[#2A2E2B]"
                }`}
              >
                SAR RADAR
              </button>
              <button
                onClick={() => setFusionMode("fused")}
                className={`px-3 py-1 text-xs border transition-colors ${
                  fusionMode === "fused" ? "bg-[#E4B65A] text-[#0B0D0C] border-[#E4B65A] font-bold" : "bg-[#0B0D0C] text-[#9A9A90] border-[#2A2E2B]"
                }`}
              >
                FUSED ⊙
              </button>
            </div>

            {/* Blend Slider (When Fused) */}
            {fusionMode === "fused" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[10px] text-[#D49A3A]">OPTICAL</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={blendOpacity}
                  onChange={(e) => setBlendOpacity(Number(e.target.value))}
                  className="w-32 accent-[#76AEB0] cursor-pointer"
                />
                <span className="text-[10px] text-[#76AEB0]">SAR</span>
              </div>
            )}

          </div>

        </div>

        {/* Right (Col 9-12): Cross-Modal Natural Language Query Panel */}
        <div className="lg:col-span-4 flex flex-col justify-between p-5 bg-[#151817] border border-[#2A2E2B]">
          
          <div className="space-y-4">
            
            {/* Header / Query */}
            <div>
              <div className="font-mono text-[9px] text-[#76AEB0] uppercase font-bold tracking-widest mb-1">
                MULTIMODAL QUERY / FUSION
              </div>
              <div className="text-sm font-bold text-[#F3F0E8]">
                "Does the structure identified in the optical image have corresponding SAR evidence?"
              </div>
            </div>

            {/* Scientific Cross-Modal Findings */}
            <div className="space-y-2.5 pt-3 border-t border-[#2A2E2B] font-mono text-xs">
              
              <div className="p-2.5 bg-[#0B0D0C] border-l-2 border-[#D49A3A]">
                <div className="text-[9px] font-bold text-[#D49A3A] uppercase tracking-wider mb-0.5">
                  OPTICAL EVIDENCE
                </div>
                <div className="font-sans text-xs text-[#E9E5DA] leading-relaxed">
                  Visible surface geometry and roof footprint identified in Sentinel-2 multispectral band composite.
                </div>
              </div>

              <div className="p-2.5 bg-[#0B0D0C] border-l-2 border-[#76AEB0]">
                <div className="text-[9px] font-bold text-[#76AEB0] uppercase tracking-wider mb-0.5">
                  SAR EVIDENCE
                </div>
                <div className="font-sans text-xs text-[#E9E5DA] leading-relaxed">
                  Distinct double-bounce microwave dielectric reflection in C-Band VV polarization confirms reinforced physical structure.
                </div>
              </div>

            </div>

            {/* Verification Metadata */}
            <div className="pt-2 border-t border-[#2A2E2B] space-y-1.5 font-mono text-[10px]">
              <div className="flex justify-between py-0.5">
                <span className="text-[#9A9A90]">CROSS-MODAL SUPPORT</span>
                <span className="text-[#68745C] font-bold">CONFIRMED (AVAILABLE)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#9A9A90]">MODEL CONFIDENCE</span>
                <span className="text-[#E4B65A] font-bold">92.8% (CALIBRATED)</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#9A9A90]">TARGET ENGINE</span>
                <span className="text-[#76AEB0]">OpticalSAR-Fusion (EarthGPT)</span>
              </div>
            </div>

          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-[#2A2E2B] mt-4">
            <button
              onClick={() => onInvestigateInWorkstation && onInvestigateInWorkstation({
                query: "Corroborate optical structure with SAR radar scene.",
                mode: "FUSION"
              })}
              className="w-full py-2 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <span>RUN FUSION INVESTIGATION</span>
              <span>↗</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

export default OpticalSarFusion;
