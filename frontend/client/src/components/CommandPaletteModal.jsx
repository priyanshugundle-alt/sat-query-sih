import React, { useState, useEffect } from "react";
import { 
  Search, 
  Upload, 
  Database, 
  Eye, 
  Target, 
  Layers, 
  Activity, 
  Maximize2, 
  FileText, 
  Sliders, 
  Globe, 
  X,
  ArrowRight
} from "lucide-react";

export function CommandPaletteModal({
  isOpen,
  onClose,
  onNewInvestigation,
  onUploadClick,
  onOpenLibrary,
  onSelectMode,
  onToggleFocus,
  onOpenReport,
  onOpenSettings,
  onReturnToOrbit,
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: "new", label: "New Spatial Investigation", icon: Search, action: onNewInvestigation, category: "Actions" },
    { id: "upload", label: "Upload Satellite Raster (GeoTIFF / PNG)", icon: Upload, action: onUploadClick, category: "Actions" },
    { id: "catalog", label: "Browse Benchmark Satellite Catalog", icon: Database, action: onOpenLibrary, category: "Actions" },
    { id: "vqa", label: "Switch to Visual QA (GeoChat-VQA)", icon: Eye, action: () => onSelectMode("VQA"), category: "Specialist Tools" },
    { id: "grounding", label: "Switch to Spatial Grounding (GeoChat-Grounding)", icon: Target, action: () => onSelectMode("GROUNDING"), category: "Specialist Tools" },
    { id: "change", label: "Switch to Bi-Temporal Change (CDVQA)", icon: Layers, action: () => onSelectMode("CHANGE"), category: "Specialist Tools" },
    { id: "fusion", label: "Switch to Optical + SAR Fusion (EarthGPT)", icon: Activity, action: () => onSelectMode("FUSION"), category: "Specialist Tools" },
    { id: "focus", label: "Toggle Focus Canvas Mode (88% Viewport)", icon: Maximize2, action: onToggleFocus, category: "View" },
    { id: "report", label: "Generate ISRO / Defense Analysis Report (PDF)", icon: FileText, action: onOpenReport, category: "Outputs" },
    { id: "settings", label: "System & Model Configuration", icon: Sliders, action: onOpenSettings, category: "System" },
    { id: "orbit", label: "Return to Orbit (Cinematic Landing View)", icon: Globe, action: onReturnToOrbit, category: "Navigation" },
  ];

  const filtered = commands.filter(c => 
    c.label.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-100">
      <div className="bg-[#151817] border border-[#2A2E2B] w-full max-w-xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden font-mono text-xs">
        {/* Search Header */}
        <div className="p-3 bg-[#0B0D0C] border-b border-[#2A2E2B] flex items-center gap-3">
          <Search size={15} className="text-[#D49A3A]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (Ctrl+K)..."
            className="w-full bg-transparent border-none outline-none text-[#F3F0E8] placeholder:text-[#9A9A90] font-sans text-xs"
          />
          <span className="px-1.5 py-0.5 bg-[#1D211F] text-[#9A9A90] text-[9px]">ESC</span>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-[#9A9A90] text-[11px]">
              No matching commands found.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className="px-3 py-2 flex items-center justify-between hover:bg-[#1D211F] hover:text-[#D49A3A] text-[#E9E5DA] cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="text-[#9A9A90]" />
                    <span className="font-sans text-xs">{cmd.label}</span>
                  </div>
                  <span className="text-[9px] text-[#9A9A90]/60 uppercase tracking-widest">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#0B0D0C] border-t border-[#2A2E2B] flex items-center justify-between text-[9px] text-[#9A9A90]">
          <span>SATQUERY COMMAND DISPATCHER</span>
          <span className="text-[#D49A3A]">SIH26167 · ISRO</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPaletteModal;
