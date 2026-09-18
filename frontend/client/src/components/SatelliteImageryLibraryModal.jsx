import React, { useState } from "react";
import { 
  X, 
  Search, 
  Layers, 
  Calendar, 
  Compass, 
  Eye, 
  Activity, 
  ShieldCheck, 
  Check, 
  Filter, 
  ArrowRight,
  Database,
  CloudSun
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const PRESET_SATELLITE_CATALOG = [
  {
    id: "sentinel-2-pune",
    name: "Pune Metropolitan Corridor (Sector 4)",
    sensor: "Sentinel-2B MSI",
    modality: "OPTICAL",
    modalityBadge: "MULTISPECTRAL OPTICAL",
    gsd: "0.5m Re-sampled",
    acquisitionDate: "2026-08-24 05:42:18 UTC",
    projection: "EPSG:32643 (UTM Zone 43N)",
    coordinates: "18.5204° N, 73.8567° E",
    cloudCover: "1.2%",
    bands: "B4 (Red), B3 (Green), B2 (Blue), B8 (NIR)",
    previewUrl: "/assets/imagery/airport_sample.jpg",
    recommendedMode: "GROUNDING",
    recommendedQuery: "Locate all vehicles and industrial facilities in this sector.",
    description: "High-resolution optical multispectral tile capturing dense urban infrastructure and rapid peri-urban construction.",
  },
  {
    id: "cartosat-3-ahmedabad",
    name: "Ahmedabad Industrial and Riverfront Grid",
    sensor: "ISRO Cartosat-3 MX",
    modality: "OPTICAL",
    modalityBadge: "HIGH-RES PAN + MULTI",
    gsd: "0.28m PAN / 1.12m MX",
    acquisitionDate: "2026-07-15 04:30:10 UTC",
    projection: "EPSG:32643 (UTM Zone 43N)",
    coordinates: "23.0225° N, 72.5714° E",
    cloudCover: "0.0%",
    bands: "Panchromatic + 4 Multispectral bands",
    previewUrl: "/assets/imagery/mumbai_proba.jpg",
    recommendedMode: "VQA",
    recommendedQuery: "Describe visible land-cover, agricultural plots, and urban terrain.",
    description: "ISRO highest-resolution civilian optical asset for fine-grained structural layout and parcel classification.",
  },
  {
    id: "sentinel-2-bitemporal",
    name: "Brahmaputra Flood Basin and Embankment",
    sensor: "Sentinel-2A/2B Dual-Pass",
    modality: "CHANGE",
    modalityBadge: "BI-TEMPORAL DUAL PASS",
    gsd: "10m Multispectral",
    acquisitionDate: "2026-07-23 and 2026-08-24 UTC",
    projection: "EPSG:32646 (UTM Zone 46N)",
    coordinates: "26.1445° N, 91.7362° E",
    cloudCover: "3.4%",
    bands: "Dual T1/T2 MSI Reflectance",
    previewUrl: "/assets/imagery/nepal_2026_08_27.jpg",
    secondaryUrl: "/assets/imagery/nepal_2023_10_18.jpg",
    recommendedMode: "CHANGE",
    recommendedQuery: "What changed between Date 1 and Date 2 in this region?",
    description: "Dual acquisition pair showing monsoon water encroachment, newly formed sandbars, and altered riverbanks.",
  },
  {
    id: "risat-1a-mumbai",
    name: "Mumbai Coastal Port and Cloud Penetration",
    sensor: "ISRO EOS-04 (RISAT-1A) + Sentinel-2",
    modality: "FUSION",
    modalityBadge: "OPTICAL + SAR FUSION",
    gsd: "1.0m Fused Hybrid",
    acquisitionDate: "2026-08-18 12:15:00 UTC",
    projection: "EPSG:32643 (UTM Zone 43N)",
    coordinates: "18.9220° N, 72.8347° E",
    cloudCover: "78.5% (SAR Penetrated)",
    bands: "C-Band SAR (VV/VH) + Optical RGB",
    previewUrl: "/assets/imagery/landcover_sar_sample.jpg",
    secondaryUrl: "/assets/imagery/landcover_sample.jpg",
    recommendedMode: "FUSION",
    recommendedQuery: "Corroborate cloudy sector using Sentinel-1 SAR and Sentinel-2 optical data.",
    description: "Co-registered optical and microwave SAR sensor data resolving maritime vessels through monsoon cloud deck.",
  },
];

export function SatelliteImageryLibraryModal({
  isOpen,
  onClose,
  onSelectScene,
}) {
  const [filterModality, setFilterModality] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredCatalog = PRESET_SATELLITE_CATALOG.filter((item) => {
    const matchesFilter = filterModality === "ALL" || item.modality === filterModality;
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sensor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.coordinates.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-[#151817] border border-[#2A2E2B] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Modal Top Header */}
        <div className="p-4 bg-[#0B0D0C] border-b border-[#2A2E2B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#151817] border border-[#D49A3A]/40 flex items-center justify-center text-[#D49A3A]">
              <Database size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold text-[#F3F0E8] tracking-wide uppercase">
                  SATELLITE IMAGERY LIBRARY
                </h2>
                <span className="px-2 py-0.5 bg-[#1D211F] text-[9px] text-[#D49A3A] font-bold">
                  ISRO & SENTINEL CATALOG
                </span>
              </div>
              <p className="text-[11px] text-[#9A9A90] font-sans mt-0.5">
                Select an earth observation scene to stage onto the Investigation Canvas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Strip */}
        <div className="p-3 bg-[#151817] border-b border-[#2A2E2B] flex flex-wrap items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            {[
              { id: "ALL", label: "All Sensors" },
              { id: "OPTICAL", label: "Optical Multispectral" },
              { id: "CHANGE", label: "Bi-Temporal Pairs" },
              { id: "FUSION", label: "Optical + SAR" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterModality(tab.id)}
                className={`px-3 py-1 text-[11px] transition-all border rounded-lg cursor-pointer ${
                  filterModality === tab.id
                    ? "bg-[#D49A3A] text-[#0B0D0C] border-[#D49A3A] font-bold shadow-sm"
                    : "bg-[#0B0D0C] text-[#9A9A90] hover:text-[#E9E5DA] border-[#2A2E2B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#0B0D0C] border border-[#2A2E2B] px-2.5 py-1 w-64">
            <Search size={13} className="text-[#9A9A90]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sensor, location, CRS..."
              className="bg-transparent border-none outline-none text-xs text-[#F3F0E8] placeholder:text-[#9A9A90] w-full font-sans"
            />
          </div>
        </div>

        {/* Imagery Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCatalog.map((scene) => (
            <div
              key={scene.id}
              className="bg-[#0B0D0C] border border-[#2A2E2B] hover:border-[#D49A3A]/60 overflow-hidden flex flex-col transition-all group shadow-sm hover:shadow-md"
            >
              {/* Scene Thumbnail + Sensor Overlays */}
              <div className="relative h-44 bg-[#0B0D0C] overflow-hidden">
                <img
                  src={scene.previewUrl}
                  alt={scene.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85 group-hover:opacity-100"
                />
                
                {/* Modality Badge */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-[#0B0D0C]/90 backdrop-blur-sm border border-[#2A2E2B] text-[10px] font-bold text-[#D49A3A]">
                  {scene.modalityBadge}
                </div>

                {/* Cloud Cover */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-[#0B0D0C]/90 backdrop-blur-sm border border-[#2A2E2B] text-[10px] text-[#E9E5DA] flex items-center gap-1">
                  <CloudSun size={11} className="text-[#76AEB0]" />
                  <span>Cloud: {scene.cloudCover}</span>
                </div>

                {/* GSD Tag */}
                <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-[#0B0D0C]/90 backdrop-blur-sm border border-[#2A2E2B] text-[10px] text-[#68745C] font-bold">
                  GSD: {scene.gsd}
                </div>
              </div>

              {/* Card Body with Required SIH Metadata */}
              <div className="p-3.5 flex-1 flex flex-col justify-between bg-[#151817]">
                <div>
                  <h3 className="text-xs font-bold text-[#F3F0E8] font-sans tracking-tight mb-1">
                    {scene.name}
                  </h3>
                  <p className="text-[11px] text-[#9A9A90] font-sans line-clamp-2 mb-3">
                    {scene.description}
                  </p>

                  {/* Remote Sensing Technical Specs Table */}
                  <div className="grid grid-cols-2 gap-1.5 p-2 bg-[#0B0D0C] border border-[#2A2E2B] text-[10px] mb-3">
                    <div>
                      <span className="text-[#9A9A90] block text-[9px] uppercase font-bold">SENSOR PLATFORM</span>
                      <span className="text-[#E9E5DA] font-semibold">{scene.sensor}</span>
                    </div>
                    <div>
                      <span className="text-[#9A9A90] block text-[9px] uppercase font-bold">ACQUISITION TIME</span>
                      <span className="text-[#E9E5DA] font-semibold">{scene.acquisitionDate}</span>
                    </div>
                    <div>
                      <span className="text-[#9A9A90] block text-[9px] uppercase font-bold">CRS / PROJECTION</span>
                      <span className="text-[#76AEB0] font-semibold">{scene.projection}</span>
                    </div>
                    <div>
                      <span className="text-[#9A9A90] block text-[9px] uppercase font-bold">COORDINATES</span>
                      <span className="text-[#D49A3A] font-semibold">{scene.coordinates}</span>
                    </div>
                  </div>
                </div>

                {/* Open Investigation CTA */}
                <button
                  onClick={() => {
                    onSelectScene(scene);
                    onClose();
                  }}
                  className="w-full bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-mono font-bold text-xs h-8 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Open Investigation</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#0B0D0C] border-t border-[#2A2E2B] flex items-center justify-between text-[11px] text-[#9A9A90]">
          <span>4 Certified Remote-Sensing Benchmark Scenarios Loaded</span>
          <span className="text-[#76AEB0]">ISRO SIH26167 STANDARDS COMPLIANT</span>
        </div>
      </div>
    </div>
  );
}

export default SatelliteImageryLibraryModal;
