import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crosshair,
  Layers,
  ExternalLink,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Globe
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─────────────────────────────────────────────────────────────────────────────
// Geodetic Conversion: UTM (Universal Transverse Mercator) to WGS84 Lat/Lon
// ─────────────────────────────────────────────────────────────────────────────
export function utmToLatLon(easting, northing, zone = 33, northern = true) {
  const a = 6378137.0; // WGS84 semi-major axis
  const f = 1 / 298.257223563;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  const e_prime2 = (a * a - b * b) / (b * b);
  const k0 = 0.9996;

  const x = easting - 500000.0;
  const y = northern ? northing : northing - 10000000.0;

  const m = y / k0;
  const mu = m / (a * (1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256));

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const j1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32;
  const j2 = (21 * Math.pow(e1, 2)) / 16 - (55 * Math.pow(e1, 4)) / 32;
  const j3 = (151 * Math.pow(e1, 3)) / 96;
  const j4 = (1097 * Math.pow(e1, 4)) / 512;

  const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);

  const c1 = e_prime2 * Math.pow(Math.cos(fp), 2);
  const t1 = Math.pow(Math.tan(fp), 2);
  const r1 = (a * (1 - e2)) / Math.pow(1 - e2 * Math.pow(Math.sin(fp), 2), 1.5);
  const n1 = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(fp), 2));

  const d = x / (n1 * k0);

  const fact1 = (n1 * Math.tan(fp)) / r1;
  const fact2 = Math.pow(d, 2) / 2;
  const fact3 = ((5 + 3 * t1 + 10 * c1 - 4 * Math.pow(c1, 2) - 9 * e_prime2) * Math.pow(d, 4)) / 24;
  const fact4 = ((61 + 90 * t1 + 298 * c1 + 45 * Math.pow(t1, 2) - 252 * e_prime2 - 3 * Math.pow(c1, 2)) * Math.pow(d, 6)) / 720;
  const latRad = fp - fact1 * (fact2 - fact3 + fact4);

  const fact2_lon = d;
  const fact3_lon = ((1 + 2 * t1 + c1) * Math.pow(d, 3)) / 6;
  const fact4_lon = ((5 - 2 * c1 + 28 * t1 - 3 * Math.pow(c1, 2) + 8 * e_prime2 + 24 * Math.pow(t1, 2)) * Math.pow(d, 5)) / 120;
  const lonRad = (fact2_lon - fact3_lon + fact4_lon) / Math.cos(fp);

  const lonOrigin = (zone - 1) * 6 - 180 + 3;
  const lat = (latRad * 180) / Math.PI;
  const lon = lonOrigin + (lonRad * 180) / Math.PI;

  return { lat, lon };
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust Coordinate Parser: Handles DMS, decimal WGS84, and UTM projected meters
// ─────────────────────────────────────────────────────────────────────────────
export function parseCoordinates(input, locationName = "", metadata = null) {
  if (!input) return { lat: 19.0760, lon: 72.8777, label: "19.0760° N, 72.8777° E" };

  let rawLat = null;
  let rawLon = null;

  // If already an object with lat/lon
  if (typeof input === "object" && input !== null) {
    if (typeof input.lat === "number" && typeof input.lon === "number") {
      rawLat = input.lat;
      rawLon = input.lon;
    } else if (typeof input.latitude === "number" && typeof input.longitude === "number") {
      rawLat = input.latitude;
      rawLon = input.longitude;
    } else if (Array.isArray(input) && input.length >= 2) {
      const p1 = parseFloat(input[0]);
      const p2 = parseFloat(input[1]);
      if (!isNaN(p1) && !isNaN(p2)) {
        rawLat = p1;
        rawLon = p2;
      }
    }
  }

  const str = String(input).trim();

  // Pattern: 19.0760° N, 72.8777° E or 19.0760 N, 72.8777 E
  if (rawLat === null) {
    const dmsRegex = /([\d.]+)\s*°?\s*([NSEW])\s*,\s*([\d.]+)\s*°?\s*([NSEW])/i;
    const dmsMatch = str.match(dmsRegex);
    if (dmsMatch) {
      let latVal = parseFloat(dmsMatch[1]);
      const latDir = dmsMatch[2].toUpperCase();
      let lonVal = parseFloat(dmsMatch[3]);
      const lonDir = dmsMatch[4].toUpperCase();

      if (latDir === "S") latVal = -latVal;
      if (lonDir === "W") lonVal = -lonVal;

      rawLat = latVal;
      rawLon = lonVal;
    }
  }

  // Pattern: 18.5204, 73.8567 or 331200, 5330400
  if (rawLat === null) {
    const pairRegex = /([-+]?[\d.]+)[°\s,]+([-+]?[\d.]+)[°\s]*/;
    const pairMatch = str.match(pairRegex);
    if (pairMatch) {
      rawLat = parseFloat(pairMatch[1]);
      rawLon = parseFloat(pairMatch[2]);
    }
  }

  if (rawLat === null || isNaN(rawLat) || rawLon === null || isNaN(rawLon)) {
    return { lat: 19.0760, lon: 72.8777, label: "19.0760° N, 72.8777° E" };
  }

  // ── AUTOMATIC PROJECTED / UTM CONVERSION ─────────────────────────────
  // If coordinates are in meters (> 90 lat or > 180 lon) e.g. UTM 331200, 5330400
  if (Math.abs(rawLat) > 90 || Math.abs(rawLon) > 180) {
    let easting = rawLat;
    let northing = rawLon;

    // Usually Northing > Easting in northern mid-latitudes (northing ~5,000,000m, easting ~300,000m)
    if (Math.abs(easting) > Math.abs(northing)) {
      const temp = easting;
      easting = northing;
      northing = temp;
    }

    // Infer UTM zone from location name, filename, or metadata
    const context = `${str} ${locationName || ""} ${metadata ? JSON.stringify(metadata) : ""}`;
    let zone = 33; // Default Sentinel-2 central Europe / world default
    let northern = true;

    // Check MGRS / Sentinel-2 tile e.g. T33UUP, T43RFS
    const mgrsMatch = context.match(/T(\d{2})([A-Z])/i);
    if (mgrsMatch) {
      zone = parseInt(mgrsMatch[1], 10);
      northern = mgrsMatch[2].toUpperCase() >= "N";
    } else {
      // Check EPSG:326xx (North) or EPSG:327xx (South)
      const epsgMatch = context.match(/(?:EPSG:?|32)([67])(\d{2})/i);
      if (epsgMatch) {
        northern = epsgMatch[1] === "6";
        zone = parseInt(epsgMatch[2], 10);
      } else {
        const zoneMatch = context.match(/(?:UTM|ZONE)[\s-_]*(\d{1,2})\s*([NS])?/i);
        if (zoneMatch) {
          zone = parseInt(zoneMatch[1], 10);
          if (zoneMatch[2]) northern = zoneMatch[2].toUpperCase() === "N";
        }
      }
    }

    const { lat, lon } = utmToLatLon(easting, northing, zone, northern);
    const latDir = lat >= 0 ? "N" : "S";
    const lonDir = lon >= 0 ? "E" : "W";

    return {
      lat,
      lon,
      label: `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir} (UTM ${zone}${northern ? "N" : "S"})`,
      isUtm: true,
      easting,
      northing,
      zone
    };
  }

  // Standard WGS84 Decimal Degrees
  const latDir = rawLat >= 0 ? "N" : "S";
  const lonDir = rawLon >= 0 ? "E" : "W";
  return {
    lat: rawLat,
    lon: rawLon,
    label: `${Math.abs(rawLat).toFixed(4)}° ${latDir}, ${Math.abs(rawLon).toFixed(4)}° ${lonDir}`
  };
}

export function LeafletSatelliteModal({
  isOpen,
  onClose,
  coordinates = "19.0760° N, 72.8777° E",
  locationName = "Satellite Observation Site",
  metadata = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const layerControlRef = useRef({ baseLayer: null, labelsLayer: null });

  const [activeLayerType, setActiveLayerType] = useState("satellite-hybrid"); // 'satellite-hybrid', 'satellite-google', 'satellite-esri', 'osm'
  const [copied, setCopied] = useState(false);
  const [liveCursorCoords, setLiveCursorCoords] = useState(null);

  const parsed = parseCoordinates(coordinates, locationName, metadata);
  const [pinnedCoords, setPinnedCoords] = useState({ lat: parsed.lat, lon: parsed.lon, label: parsed.label });
  const [customCoordInput, setCustomCoordInput] = useState(parsed.label || `${parsed.lat.toFixed(5)}, ${parsed.lon.toFixed(5)}`);

  useEffect(() => {
    setPinnedCoords({ lat: parsed.lat, lon: parsed.lon, label: parsed.label });
    setCustomCoordInput(parsed.label || `${parsed.lat.toFixed(5)}, ${parsed.lon.toFixed(5)}`);
  }, [parsed.lat, parsed.lon, parsed.label]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Destroy existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    let map = null;
    let resizeObserver = null;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      map = L.map(mapContainerRef.current, {
        center: [parsed.lat, parsed.lon],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });
      mapInstanceRef.current = map;

      // 1. Default: Esri World Imagery (High-Res True Satellite)
      const esriSatellite = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Tiles © Esri"
        }
      ).addTo(map);

      // 2. Hybrid Reference Labels (Boundaries, Cities, Highways)
      const esriLabels = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19
        }
      ).addTo(map);

      layerControlRef.current = {
        baseLayer: esriSatellite,
        labelsLayer: esriLabels
      };

      // 3. Custom Glowing Radar Target Reticle Icon (centered anchor with pointer events)
      const radarIcon = L.divIcon({
        className: "custom-radar-marker",
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; pointer-events: auto;">
            <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; border: 2px solid #D49A3A; opacity: 0.6; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; border: 1.5px dashed #76AEB0; animation: spin 8s linear infinite;"></div>
            <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background: rgba(212, 154, 58, 0.4); border: 2px solid #F3F0E8;"></div>
            <div style="width: 4px; height: 4px; border-radius: 50%; background: #D49A3A; box-shadow: 0 0 8px #D49A3A;"></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([parsed.lat, parsed.lon], { icon: radarIcon, interactive: true }).addTo(map);
      markerRef.current = marker;

      marker.on("click", () => {
        marker.openPopup();
      });

      // Interactive Click Anywhere on Map to move pin and inspect coordinates
      map.on("click", (e) => {
        const cLat = e.latlng.lat;
        const cLon = e.latlng.lng;
        setPinnedCoords({ lat: cLat, lon: cLon, label: `${cLat.toFixed(5)}° N, ${cLon.toFixed(5)}° E` });
        setCustomCoordInput(`${cLat.toFixed(5)}, ${cLon.toFixed(5)}`);
        marker.setLatLng([cLat, cLon]);
        const clickPopup = `
          <div style="font-family: monospace; background: #0B0D0C; color: #F3F0E8; padding: 6px; border: 1px solid #D49A3A; font-size: 11px;">
            <div style="color: #D49A3A; font-weight: bold; margin-bottom: 2px;">📍 PINNED LOCATION</div>
            <div style="color: #76AEB0; font-size: 12px; font-weight: bold; margin-bottom: 4px;">
              LAT: ${cLat.toFixed(6)}°<br/>LON: ${cLon.toFixed(6)}°
            </div>
            <div style="font-size: 9px; color: #9A9A90; border-top: 1px solid #2A2E2B; padding-top: 3px;">
              LOCATION PINNED FROM MAP CLICK
            </div>
          </div>
        `;
        marker.bindPopup(clickPopup, { className: "satquery-leaflet-popup", closeButton: false }).openPopup();
      });

      // Popup with site telemetry
      const popupHtml = `
        <div style="font-family: monospace; background: #0B0D0C; color: #F3F0E8; padding: 6px; border: 1px solid #D49A3A; font-size: 11px;">
          <div style="color: #D49A3A; font-weight: bold; margin-bottom: 2px; text-transform: uppercase;">
            📍 TARGET LOCATION
          </div>
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">
            ${locationName || "Observation Target"}
          </div>
          <div style="color: #76AEB0; margin-bottom: 4px;">
            LAT: ${parsed.lat.toFixed(6)}°<br/>
            LON: ${parsed.lon.toFixed(6)}°
          </div>
          <div style="font-size: 9px; color: #9A9A90; border-top: 1px solid #2A2E2B; padding-top: 3px;">
            ISRO / SENTINEL SATELLITE PASS CO-LOCATED
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml, { className: "satquery-leaflet-popup", closeButton: false });

      // Live cursor tracking
      map.on("mousemove", (e) => {
        setLiveCursorCoords({
          lat: e.latlng.lat.toFixed(5),
          lon: e.latlng.lng.toFixed(5)
        });
      });

      // Periodic invalidateSize to guarantee complete tile render after Framer-motion transition
      map.invalidateSize();
      setTimeout(() => map?.invalidateSize(), 150);
      setTimeout(() => map?.invalidateSize(), 400);

      // Resize observer to always keep tiles full width/height
      if (window.ResizeObserver && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          map?.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, parsed.lat, parsed.lon, locationName]);

  // Handle layer switching
  const handleSwitchLayer = (type) => {
    setActiveLayerType(type);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (layerControlRef.current.baseLayer) map.removeLayer(layerControlRef.current.baseLayer);
    if (layerControlRef.current.labelsLayer) map.removeLayer(layerControlRef.current.labelsLayer);

    if (type === "satellite-hybrid") {
      layerControlRef.current.baseLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);
      layerControlRef.current.labelsLayer = L.tileLayer(
        "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);
    } else if (type === "satellite-google") {
      layerControlRef.current.baseLayer = L.tileLayer(
        "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
        { maxZoom: 20 }
      ).addTo(map);
    } else if (type === "satellite-pure") {
      layerControlRef.current.baseLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19 }
      ).addTo(map);
    } else if (type === "osm") {
      layerControlRef.current.baseLayer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { maxZoom: 19 }
      ).addTo(map);
    }
  };

  const handleGoToCustomCoords = (inputOverride) => {
    const targetText = inputOverride || customCoordInput;
    const res = parseCoordinates(targetText, locationName, metadata);
    if (res && !isNaN(res.lat) && !isNaN(res.lon)) {
      setPinnedCoords({ lat: res.lat, lon: res.lon, label: res.label });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([res.lat, res.lon], 15, { animate: true });
      }
      if (markerRef.current) {
        markerRef.current.setLatLng([res.lat, res.lon]);
        markerRef.current.openPopup();
      }
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([pinnedCoords.lat, pinnedCoords.lon], 15, { animate: true });
      if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${pinnedCoords.lat.toFixed(6)}, ${pinnedCoords.lon.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parsed.lat},${parsed.lon}`;
  const googleEarthUrl = `https://earth.google.com/web/search/${parsed.lat},${parsed.lon}`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0B0D0C]/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[85vh] bg-[#0E1110] border border-[#2A2E2B] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* ── Modal Header ── */}
          <div className="h-14 px-4 bg-[#151817] border-b border-[#2A2E2B] flex items-center justify-between font-mono text-xs z-10 flex-shrink-0">
            <div className="flex items-center gap-2.5 overflow-hidden flex-1 sm:flex-initial">
              <span className="w-2.5 h-2.5 bg-[#D49A3A] shadow-[0_0_8px_#D49A3A] flex-shrink-0" />
              <div className="truncate hidden md:flex items-center gap-1.5">
                <span className="font-bold text-[#F3F0E8] uppercase tracking-wider">
                  LEAFLET SATELLITE MAP VIEWER
                </span>
                <span className="text-[#9A9A90] mx-1">·</span>
              </div>
              {/* Interactive Click-in Coordinate Bar */}
              <div className="flex items-center gap-1.5 bg-[#0B0D0C] border border-[#2A2E2B] focus-within:border-[#D49A3A] px-2 py-1 max-w-[260px] sm:max-w-xs flex-1">
                <Crosshair size={12} className="text-[#D49A3A] flex-shrink-0" />
                <input
                  type="text"
                  value={customCoordInput}
                  onChange={(e) => setCustomCoordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGoToCustomCoords();
                  }}
                  placeholder="Click here to type/paste coords..."
                  className="bg-transparent text-[#F3F0E8] font-mono text-xs w-full focus:outline-none placeholder-[#666]"
                  title="Click in this box to edit or enter coordinates"
                />
                <button
                  type="button"
                  onClick={() => handleGoToCustomCoords()}
                  className="px-2 py-0.5 bg-[#D49A3A] hover:bg-[#E4B65A] text-[#0B0D0C] font-bold text-[10px] transition-colors cursor-pointer flex-shrink-0"
                  title="Fly to entered coordinates"
                >
                  GO
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCoords}
                className="px-2.5 py-1 bg-[#0B0D0C] hover:bg-[#1D211F] text-[#E9E5DA] border border-[#2A2E2B] text-[11px] transition-colors cursor-pointer flex items-center gap-1.5"
                title="Copy lat, lon decimal coordinates"
              >
                {copied ? <Check size={12} className="text-[#68745C]" /> : <Copy size={12} />}
                <span>{copied ? "COPIED" : "COPY COORDS"}</span>
              </button>

              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-[#0B0D0C] hover:bg-[#1D211F] text-[#E9E5DA] hover:text-[#D49A3A] border border-[#2A2E2B] text-[11px] transition-colors flex items-center gap-1"
                title="Open in Google Maps"
              >
                <ExternalLink size={12} />
                <span className="hidden sm:inline">GOOGLE MAPS</span>
              </a>

              <a
                href={googleEarthUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 bg-[#0B0D0C] hover:bg-[#1D211F] text-[#D49A3A] border border-[#D49A3A]/40 text-[11px] transition-colors flex items-center gap-1"
                title="Open 3D Google Earth"
              >
                <Globe size={12} />
                <span className="hidden sm:inline">GOOGLE EARTH 3D</span>
              </a>

              <button
                onClick={onClose}
                className="p-1.5 text-[#9A9A90] hover:text-[#F3F0E8] hover:bg-[#1D211F] border border-[#2A2E2B] transition-colors cursor-pointer ml-1"
                title="Close map"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Main Map Canvas ── */}
          <div className="flex-1 relative bg-[#0B0D0C] overflow-hidden">
            {/* The Leaflet Div Container */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Map Controls & Overlays */}
            {/* 1. Layer Selector Toolbar (Top Left) */}
            <div className="absolute top-3 left-3 z-10 bg-[#0B0D0C]/90 border border-[#2A2E2B] p-1 flex items-center gap-1 font-mono text-[10px] shadow-lg backdrop-blur-sm">
              <span className="px-2 text-[#9A9A90] flex items-center gap-1">
                <Layers size={11} className="text-[#D49A3A]" />
                <span>LAYER:</span>
              </span>
              <button
                onClick={() => handleSwitchLayer("satellite-hybrid")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  activeLayerType === "satellite-hybrid"
                    ? "bg-[#D49A3A] text-[#0B0D0C] font-bold"
                    : "text-[#E9E5DA] hover:bg-[#151817]"
                }`}
                title="Esri World Imagery + Highway & Town Labels"
              >
                HYBRID SATELLITE
              </button>
              <button
                onClick={() => handleSwitchLayer("satellite-google")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  activeLayerType === "satellite-google"
                    ? "bg-[#D49A3A] text-[#0B0D0C] font-bold"
                    : "text-[#E9E5DA] hover:bg-[#151817]"
                }`}
                title="Google Satellite Tiles with Overlay"
              >
                GOOGLE SATELLITE
              </button>
              <button
                onClick={() => handleSwitchLayer("satellite-pure")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  activeLayerType === "satellite-pure"
                    ? "bg-[#D49A3A] text-[#0B0D0C] font-bold"
                    : "text-[#E9E5DA] hover:bg-[#151817]"
                }`}
                title="Pure Esri Satellite (No Labels)"
              >
                PURE SATELLITE
              </button>
              <button
                onClick={() => handleSwitchLayer("osm")}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  activeLayerType === "osm"
                    ? "bg-[#D49A3A] text-[#0B0D0C] font-bold"
                    : "text-[#E9E5DA] hover:bg-[#151817]"
                }`}
                title="OpenStreetMap Street Layer"
              >
                STREET/MAP
              </button>
            </div>

            {/* 2. Recenter Button (Top Right) */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
              <button
                onClick={handleRecenter}
                className="px-3 py-1.5 bg-[#0B0D0C]/95 hover:bg-[#151817] text-[#D49A3A] border border-[#D49A3A]/60 font-mono text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
                title="Center on target pin"
              >
                <Crosshair size={13} />
                <span>CENTER TARGET</span>
              </button>

              <button
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-8 h-8 bg-[#0B0D0C]/95 hover:bg-[#151817] text-[#E9E5DA] border border-[#2A2E2B] flex items-center justify-center transition-colors cursor-pointer ml-auto"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-8 h-8 bg-[#0B0D0C]/95 hover:bg-[#151817] text-[#E9E5DA] border border-[#2A2E2B] flex items-center justify-center transition-colors cursor-pointer ml-auto"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
            </div>

            {/* 3. Real-Time Telemetry HUD (Bottom Left) */}
            <div className="absolute bottom-3 left-3 z-10 bg-[#0B0D0C]/90 border border-[#2A2E2B] px-3 py-2 font-mono text-[10px] space-y-1.5 shadow-xl backdrop-blur-sm max-w-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#2A2E2B] pb-1">
                <span className="text-[#9A9A90]">PIN TARGET:</span>
                <span className="text-[#D49A3A] font-bold truncate max-w-[200px]" title={locationName}>{locationName}</span>
              </div>
              <button
                onClick={() => {
                  handleRecenter();
                  handleCopyCoords();
                }}
                className="w-full flex items-center justify-between gap-4 hover:bg-[#151817] px-1 py-0.5 -mx-1 cursor-pointer text-left transition-colors group"
                title="Click to center target and copy coordinates"
              >
                <span className="text-[#9A9A90] flex items-center gap-1">
                  <Crosshair size={10} className="text-[#D49A3A] group-hover:rotate-90 transition-transform" />
                  <span>COORDINATES:</span>
                </span>
                <span className="text-[#76AEB0] group-hover:text-[#D49A3A] font-bold flex items-center gap-1 underline decoration-dotted">
                  <span>{pinnedCoords.lat.toFixed(5)}°, {pinnedCoords.lon.toFixed(5)}°</span>
                  <Copy size={9} className="opacity-70 group-hover:opacity-100" />
                </span>
              </button>
              {liveCursorCoords && (
                <div className="flex items-center justify-between gap-4 text-[#9A9A90] pt-0.5 border-t border-[#2A2E2B]/50">
                  <span>CURSOR POS:</span>
                  <span>{liveCursorCoords.lat}°, {liveCursorCoords.lon}°</span>
                </div>
              )}
            </div>

            {/* 4. Satellite Provider Badge (Bottom Right) */}
            <div className="absolute bottom-3 right-3 z-10 bg-[#0B0D0C]/80 px-2 py-0.5 border border-[#2A2E2B] font-mono text-[9px] text-[#9A9A90] pointer-events-none">
              ESRI WORLD IMAGERY · HIGH-RESOLUTION EO TILES
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default LeafletSatelliteModal;
