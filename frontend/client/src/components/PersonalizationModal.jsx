import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  X,
  Check,
  Search,
  Sparkles,
  Layers,
  Sliders,
  Volume2,
  ShieldCheck,
  Compass,
  Sun,
  Moon,
  Palette,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

export default function PersonalizationModal({ isOpen, onClose, theme = "dark", onThemeChange }) {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [activeTab, setActiveTab] = useState("language");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [defaultSensor, setDefaultSensor] = useState("sentinel-2a");
  const [defaultCRS, setDefaultCRS] = useState("EPSG:4326");

  if (!isOpen) return null;

  const isLight = theme === "light";

  const handleToggleTheme = (newTheme) => {
    if (onThemeChange) {
      onThemeChange(newTheme);
      toast.success(
        `Theme switched to ${newTheme === "light" ? "White / Light Mode" : "Dark Mode"}`,
        {
          description:
            newTheme === "light"
              ? "Cartosat Solar Light palette active with high daylight contrast."
              : "ISRO Deep Space Dark palette active with telemetry glow.",
        }
      );
    }
  };

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
      return (
        matchesSearch &&
        (lang.category.includes("Regional") ||
          lang.category.includes("Himalayan") ||
          lang.category.includes("North-East"))
      );
    }
    return matchesSearch;
  });

  const handleSelectLanguage = (lang) => {
    setLanguage(lang);
    toast.success(`Active Language: ${lang.name} (${lang.nativeName})`, {
      description: `ISRO VQA Prompt parsing & multi-script OCR calibrated for ${lang.script}`,
    });
  };

  const handleSpeakSample = (e, promptText) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.info("Synthesizing audio preview in local phonetics...");
    } else {
      toast.error("Text-to-Speech audio not supported in this browser");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-8 font-mono">
        {/* Backdrop with high blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`absolute inset-0 backdrop-blur-md transition-colors ${
            isLight ? "bg-slate-900/40" : "bg-black/80"
          }`}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className={`relative w-full max-w-5xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden border shadow-2xl transition-colors duration-200 ${
            isLight
              ? "bg-white/98 border-[#CBD5E1] text-[#0F172A] shadow-[0_25px_60px_rgba(15,23,42,0.18)]"
              : "bg-[#0B1114]/98 border-[#1C323B] text-[#F0F6F8] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_30px_rgba(18,165,184,0.12)]"
          }`}
        >
          {/* Header */}
          <div
            className={`px-6 py-4 border-b flex items-center justify-between transition-colors flex-shrink-0 ${
              isLight
                ? "bg-[#F8FAFC] border-[#E2E8F0]"
                : "bg-[#0E171D] border-[#1C323B]"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isLight
                    ? "bg-[#0E7C8A]/10 border border-[#0E7C8A]/30 text-[#0E7C8A] shadow-sm"
                    : "bg-[#12A5B8]/10 border border-[#12A5B8]/30 text-[#12A5B8] shadow-[0_0_15px_rgba(18,165,184,0.2)]"
                }`}
              >
                <Sliders size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2
                    className={`text-sm md:text-base font-bold tracking-wide uppercase ${
                      isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                    }`}
                  >
                    Personalization & System Customization
                  </h2>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Quick Theme Switcher Pill in Header */}
              <div
                className={`flex items-center p-1 rounded-xl border transition-colors ${
                  isLight
                    ? "bg-white border-[#CBD5E1]"
                    : "bg-[#080D10] border-[#1C323B]"
                }`}
                title="Switch Workstation Theme"
              >
                <button
                  onClick={() => handleToggleTheme("light")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    isLight
                      ? "bg-[#0E7C8A] text-white shadow-sm"
                      : "text-[#8AA3AD] hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Sun size={13} />
                  <span className="hidden sm:inline">White</span>
                </button>
                <button
                  onClick={() => handleToggleTheme("dark")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    !isLight
                      ? "bg-[#12A5B8] text-black font-bold shadow-sm"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
                  }`}
                >
                  <Moon size={13} />
                  <span className="hidden sm:inline">Dark</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? "border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-100"
                    : "border-[#1C323B] text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-[#132127]"
                }`}
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div
            className={`flex-shrink-0 flex items-stretch border-b text-xs transition-colors overflow-x-auto select-none min-h-[46px] ${
              isLight
                ? "bg-[#F1F5F9] border-[#E2E8F0]"
                : "bg-[#080D10] border-[#1C323B]"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("language")}
              className={`relative px-5 py-3 flex items-center gap-2.5 transition-all cursor-pointer border-r whitespace-nowrap text-xs ${
                isLight ? "border-[#E2E8F0]" : "border-[#1C323B]"
              } ${
                activeTab === "language"
                  ? isLight
                    ? "bg-white text-[#0E7C8A] font-bold shadow-sm"
                    : "bg-[#132127] text-[#12A5B8] font-bold"
                  : isLight
                  ? "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60 font-medium"
                  : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#0E171D] font-medium"
              }`}
            >
              {activeTab === "language" && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                    isLight ? "bg-[#0E7C8A]" : "bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]"
                  }`}
                />
              )}
              <Globe size={15} className="flex-shrink-0" />
              <span>01 LANGUAGES & SCRIPTS ({languages.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("theme")}
              className={`relative px-5 py-3 flex items-center gap-2.5 transition-all cursor-pointer border-r whitespace-nowrap text-xs ${
                isLight ? "border-[#E2E8F0]" : "border-[#1C323B]"
              } ${
                activeTab === "theme"
                  ? isLight
                    ? "bg-white text-[#0E7C8A] font-bold shadow-sm"
                    : "bg-[#132127] text-[#12A5B8] font-bold"
                  : isLight
                  ? "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60 font-medium"
                  : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#0E171D] font-medium"
              }`}
            >
              {activeTab === "theme" && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                    isLight ? "bg-[#0E7C8A]" : "bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]"
                  }`}
                />
              )}
              <Palette size={15} className="flex-shrink-0" />
              <span>02 APPEARANCE & THEME</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase leading-none ${
                  isLight
                    ? "bg-[#0E7C8A]/10 text-[#0E7C8A]"
                    : "bg-[#12A5B8]/20 text-[#12A5B8]"
                }`}
              >
                {theme.toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sensor")}
              className={`relative px-5 py-3 flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap text-xs ${
                activeTab === "sensor"
                  ? isLight
                    ? "bg-white text-[#0E7C8A] font-bold shadow-sm"
                    : "bg-[#132127] text-[#12A5B8] font-bold"
                  : isLight
                  ? "text-[#64748B] hover:text-[#0F172A] hover:bg-white/60 font-medium"
                  : "text-[#8AA3AD] hover:text-[#F0F6F8] hover:bg-[#0E171D] font-medium"
              }`}
            >
              {activeTab === "sensor" && (
                <div
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] ${
                    isLight ? "bg-[#0E7C8A]" : "bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]"
                  }`}
                />
              )}
              <Compass size={15} className="flex-shrink-0" />
              <span>03 SENSOR & CRS PRESETS</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 ${
              isLight ? "bg-white" : "bg-[#0B1114]"
            }`}
          >
            {/* ─────────────────────────────────────────────────────────────
                TAB 1: 01 LANGUAGES & SCRIPTS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "language" && (
              <div className="space-y-5">
                {/* Active Selected Language Hero Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                    isLight
                      ? "bg-[#F0FDFA] border-[#0E7C8A]/35 shadow-sm"
                      : "bg-[#102028] border-[#12A5B8]/40 shadow-[0_0_20px_rgba(18,165,184,0.15)]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`text-3xl font-sans font-extrabold px-3.5 py-1.5 rounded-xl border ${
                        isLight
                          ? "bg-white text-[#0E7C8A] border-[#0E7C8A]/30 shadow-sm"
                          : "bg-[#0B1114] text-[#12A5B8] border-[#12A5B8]/40 shadow-[0_0_15px_rgba(18,165,184,0.2)]"
                      }`}
                    >
                      {currentLanguage.nativeName}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                          }`}
                        >
                          Active Language: {currentLanguage.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            isLight
                              ? "bg-[#0E7C8A]/10 text-[#0E7C8A] border border-[#0E7C8A]/25"
                              : "bg-[#12A5B8]/15 text-[#12A5B8] border border-[#12A5B8]/30"
                          }`}
                        >
                          [{currentLanguage.code.toUpperCase()}]
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
                    <button
                      onClick={(e) => handleSpeakSample(e, currentLanguage.samplePrompt)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                        isLight
                          ? "bg-white border-[#CBD5E1] text-[#0F172A] hover:border-[#0E7C8A] hover:bg-[#F0FDFA]"
                          : "bg-[#132127] border-[#1C323B] text-[#F0F6F8] hover:border-[#12A5B8] hover:bg-[#192E37]"
                      }`}
                    >
                      <Volume2
                        size={14}
                        className={isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"}
                      />
                      <span>Audio Preview</span>
                    </button>

                    <div
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 ${
                        isLight
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                          : "bg-[#10B981]/15 border-[#10B981]/30 text-[#10B981]"
                      }`}
                    >
                      <ShieldCheck size={14} />
                      <span>ISRO VQA Prompt Ready</span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div
                  className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors ${
                    isLight
                      ? "bg-[#F8FAFC] border-[#E2E8F0]"
                      : "bg-[#0E171D] border-[#1C323B]"
                  }`}
                >
                  <div className="relative flex-1">
                    <Search
                      size={14}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 ${
                        isLight ? "text-[#94A3B8]" : "text-[#546A74]"
                      }`}
                    />
                    <input
                      type="text"
                      placeholder="Search language name, native script, Devanagari, Gurmukhi, Tamil, etc..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-lg pl-9 pr-3 py-1.5 text-xs transition-colors focus:outline-none ${
                        isLight
                          ? "bg-white border border-[#CBD5E1] text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0E7C8A]"
                          : "bg-[#080D10] border border-[#1C323B] text-[#F0F6F8] placeholder-[#546A74] focus:border-[#12A5B8]"
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    {[
                      { id: "ALL", label: `ALL (${languages.length})` },
                      { id: "SCHEDULED", label: "SCHEDULED 22" },
                      { id: "REGIONAL", label: "N-EAST & HILLS" },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setCategoryFilter(btn.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer font-semibold ${
                          categoryFilter === btn.id
                            ? isLight
                              ? "bg-[#0E7C8A] text-white border-[#0E7C8A] shadow-sm"
                              : "bg-[#12A5B8] text-black border-[#12A5B8] font-bold shadow-[0_0_12px_rgba(18,165,184,0.3)]"
                            : isLight
                            ? "bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#0F172A] hover:bg-slate-100"
                            : "bg-[#080D10] text-[#8AA3AD] border-[#1C323B] hover:text-[#F0F6F8] hover:bg-[#132127]"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid of Languages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLanguages.map((lang) => {
                    const isSelected = currentLanguage.id === lang.id;
                    return (
                      <motion.div
                        key={lang.id}
                        whileHover={{ y: -2 }}
                        onClick={() => handleSelectLanguage(lang)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isSelected
                            ? isLight
                              ? "bg-[#F0FDFA] border-[#0E7C8A] shadow-[0_0_15px_rgba(14,124,138,0.18)] ring-1 ring-[#0E7C8A]"
                              : "bg-[#10252E] border-[#12A5B8] shadow-[0_0_18px_rgba(18,165,184,0.25)] ring-1 ring-[#12A5B8]"
                            : isLight
                            ? "bg-white border-[#E2E8F0] hover:border-[#0E7C8A]/50 hover:shadow-sm"
                            : "bg-[#0E171D] border-[#1C323B] hover:border-[#12A5B8]/50 hover:bg-[#121F26]"
                        }`}
                      >
                        {/* Header of Language Card */}
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div>
                              <div
                                className={`text-xl font-sans font-bold leading-tight transition-colors ${
                                  isSelected
                                    ? isLight
                                      ? "text-[#0E7C8A]"
                                      : "text-[#12A5B8]"
                                    : isLight
                                    ? "text-[#0F172A] group-hover:text-[#0E7C8A]"
                                    : "text-[#F0F6F8] group-hover:text-[#12A5B8]"
                                }`}
                              >
                                {lang.nativeName}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-xs font-bold ${
                                    isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                                  }`}
                                >
                                  {lang.name}
                                </span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                                  }`}
                                >
                                  ({lang.code})
                                </span>
                              </div>
                            </div>

                            {isSelected && (
                              <span
                                className={`p-1 rounded-md ${
                                  isLight
                                    ? "bg-[#0E7C8A] text-white"
                                    : "bg-[#12A5B8] text-black"
                                }`}
                              >
                                <Check size={13} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Sample Prompt Preview */}
                        <div
                          className={`mt-3 pt-2 border-t flex items-center justify-between text-[10px] ${
                            isLight
                              ? "border-[#E2E8F0] text-[#64748B]"
                              : "border-[#1C323B] text-[#8AA3AD]"
                          }`}
                        >
                          <span
                            className="truncate italic opacity-85"
                            title={lang.samplePrompt}
                          >
                            "{lang.samplePrompt.substring(0, 35)}..."
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 2: 02 APPEARANCE & THEME (THEME TAB ONLY)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "theme" && (
              <div className="space-y-6">
                <div>
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider ${
                      isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                    }`}
                  >
                    Workstation Visual Theme Selection
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                    }`}
                  >
                    Adjust UI luminance, high-contrast borders, and telemetry color grading for satellite analysis.
                  </p>
                </div>

                {/* Main Theme Switcher Cards: White vs Dark */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* WHITE / LIGHT THEME CARD */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleToggleTheme("light")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                      isLight
                        ? "bg-white border-[#0E7C8A] shadow-[0_10px_30px_rgba(14,124,138,0.2)] ring-2 ring-[#0E7C8A]/20"
                        : "bg-[#0E171D] border-[#1C323B] hover:border-[#CBD5E1]/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-600 flex items-center justify-center">
                            <Sun size={17} />
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[#0F172A]">
                              White / Light Mode
                            </span>
                            <div className="text-[10px] text-[#64748B]">Cartosat Solar White</div>
                          </div>
                        </div>

                        {isLight && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#0E7C8A] bg-[#0E7C8A]/10 px-2.5 py-1 rounded-full border border-[#0E7C8A]/30">
                            <CheckCircle2 size={13} />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#64748B] mb-4">
                        Daylight cartography, high contrast roads & cadastral boundaries. Specially calibrated for bright rooms and daytime presentations.
                      </p>

                      {/* Mini Mockup Preview */}
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                        <div className="h-4 bg-white border border-[#CBD5E1] rounded flex items-center px-2 justify-between">
                          <div className="w-12 h-1.5 bg-[#0E7C8A] rounded-full" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 h-12">
                          <div className="bg-white border border-[#E2E8F0] rounded p-1 flex flex-col justify-between">
                            <div className="w-6 h-1 bg-[#0E7C8A] rounded" />
                            <div className="w-full h-2 bg-slate-100 rounded" />
                          </div>
                          <div className="col-span-2 bg-emerald-50/50 border border-emerald-200/60 rounded p-1 flex items-center justify-center text-[9px] text-[#0E7C8A] font-bold">
                            Daylight VQA Canvas
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-slate-500">Contrast Ratio: 12.8:1</span>
                      <span className={isLight ? "text-[#0E7C8A] font-bold" : "text-slate-400"}>
                        {isLight ? "Currently Selected" : "Click to Activate"}
                      </span>
                    </div>
                  </motion.div>

                  {/* DARK THEME CARD */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => handleToggleTheme("dark")}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative flex flex-col justify-between ${
                      !isLight
                        ? "bg-[#0B1114] border-[#12A5B8] shadow-[0_10px_30px_rgba(18,165,184,0.25)] ring-2 ring-[#12A5B8]/30"
                        : "bg-slate-50 border-[#E2E8F0] hover:border-[#12A5B8]/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#12A5B8]/15 border border-[#12A5B8]/40 text-[#12A5B8] flex items-center justify-center">
                            <Moon size={17} />
                          </div>
                          <div>
                            <span
                              className={`font-bold text-sm ${
                                !isLight ? "text-[#FFFFFF]" : "text-[#0F172A]"
                              }`}
                            >
                              Dark Space Mode
                            </span>
                            <div
                              className={`text-[10px] ${
                                !isLight ? "text-[#8AA3AD]" : "text-[#64748B]"
                              }`}
                            >
                              ISRO Deep Space Obsidian
                            </div>
                          </div>
                        </div>

                        {!isLight && (
                          <span className="flex items-center gap-1 text-xs font-bold text-[#12A5B8] bg-[#12A5B8]/15 px-2.5 py-1 rounded-full border border-[#12A5B8]/30">
                            <CheckCircle2 size={13} />
                            <span>ACTIVE</span>
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs mb-4 ${
                          !isLight ? "text-[#8AA3AD]" : "text-[#64748B]"
                        }`}
                      >
                        Optimized for night observations, thermal infrared, NISAR radar backscatter analysis, and reduced visual fatigue.
                      </p>

                      {/* Mini Mockup Preview */}
                      <div
                        className={`p-3 rounded-xl border space-y-2 ${
                          !isLight
                            ? "bg-[#080D10] border-[#1C323B]"
                            : "bg-[#0D171C] border-[#1C323B]"
                        }`}
                      >
                        <div className="h-4 bg-[#132127] border border-[#1C323B] rounded flex items-center px-2 justify-between">
                          <div className="w-12 h-1.5 bg-[#12A5B8] rounded-full" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-cyan-900" />
                            <div className="w-2 h-2 rounded-full bg-cyan-700" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 h-12">
                          <div className="bg-[#101E24] border border-[#1C323B] rounded p-1 flex flex-col justify-between">
                            <div className="w-6 h-1 bg-[#12A5B8] rounded" />
                            <div className="w-full h-2 bg-[#1C323B] rounded" />
                          </div>
                          <div className="col-span-2 bg-[#0B2A33]/70 border border-[#12A5B8]/30 rounded p-1 flex items-center justify-center text-[9px] text-[#12A5B8] font-bold">
                            Obsidian Telemetry Canvas
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] font-semibold ${
                        !isLight ? "border-[#1C323B]" : "border-slate-200"
                      }`}
                    >
                      <span className={!isLight ? "text-[#8AA3AD]" : "text-slate-500"}>
                        Contrast Ratio: 14.5:1
                      </span>
                      <span
                        className={!isLight ? "text-[#12A5B8] font-bold" : "text-slate-400"}
                      >
                        {!isLight ? "Currently Selected" : "Click to Activate"}
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                TAB 3: 03 SENSOR & CRS PRESETS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === "sensor" && (
              <div className="space-y-5">
                <div>
                  <h3
                    className={`text-sm font-bold uppercase tracking-wider ${
                      isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                    }`}
                  >
                    Spatial Sensor & Projection Presets
                  </h3>
                  <p
                    className={`text-xs mt-0.5 ${
                      isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                    }`}
                  >
                    Configure default satellite sensors, coordinate reference system (CRS), and tile caching defaults.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Default Satellite Constellation */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 transition-colors ${
                      isLight
                        ? "bg-[#F8FAFC] border-[#E2E8F0]"
                        : "bg-[#0E171D] border-[#1C323B]"
                    }`}
                  >
                    <label
                      className={`font-bold block flex items-center gap-2 uppercase tracking-wide ${
                        isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                      }`}
                    >
                      <Layers
                        size={15}
                        className={isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"}
                      />
                      <span>Default Satellite Constellation</span>
                    </label>
                    <select
                      value={defaultSensor}
                      onChange={(e) => {
                        setDefaultSensor(e.target.value);
                        toast.info(`Default sensor preset: ${e.target.value.toUpperCase()}`);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-xs transition-colors focus:outline-none ${
                        isLight
                          ? "bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A]"
                          : "bg-[#080D10] border-[#1C323B] text-[#F0F6F8] focus:border-[#12A5B8]"
                      }`}
                    >
                      <option value="sentinel-2a">Sentinel-2A / 2B L2A (10m Multispectral)</option>
                      <option value="cartosat-3">Cartosat-3 High-Res (0.28m Panchromatic)</option>
                      <option value="nisar-radar">NISAR L-band & S-band SAR (All-Weather Radar)</option>
                      <option value="landsat-9">Landsat-9 OLI-2 / TIRS-2 (Thermal & Vegetation)</option>
                    </select>
                    <div
                      className={`text-[11px] leading-relaxed ${
                        isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                      }`}
                    >
                      Sets the base optical or synthetic aperture radar backend initialized on fresh query sessions.
                    </div>
                  </div>

                  {/* Coordinate Reference System (CRS) */}
                  <div
                    className={`p-4 rounded-xl border space-y-3 transition-colors ${
                      isLight
                        ? "bg-[#F8FAFC] border-[#E2E8F0]"
                        : "bg-[#0E171D] border-[#1C323B]"
                    }`}
                  >
                    <label
                      className={`font-bold block flex items-center gap-2 uppercase tracking-wide ${
                        isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
                      }`}
                    >
                      <Compass
                        size={15}
                        className={isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"}
                      />
                      <span>Coordinate Reference System (CRS)</span>
                    </label>
                    <select
                      value={defaultCRS}
                      onChange={(e) => {
                        setDefaultCRS(e.target.value);
                        toast.info(`Coordinate Projection set to ${e.target.value}`);
                      }}
                      className={`w-full p-2.5 rounded-lg border text-xs transition-colors focus:outline-none ${
                        isLight
                          ? "bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A]"
                          : "bg-[#080D10] border-[#1C323B] text-[#F0F6F8] focus:border-[#12A5B8]"
                      }`}
                    >
                      <option value="EPSG:4326">EPSG:4326 (WGS 84 Geographic Latitude/Longitude)</option>
                      <option value="EPSG:32643">EPSG:32643 (UTM Zone 43N - India Central)</option>
                      <option value="EPSG:32644">EPSG:32644 (UTM Zone 44N - East India & Bay of Bengal)</option>
                      <option value="EPSG:3857">EPSG:3857 (Web Mercator Spatial Tiles)</option>
                    </select>
                    <div
                      className={`text-[11px] leading-relaxed ${
                        isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                      }`}
                    >
                      Standardizes polygon bounding coordinates and GeoJSON exports for national GIS toolkits.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div
            className={`px-6 py-3.5 border-t flex items-center justify-between text-xs transition-colors flex-shrink-0 ${
              isLight
                ? "bg-[#F8FAFC] border-[#E2E8F0]"
                : "bg-[#0E171D] border-[#1C323B]"
            }`}
          >
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-[11px] ${
                  isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                }`}
              >
                Active Engine:
              </span>
              <span
                className={`font-bold font-sans ${
                  isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                }`}
              >
                {currentLanguage.nativeName} ({currentLanguage.name})
              </span>
              <span className={isLight ? "text-slate-300" : "text-slate-700"}>•</span>
              <span
                className={`text-[11px] ${
                  isLight ? "text-[#64748B]" : "text-[#8AA3AD]"
                }`}
              >
                Active Theme:
              </span>
              <span
                className={`font-bold font-mono uppercase ${
                  isLight ? "text-[#0E7C8A]" : "text-[#12A5B8]"
                }`}
              >
                {isLight ? "White / Light" : "Dark Space"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "bg-white border-[#CBD5E1] text-[#475569] hover:bg-slate-100 hover:text-[#0F172A]"
                    : "bg-[#080D10] border-[#1C323B] text-[#8AA3AD] hover:bg-[#132127] hover:text-[#FFFFFF]"
                }`}
              >
                Close
              </button>

              <button
                onClick={() => {
                  toast.success("Preferences & Theme Saved Successfully");
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  isLight
                    ? "bg-[#0E7C8A] hover:bg-[#0B6570] text-white"
                    : "bg-[#12A5B8] hover:bg-[#0EA0B2] text-black font-bold shadow-[0_0_15px_rgba(18,165,184,0.3)]"
                }`}
              >
                APPLY & SAVE
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
