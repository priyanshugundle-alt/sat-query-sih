/**
 * Scan-Reveal Animation Component
 * 
 * Sweeps a thin amber scan-line across satellite imagery from left to right.
 * As it passes, reveals analysis overlays (bounding boxes, diff highlights, fusion blends).
 * 
 * Motivated by actual domain practice (radar/SAR sweep revealing hidden information).
 * Implements as CSS clip-path animation with prefers-reduced-motion fallback.
 */

import { useState, useEffect } from "react";

export function ScanReveal({ 
  children, 
  trigger = false, 
  duration = 2000,
  onComplete 
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  useEffect(() => {
    if (trigger && !scanComplete) {
      setIsScanning(true);
      const timer = setTimeout(() => {
        setIsScanning(false);
        setScanComplete(true);
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [trigger, scanComplete, duration, onComplete]);

  // Reset when trigger changes
  useEffect(() => {
    if (!trigger) {
      setIsScanning(false);
      setScanComplete(false);
    }
  }, [trigger]);

  return (
    <div className="scan-reveal-container">
      <div className="scan-reveal-content">
        {children}
      </div>
      
      {/* Scan line that sweeps across */}
      {isScanning && (
        <div 
          className="scan-line" 
          style={{ animationDuration: `${duration}ms` }}
          aria-hidden="true"
        />
      )}
      
      {/* Overlay content revealed by scan */}
      {scanComplete && (
        <div 
          className="scan-reveal-overlay absolute inset-0 pointer-events-none"
          style={{ animationDuration: `${duration}ms` }}
        >
          {/* Overlay content passed via children or separate prop */}
        </div>
      )}
    </div>
  );
}

/**
 * Usage Example:
 * 
 * <ScanReveal trigger={isComplete}>
 *   <img src={satelliteImage} alt="Analysis" />
 * </ScanReveal>
 */
