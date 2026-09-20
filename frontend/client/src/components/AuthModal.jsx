import React, { useState, useEffect } from "react";
import { X, Lock, Mail, User, ShieldCheck, ArrowRight, Eye, EyeOff, Globe, Sparkles, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AuthModal({ isOpen, onClose, initialMode = "signup", onSuccess }) {
  // Mode: "signup" (Create ID) vs "login" (Access Account)
  const [mode, setMode] = useState(initialMode === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("ISRO National Remote Sensing Center");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberedName, setRememberedName] = useState("");

  useEffect(() => {
    setMode(initialMode === "login" ? "login" : "signup");
    try {
      const savedName = localStorage.getItem("satquery_last_name") || "";
      const savedEmail = localStorage.getItem("satquery_last_email") || "";
      if (savedName) {
        setRememberedName(savedName);
        if (!fullName) setFullName(savedName);
      }
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (e) {
      console.warn("Could not read remembered auth info", e);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Check registered users lookup
      let registeredUsers = {};
      try {
        const stored = localStorage.getItem("satquery_registered_users");
        if (stored) registeredUsers = JSON.parse(stored);
      } catch (err) {}

      const normalizedEmail = (email || "").trim().toLowerCase();
      let chosenName = "";

      if (mode === "signup") {
        chosenName = (fullName || "").trim() || "SatQuery Analyst";
      } else {
        // Logging in: check if name is in registered users or remembered
        if (registeredUsers[normalizedEmail]?.name) {
          chosenName = registeredUsers[normalizedEmail].name;
        } else if (rememberedName) {
          chosenName = rememberedName;
        } else if (fullName.trim()) {
          chosenName = fullName.trim();
        } else {
          chosenName = email.split("@")[0] || "SatQuery Analyst";
        }
      }

      const userData = {
        name: chosenName,
        email: email.trim() || `${chosenName.toLowerCase().replace(/\s+/g, "")}@satquery.ai`,
        organization: organization,
        role: "Lead Satellite Analyst",
        token: `sq_${Date.now()}`,
      };

      // Automatically remember user identity in localStorage
      try {
        registeredUsers[normalizedEmail] = userData;
        localStorage.setItem("satquery_registered_users", JSON.stringify(registeredUsers));
        localStorage.setItem("satquery_auth_user", JSON.stringify(userData));
        localStorage.setItem("satquery_last_name", chosenName);
        localStorage.setItem("satquery_last_email", userData.email);
      } catch (err) {
        console.warn("Could not persist user session", err);
      }

      if (mode === "signup") {
        toast.success(`Mission ID created for ${chosenName}. Logged into workstation.`);
      } else {
        toast.success(`Welcome back, ${chosenName}. Identity verified.`);
      }

      onSuccess?.(userData);
      onClose();
    }, 280);
  };

  const handleQuickDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const demoUser = {
        name: "Omkar Bijamwar",
        email: "omkarbijamwar@isro.gov.in",
        organization: "ISRO National Remote Sensing Center",
        role: "Lead Satellite Analyst",
        token: `sq_demo_${Date.now()}`,
      };
      try {
        const stored = localStorage.getItem("satquery_registered_users");
        const registeredUsers = stored ? JSON.parse(stored) : {};
        registeredUsers[demoUser.email.toLowerCase()] = demoUser;
        localStorage.setItem("satquery_registered_users", JSON.stringify(registeredUsers));
        localStorage.setItem("satquery_auth_user", JSON.stringify(demoUser));
        localStorage.setItem("satquery_last_name", demoUser.name);
        localStorage.setItem("satquery_last_email", demoUser.email);
      } catch (err) {}
      toast.success("Authenticated as Omkar Bijamwar · Workstation unlocked.");
      onSuccess?.(demoUser);
      onClose();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      
      {/* ─────────────────────────────────────────────────────────────
          UIVERSE.IO ADAPTED AUTH BOX (DISTINCT SIGN UP & LOG IN)
          ───────────────────────────────────────────────────────────── */}
      <div className="sq_form_container">
        
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 text-[#8AA3AD] hover:text-[#FFFFFF] hover:bg-white/[0.08] transition-colors rounded-md cursor-pointer"
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {/* Logo Container (Uiverse .logo_container with SatQuery Space Theme) */}
        <div className="sq_logo_container">
          <div className="relative">
            <Globe size={32} className="text-[#12A5B8]" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
          </div>
        </div>

        {/* Title Container (Uiverse .title_container) */}
        <div className="sq_title_container">
          <h2 className="sq_title font-heading">
            {mode === "signup" ? "Create Mission ID" : "Operator Log In"}
          </h2>
          <p className="sq_subtitle font-sans">
            {mode === "signup"
              ? "Register your remote-sensing operator profile to unlock satellite scene analytics."
              : "Authenticate your credentials to resume high-resolution Earth observation."}
          </p>
        </div>

        {/* Remembered Identity Banner (For Log In Mode) */}
        {mode === "login" && rememberedName && (
          <div className="w-full px-3 py-1.5 rounded-lg bg-[#12A5B8]/10 border border-[#12A5B8]/25 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#12A5B8]">
              <CheckCircle2 size={13} />
              <span>Remembered: <strong className="text-white">{rememberedName}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFullName("");
                setRememberedName("");
              }}
              className="text-[#8AA3AD] hover:text-white underline cursor-pointer text-[10px]"
            >
              Change
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          
          {/* SIGN UP BOX: Asks for Name */}
          {mode === "signup" && (
            <div className="sq_input_container">
              <label className="sq_input_label">
                Full Name / Operator Name <span className="text-[#12A5B8]">*</span>
              </label>
              <div className="relative">
                <User className="sq_icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter your name (e.g. Omkar Bijamwar)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="sq_input_field font-sans"
                />
              </div>
            </div>
          )}

          {/* Email / Operator ID */}
          <div className="sq_input_container">
            <label className="sq_input_label">
              Work Email / Operator ID <span className="text-[#12A5B8]">*</span>
            </label>
            <div className="relative">
              <Mail className="sq_icon" />
              <input
                type="email"
                required
                placeholder="analyst@isro.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sq_input_field font-sans"
              />
            </div>
          </div>

          {/* Access Key / Password */}
          <div className="sq_input_container">
            <label className="sq_input_label">
              Access Key / Password <span className="text-[#12A5B8]">*</span>
            </label>
            <div className="relative">
              <Lock className="sq_icon" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sq_input_field font-sans pr-10"
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

          {/* SIGN UP BOX: Organization */}
          {mode === "signup" && (
            <div className="sq_input_container">
              <label className="sq_input_label">
                Research Body / Space Agency
              </label>
              <div className="relative">
                <Building2 className="sq_icon" />
                <select
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="sq_input_field font-sans appearance-none pr-8 cursor-pointer"
                >
                  <option value="ISRO National Remote Sensing Center">ISRO / NRSC Remote Sensing Center</option>
                  <option value="Defense Remote Sensing Agency">Defense Remote Sensing & Maritime Center</option>
                  <option value="Geological Survey of India">Geological Survey & Disaster Mitigation</option>
                  <option value="University Earth Observation Lab">Academic / Research Institution</option>
                </select>
              </div>
            </div>
          )}

          {/* Primary Action Button (Uiverse .sign-in_btn) */}
          <button
            type="submit"
            disabled={isLoading}
            className="sq_btn_primary mt-2"
          >
            {isLoading ? (
              <span>VERIFYING CREDENTIALS...</span>
            ) : (
              <>
                <span>{mode === "signup" ? "CREATE ID & ENTER WORKSTATION" : "LOG IN TO WORKSTATION"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Separator (Uiverse .separator) */}
          <div className="sq_separator my-2">
            <span className="line" />
            <span>OR QUICK ACCESS</span>
            <span className="line" />
          </div>

          {/* 1-Click Demo Shortcut (Uiverse .sign-in_ggl) */}
          <button
            type="button"
            onClick={handleQuickDemo}
            className="sq_btn_demo font-mono"
          >
            <ShieldCheck size={15} />
            <span>1-Click Demo: Omkar Bijamwar</span>
          </button>

          {/* Toggle between Sign Up Box & Log In Box (Uiverse .note) */}
          <div className="pt-2 text-center">
            {mode === "signup" ? (
              <p className="sq_note font-mono text-xs">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#12A5B8] font-bold underline hover:text-[#FFFFFF] cursor-pointer ml-1"
                >
                  Log in to your ID
                </button>
              </p>
            ) : (
              <p className="sq_note font-mono text-xs">
                Need a new mission ID?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#12A5B8] font-bold underline hover:text-[#FFFFFF] cursor-pointer ml-1"
                >
                  Sign up & create ID
                </button>
              </p>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}

export default AuthModal;
