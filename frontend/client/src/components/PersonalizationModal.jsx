import React, { useState } from "react";
import { motion, AnimatePresence } from "react"
import { Globe, X, Check, Search, Sparkles, Layers, Sliders, Volume2, ShieldCheck, Compass } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

export default function PersonalizationModal({ isOpen, onClose }) {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [activeTab, setActiveTab] = useState("language");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [themeMode, setThemeMode] = useState("deep-space");
  const [defaultSensor, setDefaultSensor] = useState("sentinel-2a");
  const [defaultCRS, setDefaultCRS] = useState("EPSG:4326");

  if (!isOpen) return null;

  const filteredLanguages = languages.filter((lang) => {
    const matchesSearch =
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.script.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase());

    if (categoryFilter === "SCHEDULED") {
      return matchesSearch && lang.category.includes("Scheduled");
    } else if (categoryFilter === "REGIONAL") {
      return matchesSearch && (lang.category.includes("Regional") || lang.category.includes("Himalayan") || lang.category.includes("North-East"));
    }
    return matchesSearch;
  });

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    toast.success(`Language updated to ${lang.name} (${lang.nativeName})`, {
      description: `SatQuery AI prompt engine and multi-script VQA parsed in ${lang.script}`,
    });
  };

  const handleSpeakSample = (e, promptText) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      toast.info("Synthesizing audio prompt...");
    } else {
      toast.error("Text-to-Speech not supported in browser");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 font-mono">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0E1110]/95 border border-[#2A2E2B] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#E9E5DA]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#2A2E2B] bg-[#141816] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#D49A3A]/10 border border-[#D49A3A]/40 flex items-center justify-center text-[#D49A3A]">
                <Globe size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-wider text-[#F3F0E8] flex items-center gap-2">
                  <span>PERSONALIZATION & PREFERENCES</span>
                  <span className="text-[10px] px-2 py-0.5 bg-[#D49A3A]/15 text-[#D49A3A] border border-[#D49A3A]/30">
                    27 INDIAN LANGUAGES
                  </span>
                </h2>
                <p className="text-[11px] text-[#9A9A90]">
                  Configure multi-script AI prompt parsing, theme aesthetics & spatial sensor defaults
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#2A2E2B] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#2A2E2B] bg-[#0A0D0B] text-xs font-mono">
            <button
              onClick={() => setActiveTab("language")}
              className={`px-5 py-3 flex items-center gap-2 transition-colors cursor-pointer border-r border-[#2A2E2B] ${
                activeTab === "language"
                  ? "bg-[#141816] text-[#D49A3A] font-bold border-b-2 border-b-[#D49A3A]"
                  : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#121514]"
              }`}
            >
              <Globe size={14} />
              <span>01 LANGUAGE & SCRIPT ({languages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("theme")}
              className={`px-5 py-3 flex items-center gap-2 transition-colors cursor-pointer border-r border-[#2A2E2B] ${
                activeTab === "theme"
                  ? "bg-[#141816] text-[#D49A3A] font-bold border-b-2 border-b-[#D49A3A]"
                  : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#121514]"
              }`}
            >
              <Sliders size={14} />
              <span>02 VISUAL THEME</span>
            </button>

            <button
              onClick={() => setActiveTab("sensor")}
              className={`px-5 py-3 flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "sensor"
                  ? "bg-[#141816] text-[#D49A3A] font-bold border-b-2 border-b-[#D49A3A]"
                  : "text-[#9A9A90] hover:text-[#E9E5DA] hover:bg-[#121514]"
              }`}
            >
              <Layers size={14} />
              <span>03 SENSOR & CRS PRESETS</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* TAB 1: LANGUAGE SELECTOR */}
            {activeTab === "language" && (
              <div className="space-y-5">
                {/* Active Selected Banner */}
                <div className="p-4 bg-[#141B18] border border-[#D49A3A]/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-sans font-bold text-[#D49A3A] px-3 py-1 bg-[#D49A3A]/10 border border-[#D49A3A]/30">
                      {currentLanguage.nativeName}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#F3F0E8] flex items-center gap-2">
                        <span>Active Language: {currentLanguage.name}</span>
                        <span className="text-[10px] text-[#D49A3A] font-mono">[{currentLanguage.code.toUpperCase()}]</span>
                      </div>
                      <div className="text-[11px] text-[#9A9A90]">
                        Script: {currentLanguage.script} · Region: {currentLanguage.region}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={(e) => handleSpeakSample(e, currentLanguage.samplePrompt)}
                      className="px-3 py-1.5 bg-[#1E2421] border border-[#2A2E2B] hover:border-[#D49A3A] text-xs text-[#E9E5DA] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Volume2 size={13} className="text-[#D49A3A]" />
                      <span>Audio Preview</span>
                    </button>
                    <div className="px-3 py-1.5 bg-[#D49A3A]/20 text-[#D49A3A] border border-[#D49A3A]/50 text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      <span>ISRO Multi-Lingual Engine Ready</span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141816] p-2 border border-[#2A2E2B]">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9A9A90]" />
                    <input
                      type="text"
                      placeholder="Search language name, script (Devanagari, Ol Chiki, Bengali...), or region..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0E1110] border border-[#2A2E2B] pl-9 pr-3 py-1.5 text-xs text-[#E9E5DA] placeholder:text-[#9A9A90] focus:outline-none focus:border-[#D49A3A]"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    {[
                      { id: "ALL", label: `ALL (${languages.length})` },
                      { id: "SCHEDULED", label: "SCHEDULED 22" },
                      { id: "REGIONAL", label: "N-EAST & HILLS" },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setCategoryFilter(btn.id)}
                        className={`px-3 py-1.5 transition-colors cursor-pointer border ${
                          categoryFilter === btn.id
                            ? "bg-[#D49A3A] text-[#0B0D0C] border-[#D49A3A] font-bold"
                            : "bg-[#0E1110] text-[#9A9A90] border-[#2A2E2B] hover:text-[#E9E5DA]"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of 27 Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLanguages.map((lang) => {
                    const isSelected = currentLanguage.id === lang.id;
                    return (
                      <motion.div
                        key={lang.id}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSelectLanguage(lang)}
                        className={`p-3.5 border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected
                            ? "bg-[#17201B] border-[#D49A3A] shadow-[0_0_15px_rgba(212,154,58,0.15)]"
                            : "bg-[#111513] border-[#2A2E2B] hover:border-[#4A504B] hover:bg-[#151A17]"
                        }`}
                      >
                        {/* Header of Language Card */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div className="text-xl font-sans font-bold text-[#F3F0E8] group-hover:text-[#D49A3A] transition-colors leading-snug">
                                {lang.nativeName}
                              </div>
                              <div className="text-xs font-bold text-[#D49A3A] flex items-center gap-1.5">
                                <span>{lang.name}</span>
                                <span className="text-[10px] text-[#9A9A90] font-mono">({lang.code})</span>
                              </div>
                            </div>

                            {isSelected ? (
                              <span className="p-1 bg-[#D49A3A] text-[#0B0D0C]">
                                <Check size={14} strokeWidth={3} />
                              </span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#1B201D] text-[#9A9A90] border border-[#2A2E2B] font-mono">
                                {lang.speakers}
                              </span>
                            )}
                          </div>

                          <div className="text-[10px] text-[#9A9A90] space-y-0.5">
                            <div><span className="text-[#6A6E6B]">Script:</span> {lang.script}</div>
                            <div><span className="text-[#6A6E6B]">Region:</span> {lang.region}</div>
                          </div>
                        </div>

                        {/* Sample Prompt Preview */}
                        <div className="mt-3 pt-2 border-t border-[#2A2E2B]/80 flex items-center justify-between text-[10px] text-[#9A9A90]">
                          <span className="truncate pr-2 italic opacity-80" title={lang.samplePrompt}>
                            "{lang.samplePrompt.substring(0, 32)}..."
                          </span>
                          <button
                            onClick={(e) => handleSpeakSample(e, lang.samplePrompt)}
                            className="p-1 hover:text-[#D49A3A] hover:bg-[#1E2421] transition-colors cursor-pointer flex-shrink-0"
                            title="Speak audio preview"
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: VISUAL THEME */}
            {activeTab === "theme" && (
              <div className="space-y-5">
                <div className="text-xs text-[#9A9A90]">
                  Select UI color grading and viewport brightness preset for high-contrast satellite analysis.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: "deep-space",
                      name: "Deep Space Dark (Default)",
                      desc: "Optimized for night observations & thermal infrared rendering",
                      bg: "bg-[#0E1110]",
                      border: "border-[#D49A3A]",
                      accent: "#D49A3A"
                    },
                    {
                      id: "isro-emerald",
                      name: "ISRO Cyber Emerald",
                      desc: "High contrast agricultural vegetation & NDVI spectrum accent",
                      bg: "bg-[#0A1612]",
                      border: "border-[#10B981]",
                      accent: "#10B981"
                    },
                    {
                      id: "high-contrast",
                      name: "Cartosat High-Contrast",
                      desc: "Maximized boundary clarity for built-up and cadastral mapping",
                      bg: "bg-[#18181B]",
                      border: "border-[#3B82F6]",
                      accent: "#3B82F6"
                    }
                  ].map((theme) => (
                    <div
                      key={theme.id}
                      onClick={() => {
                        setThemeMode(theme.id);
                        toast.success(`Theme set to ${theme.name}`);
                      }}
                      className={`p-4 border cursor-pointer transition-all ${
                        themeMode === theme.id
                          ? "bg-[#141816] border-[#D49A3A] ring-1 ring-[#D49A3A]"
                          : "bg-[#0E1110] border-[#2A2E2B] hover:border-[#4A504B]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#F3F0E8]">{theme.name}</span>
                        {themeMode === theme.id && <Check size={14} className="text-[#D49A3A]" />}
                      </div>
                      <p className="text-[11px] text-[#9A9A90] mb-3">{theme.desc}</p>
                      <div className={`h-8 w-full ${theme.bg} border border-[#2A2E2B] flex items-center justify-around px-2`}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                        <span className="w-12 h-1 bg-current opacity-30" />
                        <span className="w-4 h-1 bg-current opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SENSOR & CRS PRESETS */}
            {activeTab === "sensor" && (
              <div className="space-y-5">
                <div className="text-xs text-[#9A9A90]">
                  Configure default satellite sensors, coordinate reference system (CRS) and spatial bounding limits.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-[#141816] border border-[#2A2E2B] space-y-3">
                    <label className="font-bold text-[#F3F0E8] block flex items-center gap-2">
                      <Compass size={14} className="text-[#D49A3A]" />
                      <span>Default Satellite Constellation</span>
                    </label>
                    <select
                      value={defaultSensor}
                      onChange={(e) => {
                        setDefaultSensor(e.target.value);
                        toast.info(`Default sensor preset: ${e.target.value.toUpperCase()}`);
                      }}
                      className="w-full bg-[#0E1110] border border-[#2A2E2B] p-2 text-[#E9E5DA] focus:outline-none focus:border-[#D49A3A]"
                    >
                      <option value="sentinel-2a">Sentinel-2A / 2B L2A (10m Multispectral)</option>
                      <option value="cartosat-3">Cartosat-3 High-Res (0.28m Panchromatic)</option>
                      <option value="nisar-radar">NISAR L-band & S-band SAR (All-Weather Radar)</option>
                      <option value="landsat-9">Landsat-9 OLI-2 / TIRS-2 (Thermal & Vegetation)</option>
                    </select>
                  </div>

                  <div className="p-4 bg-[#141816] border border-[#2A2E2B] space-y-3">
                    <label className="font-bold text-[#F3F0E8] block flex items-center gap-2">
                      <Sparkles size={14} className="text-[#D49A3A]" />
                      <span>Coordinate Reference System (CRS)</span>
                    </label>
                    <select
                      value={defaultCRS}
                      onChange={(e) => {
                        setDefaultCRS(e.target.value);
                        toast.info(`Projection set to ${e.target.value}`);
                      }}
                      className="w-full bg-[#0E1110] border border-[#2A2E2B] p-2 text-[#E9E5DA] focus:outline-none focus:border-[#D49A3A]"
                    >
                      <option value="EPSG:4326">EPSG:4326 (WGS 84 Geographic Latitude/Longitude)</option>
                      <option value="EPSG:32643">EPSG:32643 (UTM Zone 43N - India Central)</option>
                      <option value="EPSG:32644">EPSG:32644 (UTM Zone 44N - East India)</option>
                      <option value="EPSG:3857">EPSG:3857 (Web Mercator Spatial Tiles)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 border-t border-[#2A2E2B] bg-[#141816] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#9A9A90]">
              <span>Active Script Engine:</span>
              <span className="font-bold text-[#D49A3A] font-sans">{currentLanguage.nativeName} ({currentLanguage.name})</span>
            </div>

            <button
              onClick={() => {
                toast.success("Preferences Saved Successfully");
                onClose();
              }}
              className="px-5 py-2 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold transition-colors cursor-pointer"
            >
              APPLY & SAVE PREFERENCES
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
