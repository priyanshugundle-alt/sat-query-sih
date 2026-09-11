import React, { useState, useRef, useEffect } from "react";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Search, 
  Activity, 
  Eye, 
  Upload, 
  Crosshair, 
  ShieldCheck,
  Compass,
  Database,
  ArrowUpRight
} from "lucide-react";
import { ScanlineSweep } from "./ScanlineSweep";

/**
 * SatelliteCanvasViewer (ISRO / SIH26167)
 * 
 * The Earth Observation Scientific Imaging Workstation:
 * - 80–90% Satellite Canvas Viewport
 * - Sharp technical corner telemetry and coordinate ticks
 * - Continuous smooth pan & mouse-wheel zoom (0.75x–4.0x)
 * - Bi-Temporal Before/After draggable temporal divider
 * - Optical + SAR Multimodal Sensor Fusion
 * - Follow Evidence camera focus on selected detections
 * - Signature Amber Observation Sweep Line
 */
export function SatelliteCanvasViewer({
  asset = null,
  secondaryAsset = null,
  isAnalyzing = false,
  analysisMode = "GROUNDING",
  detections = [],
  selectedDetectionId = null,
  onSelectDetection = () => {},
  onQuickAction = () => {},
  onUploadClick = () => {},
  onOpenLibrary = () => {},
}) {
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState({ lat: "18.52042", lon: "73.85671" });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  
  // Bi-Temporal Slider
  const [sliderPosition, setSliderPosition] = useState(50);
  const isDraggingSlider = useRef(false);

  const BASE_LAT = 18.5204;
  const BASE_LON = 73.8567;

  // Wheel Zoom (Continuous)
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoomLevel(prev => Math.max(0.75, Math.min(4.0, Number((prev + zoomDelta).toFixed(2)))));
  };

  // Drag to Pan
  const handleMouseDown = (e) => {
    if (e.target.closest(".sq-interactive-ctrl") || isDraggingSlider.current) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...panOffset };
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yRatio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const currentLat = (BASE_LAT + (0.5 - yRatio) * 0.012).toFixed(5);
    const currentLon = (BASE_LON + (xRatio - 0.5) * 0.012).toFixed(5);
    setCursorCoords({ lat: currentLat, lon: currentLon });

    if (isDraggingSlider.current && analysisMode === "CHANGE") {
      setSliderPosition(Math.max(0, Math.min(100, xRatio * 100)));
      return;
    }

    if (isDragging) {
      const dx = (e.clientX - dragStart.current.x) / zoomLevel;
      const dy = (e.clientY - dragStart.current.y) / zoomLevel;
      setPanOffset({ x: panStart.current.x + dx, y: panStart.current.y + dy });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isDraggingSlider.current = false;
  };

  const handleDoubleClick = () => {
    setZoomLevel(prev => (prev > 1.4 ? 1 : 2));
    setPanOffset({ x: 0, y: 0 });
  };

  // Follow Evidence Camera Movement
  useEffect(() => {
    if (selectedDetectionId && detections.length > 0) {
      const target = detections.find(d => d.id === selectedDetectionId);
      if (target) {
        setZoomLevel(2.0);
        const targetCenterX = target.box.left + target.box.width / 2;
        const targetCenterY = target.box.top + target.box.height / 2;
        setPanOffset({
          x: (50 - targetCenterX) * 3.5,
          y: (50 - targetCenterY) * 3.5,
        });
        if (target.lat && target.lon) {
          setCursorCoords({ lat: target.lat, lon: target.lon });
        }
      }
    }
  }, [selectedDetectionId, detections]);

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    onSelectDetection(null);
  };

  // ════════════════════════════════════════════════════════════════
  // 1. STANDBY STATE (No Scene Loaded — Scientific Empty State)
  // ════════════════════════════════════════════════════════════════
  if (!asset) {
    return (
      <div 
        ref={containerRef}
        className="relative w-full h-full bg-[#0B0D0C] overflow-hidden flex flex-col items-center justify-center p-6 select-none"
      >
        {/* Subtle coordinate grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="standbyGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#E9E5DA" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="1.5" fill="#D49A3A" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#standbyGrid)" />
        </svg>

        {/* Technical Corner Telemetry */}
        <div className="absolute top-4 left-4 font-mono text-[9px] text-[#9A9A90]/60 tracking-widest pointer-events-none uppercase">
          ISRO · SPACE TECHNOLOGY · SIH26167
        </div>
        <div className="absolute top-4 right-4 font-mono text-[9px] text-[#9A9A90]/60 tracking-widest pointer-events-none uppercase">
          WGS 84 / UTM ZONE 43N · EPSG:32643
        </div>

        {/* Center Scientific Mission Card */}
        <div className="relative z-10 max-w-lg text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#151817] border border-[#2A2E2B]">
            <span className="w-1.5 h-1.5 bg-[#D49A3A]" />
            <span className="font-mono text-[9px] tracking-widest text-[#D49A3A] uppercase font-bold">
              NO OBSERVATION
            </span>
          </div>

          <h2 className="font-sans text-2xl sm:text-3xl font-bold text-[#F3F0E8] tracking-tight">
            Awaiting Earth-Observation Input
          </h2>
          
          <p className="font-sans text-xs text-[#9A9A90] max-w-sm mx-auto leading-relaxed">
            Attach optical, SAR, or bi-temporal satellite imagery, or select a certified benchmark scene to begin natural-language investigation.
          </p>

          {/* Action Triggers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onUploadClick}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Upload size={14} />
              <span>+ ACQUIRE IMAGERY</span>
            </button>

            <button
              onClick={onOpenLibrary}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#151817] hover:bg-[#1D211F] border border-[#2A2E2B] text-[#E9E5DA] font-mono text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Database size={14} className="text-[#D49A3A]" />
              <span>BROWSE BENCHMARK SCENES</span>
            </button>
          </div>

          <div className="pt-4 font-mono text-[10px] text-[#9A9A90]/60 uppercase tracking-wider">
            ASK SATQUERY ABOUT EARTH OBSERVATION DATA
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // 2. ACTIVE STATE: 75-85% SATELLITE RASTER HERO CANVAS
  // ════════════════════════════════════════════════════════════════
  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full bg-[#0B0D0C] overflow-hidden select-none flex items-center justify-center ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      {/* ─── SINGLE UNIFIED CANVAS METADATA HEADER STRIP ─── */}
      <div className="absolute top-3 left-3 right-3 z-20 pointer-events-none flex items-center justify-between">
        <div className="px-3 py-1.5 bg-[#151817]/95 backdrop-blur-md border border-[#2A2E2B] font-mono text-xs flex items-center gap-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#D49A3A]" />
            <span className="font-bold text-[#F3F0E8] tracking-wide">
              {asset?.modality === "SAR" 
                ? "SENTINEL-1 C-BAND SAR" 
                : analysisMode === "FUSION" 
                ? "OPTICAL + SAR FUSION" 
                : "SENTINEL-2 MSI · OPTICAL"}
            </span>
          </div>
          <span className="text-[#2A2E2B]">|</span>
          <span className="text-[#E9E5DA] text-[11px]">GSD 0.5 M</span>
          <span className="text-[#2A2E2B]">|</span>
          <span className="text-[#D49A3A] font-bold text-[11px] flex items-center gap-1">
            <Crosshair size={11} />
            <span>{cursorCoords.lat}° N, {cursorCoords.lon}° E</span>
          </span>
          <span className="text-[#2A2E2B]">|</span>
          <span className="text-[#9A9A90] text-[10px] hidden sm:inline">WGS 84 · EPSG:4326</span>
        </div>

        {/* Observation Status Pill */}
        <div className="px-2.5 py-1 bg-[#151817]/90 backdrop-blur-sm border border-[#2A2E2B] font-mono text-[10px] text-[#9A9A90] hidden md:flex items-center gap-2">
          <span>1024×1024 PX</span>
          <span className="text-[#2A2E2B]">·</span>
          <span>ZOOM {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>

      {/* ─── HUD OVERLAY: BOTTOM-LEFT RASTER DIMENSIONS & TIMESTAMP ─── */}
      <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
        <div className="px-2.5 py-1 bg-[#151817]/90 backdrop-blur-sm border border-[#2A2E2B] font-mono text-[10px] text-[#9A9A90]">
          OBSERVATION 2026.08.24 05:42 UTC · 1024×1024 PX · ZOOM {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* ─── HUD OVERLAY: BOTTOM-RIGHT INTERACTIVE VIEWER CONTROLS ─── */}
      <div className="sq-interactive-ctrl absolute bottom-3 right-3 z-20 flex items-center gap-1">
        <button 
          onClick={() => setZoomLevel(prev => Math.min(4, prev + 0.25))}
          className="w-7 h-7 bg-[#151817] hover:bg-[#D49A3A] hover:text-[#0B0D0C] text-[#E9E5DA] border border-[#2A2E2B] flex items-center justify-center transition-colors"
          title="Zoom In (or mouse wheel)"
        >
          <ZoomIn size={13} />
        </button>
        <button 
          onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.25))}
          className="w-7 h-7 bg-[#151817] hover:bg-[#D49A3A] hover:text-[#0B0D0C] text-[#E9E5DA] border border-[#2A2E2B] flex items-center justify-center transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={13} />
        </button>
        <button 
          onClick={resetView}
          className="w-7 h-7 bg-[#151817] hover:bg-[#D49A3A] hover:text-[#0B0D0C] text-[#E9E5DA] border border-[#2A2E2B] flex items-center justify-center transition-colors"
          title="Reset View"
        >
          <RotateCcw size={12} />
        </button>
      </div>

      {/* ─── SATELLITE CANVAS HERO LAYER ─── */}
      <div 
        className="relative transition-transform duration-100 ease-out"
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        <img 
          src={asset.previewUrl} 
          alt="Satellite Scene" 
          className="max-h-[660px] w-auto max-w-full object-contain pointer-events-none shadow-2xl"
        />

        {/* ─── BI-TEMPORAL CHANGE COMPARISON (CHANGE MODE) ─── */}
        {analysisMode === "CHANGE" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="absolute inset-0 flex items-center justify-center overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img 
                src={secondaryAsset?.previewUrl || "/satquery-prism-optical.png"} 
                alt="T2 Pass" 
                className="max-h-[660px] w-auto max-w-full object-contain filter contrast-125"
              />
              <div className="absolute top-[32%] left-[40%] w-28 h-24 border border-[#D49A3A] bg-[#D49A3A]/20 animate-pulse flex items-center justify-center">
                <span className="bg-[#0B0D0C] text-[#D49A3A] font-mono text-[9px] px-2 py-0.5 font-bold">
                  +14.5% EXPANSION
                </span>
              </div>
            </div>

            <div 
              className="sq-interactive-ctrl absolute top-0 bottom-0 w-1 bg-[#D49A3A] shadow-[0_0_8px_#D49A3A] cursor-ew-resize pointer-events-auto z-20 flex items-center justify-center"
              style={{ left: `${sliderPosition}%` }}
              onMouseDown={(e) => { e.stopPropagation(); isDraggingSlider.current = true; }}
            >
              <div className="w-5 h-5 bg-[#0B0D0C] border border-[#D49A3A] flex items-center justify-center text-[#D49A3A] text-[9px] font-bold">
                ↔
              </div>
            </div>

            <div className="absolute bottom-6 px-3 py-1 bg-[#0B0D0C]/90 border border-[#2A2E2B] text-[10px] font-mono text-[#E9E5DA] shadow z-30 pointer-events-none">
              <span className="text-[#9A9A90]">BEFORE 2025 (T1)</span>
              <span className="text-[#D49A3A] mx-2">──────●──────</span>
              <span className="text-[#E4B65A] font-bold">AFTER 2026 (T2) · 3 CHANGES</span>
            </div>
          </div>
        )}

        {/* ─── OPTICAL + SAR FUSION LAYER (FUSION MODE) ─── */}
        {analysisMode === "FUSION" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-[#76AEB0]/15 mix-blend-color-dodge flex items-center justify-center">
              <div className="absolute top-[38%] left-[28%] w-40 h-32 border border-[#76AEB0] bg-[#76AEB0]/20 animate-pulse flex flex-col items-center justify-center p-2">
                <span className="text-[10px] font-mono font-bold text-[#76AEB0] bg-[#0B0D0C] px-2 py-0.5">
                  SAR C-BAND RADAR
                </span>
                <span className="text-[9px] font-mono text-[#E9E5DA] mt-1">
                  Cloud Penetration Active
                </span>
              </div>
            </div>

            <div className="absolute top-12 px-3 py-1 bg-[#0B0D0C]/90 border border-[#76AEB0] text-[10px] font-mono text-[#E9E5DA] flex items-center gap-2">
              <span className="text-[#D49A3A]">OPTICAL MSI</span>
              <span className="text-[#9A9A90]">⤹ CONVERGENCE ⤸</span>
              <span className="text-[#76AEB0]">SAR BACKSCATTER</span>
              <span className="text-[#68745C] font-bold ml-1">FUSED ◎</span>
            </div>
          </div>
        )}

        {/* ─── SHARP TECHNICAL AMBER BOUNDING BOXES (GROUNDING / VQA) ─── */}
        {(analysisMode === "GROUNDING" || analysisMode === "VQA" || detections.length > 0) && (
          <div className="absolute inset-0 pointer-events-none">
            {detections.map((det) => {
              const isSelected = selectedDetectionId === det.id;
              return (
                <div 
                  key={det.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDetection(det.id);
                  }}
                  className={`sq-interactive-ctrl absolute pointer-events-auto cursor-pointer transition-all duration-150 ${
                    isSelected ? "z-30 scale-102" : "z-20 hover:opacity-90"
                  }`}
                  style={{
                    top: `${det.box.top}%`,
                    left: `${det.box.left}%`,
                    width: `${det.box.width}%`,
                    height: `${det.box.height}%`,
                  }}
                >
                  <svg className="absolute inset-0 w-full h-full overflow-visible">
                    <rect
                      x="0"
                      y="0"
                      width="100%"
                      height="100%"
                      fill={isSelected ? "rgba(212, 154, 58, 0.2)" : "rgba(212, 154, 58, 0.06)"}
                      stroke="#D49A3A"
                      strokeWidth={isSelected ? "2" : "1"}
                      strokeDasharray="4 2"
                    />
                  </svg>

                  {/* Target Label, Class & Confidence Tag */}
                  <div 
                    className={`absolute -top-5 left-0 px-1.5 py-0.5 flex items-center gap-1 font-mono text-[9px] font-bold whitespace-nowrap transition-colors ${
                      isSelected 
                        ? "bg-[#D49A3A] text-[#0B0D0C]" 
                        : "bg-[#0B0D0C] text-[#E9E5DA] border border-[#2A2E2B]"
                    }`}
                  >
                    <span>{det.label}</span>
                    <span className="opacity-80 font-normal">· {det.confidence}%</span>
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 border border-[#D49A3A] animate-ping opacity-50 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Remote Sensing Amber Scanline Sweep */}
        <ScanlineSweep active={isAnalyzing} duration="2.2s" />
      </div>
    </div>
  );
}

export default SatelliteCanvasViewer;
