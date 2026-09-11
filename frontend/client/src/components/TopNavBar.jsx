import React from "react";
// import { Link, useLocation } from "react-router-dom"; // not used
import { Settings } from "lucide-react";

/**
 * Persistent top navigation bar for SatQuery AI workbench.
 * Uses design‑system utilities for colours and typography.
 * Active link is highlighted with the primary amber accent.
 */
export function TopNavBar() {
  const location = { pathname: window.location.pathname };
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/investigation", label: "INVESTIGATE" },
    { path: "/vqa", label: "VQA" },
    { path: "/grounding", label: "GROUNDING" },
    { path: "/change", label: "CHANGE" },
    { path: "/optical-sar", label: "OPTICAL + SAR" },
    { path: "/evidence", label: "EVIDENCE" },
    { path: "/report", label: "REPORT" },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-background border-b border-card text-foreground font-display text-sm uppercase tracking-wider">
      {/* Left – logo */}
      <div className="font-bold text-primary">SatQuery AI</div>
      {/* Center – navigation links */}
      <nav className="flex gap-6">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`relative pb-1 transition-colors hover:text-primary ${isActive(item.path) ? "text-primary" : "text-foreground"}`}
          >
            {item.label}
            {isActive(item.path) && (
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-primary" />
            )}
          </a>
        ))}
      </nav>
      {/* Right – settings icon */}
      <button className="p-1 hover:bg-card rounded" aria-label="Settings">
        <Settings size={20} className="text-foreground" />
      </button>
    </header>
  );
}
