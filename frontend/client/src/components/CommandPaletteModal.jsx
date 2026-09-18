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
    { id: "grounding", label: "Switch to Spatial Grounding (GroundingDINO)", icon: Target, action: () => onSelectMode("GROUNDING"), category: "Specialist Tools" },
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-100">
      <div className="bg-[#0D171C] border border-[#1C323B] w-full max-w-xl shadow-[0_24px_64px_rgba(0,0,0,0.95)] overflow-hidden font-mono text-xs rounded-2xl">
        {/* Search Header */}
        <div className="p-3 bg-[#040708] border-b border-[#1C323B] flex items-center gap-3">
          <Search size={15} className="text-[#12A5B8]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (Ctrl+K)..."
            className="w-full bg-transparent border-none outline-none text-[#FFFFFF] placeholder:text-[#8AA3AD] font-sans text-xs"
          />
          <span className="px-1.5 py-0.5 bg-[#132127] border border-[#1C323B] text-[#8AA3AD] text-[9px] rounded-md">ESC</span>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-[#8AA3AD] text-[11px]">
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
                  className="px-3 py-2 flex items-center justify-between hover:bg-[#132127] hover:text-[#FFFFFF] text-[#F0F6F8] cursor-pointer transition-colors rounded-xl group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={14} className="text-[#8AA3AD] group-hover:text-[#12A5B8] transition-colors" />
                    <span className="font-sans text-xs">{cmd.label}</span>
                  </div>
                  <span className="text-[9px] text-[#8AA3AD]/70 uppercase tracking-widest">
                    {cmd.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#040708] border-t border-[#1C323B] flex items-center justify-between text-[9px] text-[#8AA3AD]">
          <span>SATQUERY COMMAND DISPATCHER</span>
          <span className="text-[#12A5B8] font-bold">SIH26167 · ISRO</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPaletteModal;
