import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  X,
  Check,
  Sliders,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

import ThemeToggle from "./ThemeToggle";

export default function PersonalizationModal({ isOpen, onClose, theme = "dark", onThemeChange }) {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  if (!isOpen) return null;

  const isLight = theme === "light";

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
      description: `Language preset activated for spatial query engine.`,
    });
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
                    Personalization & Language Customization
                  </h2>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <ThemeToggle
                theme={theme}
                onToggle={(newTheme) => {
                  if (onThemeChange) onThemeChange(newTheme);
                }}
              />
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

          {/* Modal Content Body */}
          <div
            className={`flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 ${
              isLight ? "bg-white" : "bg-[#0B1114]"
            }`}
          >
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
                    </motion.div>
                  );
                })}
              </div>
            </div>
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
                  toast.success("Preferences Saved Successfully");
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
