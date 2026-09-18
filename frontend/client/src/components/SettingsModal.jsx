import React, { useState } from "react";
import { X, Sliders, ShieldCheck, Database, Cpu, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SettingsModal({ isOpen, onClose }) {
  const [modelAdapter, setModelAdapter] = useState("unirs-geochat");
  const [confidenceCutoff, setConfidenceCutoff] = useState(75);
  const [crsProjection, setCrsProjection] = useState("EPSG:4326");
  const [enableDefenseAudit, setEnableDefenseAudit] = useState(true);

  if (!isOpen) return null;

  const handleSave = () => {
    toast.success("Settings saved successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#151817] border border-[#2A2E2B] w-full max-w-lg shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 bg-[#0B0D0C] border-b border-[#2A2E2B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sliders size={16} className="text-[#D49A3A]" />
            <h2 className="text-xs font-bold text-[#F3F0E8] tracking-wide uppercase">
              SATQUERY SYSTEM CONFIGURATION
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 space-y-4">
          {/* Vision-Language Specialist Model Engine */}
          <div>
            <label className="block text-[#9A9A90] uppercase text-[10px] font-bold mb-1.5">
              VISION-LANGUAGE INFERENCE ADAPTER
            </label>
            <div className="space-y-1.5">
              {[
                { id: "unirs-geochat", name: "UniRS + GeoChat-VQA (ISRO Recommended)", desc: "Specialized multi-spectral remote-sensing vision backbone" },
                { id: "grounding-dino", name: "GroundingDINO + Qwen2-VL", desc: "Pixel-accurate zero-shot bounding box detector" },
                { id: "cdvqa-siamese", name: "CDVQA-Siamese Bi-Temporal Network", desc: "Dual-pass temporal change subtraction" },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setModelAdapter(m.id)}
                  className={`p-2.5 border cursor-pointer transition-colors ${
                    modelAdapter === m.id
                      ? "bg-[#D49A3A]/15 border-[#D49A3A] text-[#F3F0E8]"
                      : "bg-[#0B0D0C] border-[#2A2E2B] text-[#9A9A90] hover:border-[#D49A3A]/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-[#F3F0E8]">{m.name}</span>
                    {modelAdapter === m.id && <Check size={13} className="text-[#D49A3A]" />}
                  </div>
                  <div className="text-[10px] text-[#9A9A90] font-sans mt-0.5">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Minimum Confidence Cutoff */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[#9A9A90] uppercase text-[10px] font-bold">
                MINIMUM CONFIDENCE FILTER
              </label>
              <span className="text-[#D49A3A] font-bold">{confidenceCutoff}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={confidenceCutoff}
              onChange={(e) => setConfidenceCutoff(Number(e.target.value))}
              className="w-full accent-[#D49A3A] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#9A9A90] mt-1">
              <span>50% (Permissive)</span>
              <span>75% (Balanced)</span>
              <span>95% (Defense Critical)</span>
            </div>
          </div>

          {/* Coordinate Reference System */}
          <div>
            <label className="block text-[#9A9A90] uppercase text-[10px] font-bold mb-1.5">
              COORDINATE REFERENCE SYSTEM (CRS)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "EPSG:4326", label: "WGS 84 (EPSG:4326)", detail: "Decimal Degrees" },
                { id: "EPSG:32643", label: "UTM Zone 43N (EPSG:32643)", detail: "Meters (ISRO Grid)" },
              ].map((c) => (
                <div
                  key={c.id}
                  onClick={() => setCrsProjection(c.id)}
                  className={`p-2 border cursor-pointer text-center ${
                    crsProjection === c.id
                      ? "bg-[#D49A3A]/15 border-[#D49A3A] text-[#D49A3A] font-bold"
                      : "bg-[#0B0D0C] border-[#2A2E2B] text-[#9A9A90]"
                  }`}
                >
                  <div>{c.label}</div>
                  <div className="text-[9px] opacity-70 mt-0.5 font-sans">{c.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ISRO Defense Audit Trace */}
          <div className="flex items-center justify-between p-3 bg-[#0B0D0C] border border-[#2A2E2B]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#68745C]" />
              <div>
                <div className="font-bold text-[#F3F0E8] text-[11px]">Cryptographic Defense Audit Trail</div>
                <div className="text-[10px] text-[#9A9A90] font-sans">
                  Sign each analysis output with SHA-256 hash & provenance tag
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={enableDefenseAudit}
              onChange={(e) => setEnableDefenseAudit(e.target.checked)}
              className="accent-[#D49A3A] w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0B0D0C] border-t border-[#2A2E2B] flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-[#9A9A90] hover:text-[#F3F0E8] font-mono text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs h-8 px-4 shadow"
          >
            Apply Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
