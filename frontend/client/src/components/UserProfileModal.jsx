import React from "react";
import { X, User, Mail, ShieldCheck, Building2, LogOut, CheckCircle2, Award, Terminal, Cpu } from "lucide-react";

export function UserProfileModal({ isOpen, onClose, user, onLogout }) {
  if (!isOpen) return null;

  const initials = (user?.name || "SatQuery Analyst")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#080E11] border border-white/[0.14] w-full max-w-md shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden font-sans rounded-2xl ios-glass-card">
        
        {/* Header */}
        <div className="p-4 bg-[#040708]/85 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
            <div className="font-mono text-xs font-bold text-[#FFFFFF] tracking-wider uppercase">
              OPERATOR PROFILE & CREDENTIALS
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-colors rounded-md cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {/* Avatar & Operator Identity Card */}
          <div className="p-4 rounded-xl bg-[#0D171C] border border-white/[0.08] flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#12A5B8]/20 to-[#0B4F58]/30 border border-[#12A5B8]/50 flex items-center justify-center text-[#12A5B8] font-bold text-lg font-mono shadow-[0_0_15px_rgba(18,165,184,0.2)] flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#FFFFFF] truncate">
                  {user?.name || "SatQuery Analyst"}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981] flex-shrink-0" title="Active Session" />
              </div>
              <div className="text-xs text-[#8AA3AD] font-mono truncate">
                {user?.role || "Lead Satellite Analyst"}
              </div>
              <div className="text-[10px] text-[#12A5B8] font-mono mt-0.5 flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>Level-3 Multispectral & SAR Certified</span>
              </div>
            </div>
          </div>

          {/* Detailed Metadata Grid */}
          <div className="grid grid-cols-1 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#040708]/70 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8AA3AD]">
                <Mail size={13} className="text-[#12A5B8]" />
                <span>Operator Email:</span>
              </div>
              <span className="text-[#F0F6F8] font-medium truncate max-w-[200px]">
                {user?.email || "analyst@isro.gov.in"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#040708]/70 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8AA3AD]">
                <Building2 size={13} className="text-[#12A5B8]" />
                <span>Organization:</span>
              </div>
              <span className="text-[#F0F6F8] font-medium truncate max-w-[200px]">
                {user?.organization || "ISRO National Remote Sensing Center"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#040708]/70 border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#8AA3AD]">
                <Cpu size={13} className="text-[#12A5B8]" />
                <span>Station Clearance:</span>
              </div>
              <span className="text-[#12A5B8] font-bold">
                FULL SATELLITE ARCHIVE
              </span>
            </div>
          </div>

          {/* Session Security Indicator */}
          <div className="p-2.5 rounded-lg bg-[#12A5B8]/10 border border-[#12A5B8]/25 flex items-center gap-2 text-[11px] font-mono text-[#D0E3EA]">
            <CheckCircle2 size={14} className="text-[#12A5B8] flex-shrink-0" />
            <span>Identity remembered on this device. Back navigation locked to active workstation.</span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-center text-xs font-mono text-[#8AA3AD] hover:text-[#FFFFFF] bg-[#0D171C] hover:bg-[#132127] border border-white/[0.1] rounded-lg transition-colors cursor-pointer"
            >
              DISMISS
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout?.();
              }}
              className="flex-1 py-2 text-center text-xs font-mono font-bold text-[#FF5454] hover:text-white bg-[#FF5454]/10 hover:bg-[#FF5454]/25 border border-[#FF5454]/30 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut size={13} />
              <span>LOG OUT</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default UserProfileModal;
