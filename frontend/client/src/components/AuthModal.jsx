import React, { useState, useEffect } from "react";
import { X, Lock, Mail, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function AuthModal({ isOpen, onClose, initialMode = "signup", onSuccess }) {
  // Mode: "signup" vs "login"
  const [mode, setMode] = useState(initialMode === "login" ? "login" : "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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
        organization: "Earth Observation Directorate",
        role: "Satellite Analyst",
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
        toast.success(`Account created for ${chosenName}. Logged into workstation.`);
      } else {
        toast.success(`Welcome back, ${chosenName}. Logged in.`);
      }

      onSuccess?.(userData);
      onClose();
    }, 280);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      
      {/* ─────────────────────────────────────────────────────────────
          UIVERSE.IO ADAPTED AUTH BOX (CLEAN, MINIMALIST SIGN UP & LOG IN)
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

        {/* Clean Title */}
        <div className="w-full text-center pb-1 pt-1">
          <h2 className="sq_title font-heading text-xl font-bold tracking-tight text-white">
            {mode === "signup" ? "Sign Up" : "Log In"}
          </h2>
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
        <form onSubmit={handleSubmit} className="w-full space-y-3.5 mt-1">
          
          {/* SIGN UP BOX: Asks for Name */}
          {mode === "signup" && (
            <div className="sq_input_container">
              <label className="sq_input_label">
                Name <span className="text-[#12A5B8]">*</span>
              </label>
              <div className="relative">
                <User className="sq_icon" />
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="sq_input_field font-sans"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="sq_input_container">
            <label className="sq_input_label">
              Email <span className="text-[#12A5B8]">*</span>
            </label>
            <div className="relative">
              <Mail className="sq_icon" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="sq_input_field font-sans"
              />
            </div>
          </div>

          {/* Password */}
          <div className="sq_input_container">
            <label className="sq_input_label">
              Password <span className="text-[#12A5B8]">*</span>
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

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="sq_btn_primary mt-2"
          >
            {isLoading ? (
              <span>VERIFYING...</span>
            ) : (
              <>
                <span>{mode === "signup" ? "SIGN UP" : "LOG IN"}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Toggle between Sign Up & Log In */}
          <div className="pt-2 text-center">
            {mode === "signup" ? (
              <p className="sq_note font-mono text-xs">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-[#12A5B8] font-bold underline hover:text-[#FFFFFF] cursor-pointer ml-1"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p className="sq_note font-mono text-xs">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-[#12A5B8] font-bold underline hover:text-[#FFFFFF] cursor-pointer ml-1"
                >
                  Sign Up
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
