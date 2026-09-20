import React, { useState, useEffect } from "react";
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AuthModal({ isOpen, onClose, initialMode = "signin", onSuccess }) {
  const [mode, setMode] = useState(initialMode); // "signin" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("ISRO National Remote Sensing Center");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const userLabel = fullName || email.split("@")[0] || "SatQuery Analyst";
      if (mode === "login") {
        toast.success(`Welcome back, ${userLabel}. Earth Observation Station connected.`);
      } else {
        toast.success(`Account registered for ${userLabel}. Operator credentials verified.`);
      }
      onSuccess?.({ email, name: userLabel, role: "Analyst" });
      onClose();
    }, 600);
  };

  const handleQuickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Demo Operator authenticated · Full imagery analysis unlocked.");
      onSuccess?.({ email: "demo@satquery.ai", name: "Guest Analyst", role: "Operator" });
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#080E11] border border-white/[0.12] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden font-sans rounded-2xl ios-glass-card">
        
        {/* Header */}
        <div className="p-4 bg-[#040708]/80 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
            <div className="font-mono text-xs font-bold text-[#FFFFFF] tracking-wider uppercase">
              SATQUERY AI · ACCESS PORTAL
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.06] transition-colors rounded-md cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher: SIGN IN vs LOG IN */}
        <div className="flex border-b border-white/[0.08] bg-[#040708]/40 font-mono text-xs">
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`flex-1 py-3 text-center transition-all cursor-pointer font-bold ${
              mode === "signin"
                ? "text-[#12A5B8] border-b-2 border-[#12A5B8] bg-[#12A5B8]/10"
                : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.02]"
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-3 text-center transition-all cursor-pointer font-bold ${
              mode === "login"
                ? "text-[#12A5B8] border-b-2 border-[#12A5B8] bg-[#12A5B8]/10"
                : "text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.02]"
            }`}
          >
            LOG IN
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div className="text-xs text-[#8AA3AD] mb-2 font-mono">
            {mode === "signin"
              ? "Create a new mission profile for satellite scene query & forensic audit."
              : "Authenticate your remote-sensing operator credentials."}
          </div>

          {mode === "signin" && (
            <div>
              <label className="block text-[10px] font-mono text-[#8AA3AD] uppercase font-bold mb-1">
                Full Name / Investigator Title
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#040708]/80 border border-white/[0.1] rounded-lg text-xs text-[#F0F6F8] placeholder-[#556972] focus:outline-none focus:border-[#12A5B8] font-sans"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono text-[#8AA3AD] uppercase font-bold mb-1">
              Work Email / Operator ID
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
              <input
                type="email"
                required
                placeholder="analyst@isro.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#040708]/80 border border-white/[0.1] rounded-lg text-xs text-[#F0F6F8] placeholder-[#556972] focus:outline-none focus:border-[#12A5B8] font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#8AA3AD] uppercase font-bold mb-1">
              Access Key / Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-[#040708]/80 border border-white/[0.1] rounded-lg text-xs text-[#F0F6F8] placeholder-[#556972] focus:outline-none focus:border-[#12A5B8] font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8AA3AD] hover:text-[#FFFFFF] cursor-pointer"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {mode === "signin" && (
            <div>
              <label className="block text-[10px] font-mono text-[#8AA3AD] uppercase font-bold mb-1">
                Research Body / Space Agency
              </label>
              <select
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 bg-[#040708]/80 border border-white/[0.1] rounded-lg text-xs text-[#F0F6F8] focus:outline-none focus:border-[#12A5B8] font-sans"
              >
                <option value="ISRO National Remote Sensing Center">ISRO / NRSC Remote Sensing Center</option>
                <option value="Defense Remote Sensing Agency">Defense Remote Sensing & Maritime Center</option>
                <option value="Geological Survey of India">Geological Survey & Disaster Mitigation</option>
                <option value="University Earth Observation Lab">Academic / Research Institution</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-[#12A5B8] hover:bg-[#0EA0B2] text-[#040708] font-bold text-xs tracking-wider uppercase font-mono rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(18,165,184,0.3)] cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span>AUTHENTICATING CREDENTIALS...</span>
            ) : (
              <>
                <span>{mode === "signin" ? "CREATE ACCOUNT & ENTER" : "LOG IN TO WORKSTATION"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* 1-Click Demo Shortcut */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#8AA3AD]">Instant Evaluation:</span>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-[#12A5B8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
            >
              <span>1-Click Demo Access</span>
              <span>→</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default AuthModal;
