import React, { useEffect } from "react";
import { X, Mail, LogOut, CheckCircle2, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UserProfileModal({ isOpen, onClose, user, onLogout }) {
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

  const initials = (user?.name || user?.email || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          className="bg-[#0D171C] dark:bg-[#0D171C] light:bg-white light:text-[#0F172A] border border-[#1C323B] dark:border-[#1C323B] light:border-[#CBD5E1] w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden font-sans rounded-2xl"
        >
          {/* Header */}
          <div className="p-4 bg-[#040708] dark:bg-[#040708] light:bg-[#F8FAFC] border-b border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] light:bg-[#0E7C8A] shadow-[0_0_8px_#12A5B8]" />
              <div className="font-mono text-xs font-bold text-[#FFFFFF] dark:text-[#FFFFFF] light:text-[#0F172A] tracking-wider uppercase">
                OPERATOR PROFILE & CREDENTIALS
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[#8AA3AD] light:text-[#64748B] hover:text-[#FFFFFF] light:hover:text-[#0F172A] hover:bg-[#132127] light:hover:bg-[#E2E8F0] transition-colors rounded-lg cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 space-y-4">
            
            {/* Avatar & Operator Identity Card */}
            <div className="p-4 rounded-xl bg-[#080E11] dark:bg-[#080E11] light:bg-[#F1F5F9] border border-[#1C323B] dark:border-[#1C323B] light:border-[#CBD5E1] flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#12A5B8]/20 to-[#0B4F58]/30 light:from-[#0E7C8A]/15 light:to-[#E0F2FE] border border-[#12A5B8]/50 light:border-[#0E7C8A]/40 flex items-center justify-center text-[#12A5B8] light:text-[#0E7C8A] font-bold text-lg font-mono shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#FFFFFF] dark:text-[#FFFFFF] light:text-[#0F172A] truncate">
                    {user?.name || "SatQuery User"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981] flex-shrink-0" title="Active Session" />
                </div>
                {user?.email && (
                  <div className="text-xs text-[#8AA3AD] light:text-[#475569] font-mono truncate mt-0.5">
                    {user.email}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Metadata Grid */}
            <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#040708] dark:bg-[#040708] light:bg-[#F8FAFC] border border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8AA3AD] light:text-[#64748B]">
                  <Mail size={13} className="text-[#12A5B8] light:text-[#0E7C8A]" />
                  <span>Operator Email:</span>
                </div>
                <span className="text-[#F0F6F8] dark:text-[#F0F6F8] light:text-[#0F172A] font-medium truncate max-w-[200px]">
                  {user?.email || "user@satquery.ai"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#040708] dark:bg-[#040708] light:bg-[#F8FAFC] border border-[#1C323B] dark:border-[#1C323B] light:border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#8AA3AD] light:text-[#64748B]">
                  <Cpu size={13} className="text-[#12A5B8] light:text-[#0E7C8A]" />
                  <span>Station Clearance:</span>
                </div>
                <span className="text-[#12A5B8] light:text-[#0E7C8A] font-bold">
                  FULL SATELLITE ARCHIVE
                </span>
              </div>
            </div>

            {/* Session Security Indicator */}
            <div className="p-2.5 rounded-xl bg-[#12A5B8]/10 light:bg-[#0E7C8A]/10 border border-[#12A5B8]/25 light:border-[#0E7C8A]/20 flex items-center gap-2 text-[11px] font-mono text-[#D0E3EA] light:text-[#0F172A]">
              <CheckCircle2 size={14} className="text-[#12A5B8] light:text-[#0E7C8A] flex-shrink-0" />
              <span>Identity remembered on this device. Back navigation locked to active workstation.</span>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 text-center text-xs font-mono text-[#8AA3AD] light:text-[#475569] hover:text-[#FFFFFF] light:hover:text-[#0F172A] bg-[#040708] light:bg-[#F1F5F9] hover:bg-[#132127] light:hover:bg-[#E2E8F0] border border-[#1C323B] light:border-[#CBD5E1] rounded-xl transition-colors cursor-pointer"
              >
                DISMISS
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                className="flex-1 py-2 text-center text-xs font-mono font-bold text-[#FF5454] light:text-rose-600 hover:text-white bg-[#FF5454]/10 light:bg-rose-50 hover:bg-[#FF5454]/25 light:hover:bg-rose-100 border border-[#FF5454]/30 light:border-rose-200 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <LogOut size={13} />
                <span>LOG OUT</span>
              </button>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default UserProfileModal;
