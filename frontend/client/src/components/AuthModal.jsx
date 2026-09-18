import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  Lock,
  User,
  Building2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  LogIn,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";

export function AuthModal({
  isOpen,
  onClose,
  initialMode = "login",
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agency, setAgency] = useState("ISRO / NRSC Analyst");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  // Handle ESC key to close
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const user = {
        name: mode === "login" ? (email.split("@")[0] || "Mission Specialist") : fullName || "Geospatial Analyst",
        email: email || (mode === "login" ? "analyst@isro.gov.in" : "researcher@space.gov"),
        role: agency,
        verified: true,
      };

      if (onAuthSuccess) {
        onAuthSuccess(user);
      }

      toast.success(
        mode === "login"
          ? `Welcome back, ${user.name}! Satellite session authorized.`
          : `Operator account created for ${user.name}! Welcome to SatQuery AI.`
      );

      onClose();
    }, 650);
  };

  const handleDemoSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const demoUser = {
        name: "Dr. A. Sharma",
        email: "a.sharma@nrsc.gov.in",
        role: "ISRO / NRSC Principal Analyst",
        verified: true,
      };

      if (onAuthSuccess) {
        onAuthSuccess(demoUser);
      }

      toast.success("Signed in as Dr. A. Sharma (ISRO / NRSC Principal Analyst)");
      onClose();
    }, 450);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040708]/80 backdrop-blur-md">
        {/* Backdrop click listener */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal Window: Apple Frosted Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md p-6 sm:p-7 ios-glass border border-white/[0.12] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] text-[#F0F6F8] font-sans overflow-hidden"
        >
          {/* Subtle Top Specular Sheen */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#12A5B8]/50 to-transparent pointer-events-none" />

          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12A5B8] shadow-[0_0_8px_#12A5B8]" />
              <span className="font-heading font-sora text-sm font-bold text-[#FFFFFF] tracking-wide">
                SATQUERY AI AUTHENTICATION
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.08] rounded-md transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#040708]/70 border border-white/[0.08] rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`py-2 text-xs font-mono font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "login"
                  ? "bg-[#12A5B8]/20 text-[#FFFFFF] border border-[#12A5B8]/40 shadow-sm"
                  : "text-[#8AA3AD] hover:text-[#D0E3EA]"
              }`}
            >
              <LogIn size={13} />
              <span>LOG IN</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`py-2 text-xs font-mono font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === "signup"
                  ? "bg-[#12A5B8]/20 text-[#FFFFFF] border border-[#12A5B8]/40 shadow-sm"
                  : "text-[#8AA3AD] hover:text-[#D0E3EA]"
              }`}
            >
              <UserPlus size={13} />
              <span>SIGN UP</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#8AA3AD] uppercase tracking-wider mb-1.5">
                    Operator Full Name
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priyanshu Gundle"
                      className="w-full bg-[#040708]/85 border border-white/[0.1] focus:border-[#12A5B8] focus:ring-1 focus:ring-[#12A5B8] rounded-md pl-9 pr-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder:text-[#8AA3AD]/50 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Organization / Agency */}
                <div>
                  <label className="block text-[11px] font-mono font-semibold text-[#8AA3AD] uppercase tracking-wider mb-1.5">
                    Agency / Organization
                  </label>
                  <div className="relative">
                    <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
                    <select
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      className="w-full bg-[#040708]/85 border border-white/[0.1] focus:border-[#12A5B8] focus:ring-1 focus:ring-[#12A5B8] rounded-md pl-9 pr-3.5 py-2.5 text-xs text-[#FFFFFF] outline-none transition-all cursor-pointer"
                    >
                      <option value="ISRO / NRSC Analyst">ISRO / NRSC Remote Sensing Division</option>
                      <option value="IN-SPACe Research Group">IN-SPACe Geospatial Research</option>
                      <option value="Academic Institution">Academic / University Laboratory</option>
                      <option value="Defense & Security Agency">Defense & National Security Agency</option>
                      <option value="Commercial Earth Observation">Commercial Earth Observation Team</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[#8AA3AD] uppercase tracking-wider mb-1.5">
                Work / Agency Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === "login" ? "analyst@nrsc.gov.in" : "operator@isro.gov.in"}
                  className="w-full bg-[#040708]/85 border border-white/[0.1] focus:border-[#12A5B8] focus:ring-1 focus:ring-[#12A5B8] rounded-md pl-9 pr-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder:text-[#8AA3AD]/50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-mono font-semibold text-[#8AA3AD] uppercase tracking-wider mb-1.5">
                Security Passphrase
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8AA3AD]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#040708]/85 border border-white/[0.1] focus:border-[#12A5B8] focus:ring-1 focus:ring-[#12A5B8] rounded-md pl-9 pr-3.5 py-2.5 text-xs text-[#FFFFFF] placeholder:text-[#8AA3AD]/50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 ios-glass-primary active:scale-[0.98] text-[#FFFFFF] font-bold text-xs tracking-wider rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(18,165,184,0.35)] disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : mode === "login" ? (
                <>
                  <span>AUTHENTICATE & LOG IN</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  <span>CREATE OPERATOR ACCOUNT</span>
                  <ShieldCheck size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Operator Login (One-click Convenience) */}
          <div className="pt-4 mt-5 border-t border-white/[0.08] flex flex-col items-center gap-2 text-center">
            <span className="text-[10px] font-mono text-[#8AA3AD]">
              TESTING THE SYSTEM?
            </span>
            <button
              type="button"
              onClick={handleDemoSignIn}
              className="w-full py-2 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-mono text-[#12A5B8] font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Sparkles size={13} className="text-[#12A5B8]" />
              <span>CONTINUE AS ISRO DEMO ANALYST</span>
            </button>
          </div>

          {/* Compliance & Security Stamp */}
          <div className="pt-3 text-center">
            <span className="text-[9px] font-mono text-[#8AA3AD]/60 tracking-wider">
              SIH26167 · ISRO SAFEGUARDED GEOSPATIAL INTELLIGENCE
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default AuthModal;
