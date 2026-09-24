import React, { useState, useEffect } from "react";
import { X, Sliders, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function SettingsModal({ isOpen, onClose }) {
  const [modelAdapter, setModelAdapter] = useState("unirs-geochat");
  const [confidenceCutoff, setConfidenceCutoff] = useState(75);
  const [crsProjection, setCrsProjection] = useState("EPSG:4326");
  const [enableDefenseAudit, setEnableDefenseAudit] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    toast.success("Settings saved successfully");
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#0D171C] dark:bg-[#0D171C] light:bg-white border border-[#1C323B] dark:border-[#1C323B] light:border-[#CBD5E1] w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden font-mono text-xs rounded-2xl"
        >
          {/* Header */}
          <div className="p-4 bg-[#080E11] dark:bg-[#080E11] light:bg-[#F8FAFC] border-b border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sliders size={16} className="text-[#12A5B8] light:text-[#0E7C8A]" />
              <h2 className="text-xs font-bold text-[#FFFFFF] dark:text-[#FFFFFF] light:text-[#0F172A] tracking-wide uppercase">
                SATQUERY SYSTEM CONFIGURATION
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8AA3AD] light:text-[#64748B] hover:text-[#FFFFFF] light:hover:text-[#0F172A] hover:bg-[#132127] light:hover:bg-[#E2E8F0] transition-colors rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Settings Body */}
          <div className="p-5 space-y-4">
            {/* Vision-Language Specialist Model Engine */}
            <div>
              <label className="block text-[#8AA3AD] light:text-[#475569] uppercase text-[10px] font-bold mb-1.5 tracking-wider">
                VISION-LANGUAGE INFERENCE ADAPTER
              </label>
              <div className="space-y-2">
                {[
                  { id: "unirs-geochat", name: "UniRS + GeoChat-VQA (Recommended)", desc: "Specialized multi-spectral remote-sensing vision backbone" },
                  { id: "grounding-dino", name: "GeoChat-Grounding + Qwen2-VL", desc: "Pixel-accurate zero-shot bounding box detector" },
                  { id: "cdvqa-siamese", name: "CDVQA-Siamese Bi-Temporal Network", desc: "Dual-pass temporal change subtraction" },
                ].map((m) => {
                  const isSelected = modelAdapter === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setModelAdapter(m.id)}
                      className={`p-3 border cursor-pointer transition-all rounded-xl ${
                        isSelected
                          ? "bg-[#0B4F58]/30 dark:bg-[#0B4F58]/30 light:bg-[#E0F2FE] border-[#12A5B8] dark:border-[#12A5B8] light:border-[#0284C7]"
                          : "bg-[#080E11] dark:bg-[#080E11] light:bg-[#F8FAFC] border-[#1C323B] dark:border-[#1C323B] light:border-[#CBD5E1] hover:border-[#12A5B8]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-[11px] ${
                          isSelected 
                            ? "text-[#FFFFFF] dark:text-[#FFFFFF] light:text-[#0284C7]" 
                            : "text-[#F0F6F8] dark:text-[#F0F6F8] light:text-[#0F172A]"
                        }`}>
                          {m.name}
                        </span>
                        {isSelected && <Check size={14} className="text-[#12A5B8] light:text-[#0284C7]" />}
                      </div>
                      <div className={`text-[10px] font-sans mt-0.5 ${
                        isSelected 
                          ? "text-[#12A5B8] dark:text-[#12A5B8] light:text-[#0369A1]" 
                          : "text-[#8AA3AD] dark:text-[#8AA3AD] light:text-[#64748B]"
                      }`}>
                        {m.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Minimum Confidence Cutoff */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#8AA3AD] light:text-[#475569] uppercase text-[10px] font-bold tracking-wider">
                  MINIMUM CONFIDENCE FILTER
                </label>
                <span className="text-[#12A5B8] light:text-[#0E7C8A] font-bold">{confidenceCutoff}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={confidenceCutoff}
                onChange={(e) => setConfidenceCutoff(Number(e.target.value))}
                className="w-full accent-[#12A5B8] light:accent-[#0E7C8A] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-[#8AA3AD] light:text-[#64748B] mt-1 font-sans">
                <span>50% (Permissive)</span>
                <span>75% (Balanced)</span>
                <span>95% (Defense Critical)</span>
              </div>
            </div>

            {/* Coordinate Reference System */}
            <div>
              <label className="block text-[#8AA3AD] light:text-[#475569] uppercase text-[10px] font-bold mb-1.5 tracking-wider">
                COORDINATE REFERENCE SYSTEM (CRS)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "EPSG:4326", label: "WGS 84 (EPSG:4326)", detail: "Decimal Degrees" },
                  { id: "EPSG:32643", label: "UTM Zone 43N (EPSG:32643)", detail: "Meters (Projected Grid)" },
                ].map((c) => {
                  const isSelected = crsProjection === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setCrsProjection(c.id)}
                      className={`p-2.5 border cursor-pointer text-center rounded-xl transition-all ${
                        isSelected
                          ? "bg-[#0B4F58]/30 dark:bg-[#0B4F58]/30 light:bg-[#E0F2FE] border-[#12A5B8] dark:border-[#12A5B8] light:border-[#0284C7] font-bold text-[#12A5B8] light:text-[#0284C7]"
                          : "bg-[#080E11] dark:bg-[#080E11] light:bg-[#F8FAFC] border-[#1C323B] dark:border-[#1C323B] light:border-[#CBD5E1] text-[#8AA3AD] light:text-[#475569]"
                      }`}
                    >
                      <div className="text-[11px]">{c.label}</div>
                      <div className="text-[9px] opacity-75 mt-0.5 font-sans">{c.detail}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cryptographic Defense Audit Trace */}
            <div className="flex items-center justify-between p-3 bg-[#080E11] dark:bg-[#080E11] light:bg-[#F8FAFC] border border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] rounded-xl">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-[#12A5B8] light:text-[#0E7C8A]" />
                <div>
                  <div className="font-bold text-[#FFFFFF] dark:text-[#FFFFFF] light:text-[#0F172A] text-[11px]">
                    Cryptographic Defense Audit Trail
                  </div>
                  <div className="text-[10px] text-[#8AA3AD] light:text-[#64748B] font-sans">
                    Sign each analysis output with SHA-256 hash & provenance tag
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableDefenseAudit}
                onChange={(e) => setEnableDefenseAudit(e.target.checked)}
                className="accent-[#12A5B8] light:accent-[#0E7C8A] w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#080E11] dark:bg-[#080E11] light:bg-[#F8FAFC] border-t border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] flex items-center justify-end gap-2.5">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-[#8AA3AD] light:text-[#475569] hover:text-[#FFFFFF] light:hover:text-[#0F172A] font-mono text-xs h-9 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#0E7C8A] hover:bg-[#12A5B8] text-[#FFFFFF] font-mono font-bold text-xs h-9 px-5 shadow-[0_0_15px_rgba(18,165,184,0.3)] transition-all rounded-xl"
            >
              Apply Settings
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default SettingsModal;
