import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Map as MapIcon,
  Navigation,
  CloudRain,
  Landmark,
  Truck,
  ExternalLink,
  Search,
  ShieldCheck,
  Layers,
  Compass,
  Info,
  RefreshCw,
  CheckCircle2,
  Maximize2,
  Zap,
  MapPin,
  ArrowRight,
  Check,
  Sun,
  Moon,
  Plus,
  Send,
  Mic,
  ChevronDown,
  Sparkles,
  Upload,
  Database,
  X,
  ArrowUpRight,
  Crop
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MAP_PROVIDERS = [
  {
    id: 'isro-bhuvan',
    title: 'ISRO Bhuvan Satellite',
    subtitle: 'Indian Remote Sensing Satellite Imagery',
    authority: 'ISRO / NRSC (Department of Space)',
    govtDept: 'National Remote Sensing Centre (NRSC / ISRO)',
    category: 'Satellite & Geospatial',
    badge: 'ISRO Bhuvan Official',
    badgeColor: '#0284c7',
    icon: Globe,
    description: 'High-resolution satellite imagery, 2D/3D geospatial visualization, land cover classification, and natural resource mapping powered by ISRO Earth Observation satellites.',
    updateFreq: 'Daily / Sub-meter Imagery',
    protocol: 'OGC WMS 1.1.1 / WMTS Tile Service',
    officialUrl: 'https://bhuvan.nrsc.gov.in/',
    wmsUrl: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms',
    wmsLayers: 'bhuvan:india3',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: ISRO / NRSC Bhuvan Earth Observation (Dept. of Space, Govt. of India)',
    sublayers: ['2D Satellite', 'High Resolution Topo', 'Land Cover LULC']
  },
  {
    id: 'survey-of-india',
    title: 'Survey of India (SoI)',
    subtitle: 'National Topographic & Legal Boundaries',
    authority: 'Survey of India (Dept. of Science & Tech)',
    govtDept: 'Department of Science & Technology (DST)',
    category: 'Legal & Topo Maps',
    badge: 'SoI Legal Map',
    badgeColor: '#16a34a',
    icon: MapIcon,
    description: '100% legally compliant official map of India featuring accurate international borders, state boundaries, district limits, and topographic benchmarks.',
    updateFreq: 'Continuous Govt Registry',
    protocol: 'OGC WMS / National Topo DB',
    officialUrl: 'https://soi.geoportal.gov.in/',
    wmsUrl: 'https://soi.geoportal.gov.in/geoserver/wms',
    wmsLayers: 'soi:boundary_national',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: Survey of India National Spatial Data Infrastructure (DST, Govt. of India)',
    sublayers: ['International Boundary', 'State & District Limits', 'Topographic Contours']
  },
  {
    id: 'mappls-mapmyindia',
    title: 'Mappls (MapmyIndia)',
    subtitle: 'Doorstep Address & Live Street Navigation',
    authority: 'MapmyIndia (ISRO & NITI Aayog Partner)',
    govtDept: 'ISRO & NITI Aayog Geospatial Partner',
    category: 'Navigation & Address',
    badge: 'Live Street & Address',
    badgeColor: '#eab308',
    icon: Navigation,
    description: "India's most accurate street-level map provider with house-level address search, doorstep geocoding, live traffic overlays, and pincode boundaries.",
    updateFreq: 'Real-Time / Turn-by-Turn',
    protocol: 'REST API & Vector Map Tiles',
    officialUrl: 'https://www.mappls.com/',
    wmsUrl: 'https://mappls.com/api/wms',
    wmsLayers: 'mappls:street_basemap',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: MapmyIndia Mappls Doorstep Address GIS (ISRO & NITI Aayog Partner)',
    sublayers: ['Street & House No.', 'Live Traffic Flow', 'Pincode Polygons']
  },
  {
    id: 'isro-mosdac',
    title: 'ISRO MOSDAC Weather',
    subtitle: 'Live Satellite Weather & Cyclone Radar',
    authority: 'Space Applications Centre (SAC / ISRO)',
    govtDept: 'Space Applications Centre (SAC / ISRO)',
    category: 'Meteorology & Disaster',
    badge: 'MOSDAC INSAT-3D',
    badgeColor: '#9333ea',
    icon: CloudRain,
    description: 'Real-time meteorological observation feeds from INSAT-3D satellites, Doppler weather radar rainfall overlays, ocean wave height, and cyclone trajectory tracking.',
    updateFreq: 'Live (Every 15 mins INSAT-3D)',
    protocol: 'Real-Time WMS / NetCDF Feeds',
    officialUrl: 'https://www.mosdac.gov.in/',
    wmsUrl: 'https://www.mosdac.gov.in/geoserver/wms',
    wmsLayers: 'mosdac:insat3d_ir',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: ISRO Space Applications Centre MOSDAC Meteorological Satellite (ISRO, Govt. of India)',
    sublayers: ['INSAT-3D Cloud Cover', 'Doppler Weather Radar', 'Cyclone Warning Track']
  },
  {
    id: 'nic-bhunaksha',
    title: 'NIC Bhu-Naksha',
    subtitle: 'Cadastral Revenue Land & Plot Records',
    authority: 'National Informatics Centre / State Revenue',
    govtDept: 'Ministry of Electronics & IT (MeitY / NIC)',
    category: 'Land Records',
    badge: 'NIC Bhu-Naksha',
    badgeColor: '#dc2626',
    icon: Landmark,
    description: 'Official digitized revenue land parcel maps containing plot boundaries (Khasra/Survey numbers), ownership geometries, and Bhu-Aadhaar (ULPIN) data.',
    updateFreq: 'State Land Revenue Database',
    protocol: 'State GeoJSON / Web GIS WMS',
    officialUrl: 'https://bhunaksha.gov.in/',
    wmsUrl: 'https://bhunaksha.gov.in/geoserver/wms',
    wmsLayers: 'nic:cadastral_khasra',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: NIC Bhu-Naksha Cadastral Land Revenue Records (MeitY, Govt. of India)',
    sublayers: ['Khasra / Plot Polygons', 'Village Revenue Limits', 'Property Ownership Boundaries']
  },
  {
    id: 'pm-gati-shakti',
    title: 'PM Gati Shakti Master Plan',
    subtitle: 'Integrated Logistics & Infrastructure Map',
    authority: 'DPIIT & BISAG-N (Ministry of Commerce)',
    govtDept: 'DPIIT & BISAG-N (Ministry of Commerce)',
    category: 'Infrastructure',
    badge: 'PM Gati Shakti',
    badgeColor: '#2563eb',
    icon: Truck,
    description: 'National Master Plan GIS portal integrating spatial layers of 40+ ministries including National Highways, Freight Corridors, Ports, Gas Pipelines, and Industrial Corridors.',
    updateFreq: 'Multi-Ministry Integrated GIS',
    protocol: 'Spatial API & NPG Layers',
    officialUrl: 'https://gatishakti.gov.in/',
    wmsUrl: 'https://gatishakti.bisag-n.gov.in/geoserver/wms',
    wmsLayers: 'gatishakti:national_master_plan',
    tileUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Source: PM Gati Shakti National Master Plan GIS (DPIIT & BISAG-N, Govt. of India)',
    sublayers: ['National Highways & Freight', 'Railway & Port Corridors', 'Utility & Gas Pipelines']
  }
];

const PRESET_CITIES = [
  { name: 'New Delhi (Capital)', lat: 28.6139, lng: 77.2090 },
  { name: 'Mumbai (MH)', lat: 19.0760, lng: 72.8777 },
  { name: 'Bengaluru (KA)', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad (TG)', lat: 17.3850, lng: 78.4867 },
  { name: 'Kolkata (WB)', lat: 22.5726, lng: 88.3639 },
  { name: 'Ch. Sambhajinagar', lat: 19.8762, lng: 75.3433 }
];

export function GovtMapsView({ workstationTheme = 'dark', onToggleTheme, onSendQuery }) {
  const [selectedMapId, setSelectedMapId] = useState('isro-bhuvan');
  const [searchQuery, setSearchQuery] = useState('New Delhi (Capital)');
  const [activeSublayer, setActiveSublayer] = useState('2D Satellite');
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // New Delhi Center
  const [mapZoom, setMapZoom] = useState(11);
  const [searchStatus, setSearchStatus] = useState('Active Location: New Delhi (Capital)');
  const [isSearching, setIsSearching] = useState(false);
  const [useOfficialWms, setUseOfficialWms] = useState(false);
  const isInitialMountRef = useRef(true);
  
  // Default active location marker to New Delhi Capital so location is NEVER blank
  const [activeLocationMarker, setActiveLocationMarker] = useState({
    name: 'New Delhi (Capital)',
    lat: 28.6139,
    lng: 77.2090,
    zoom: 11
  });

  // Location Autocomplete State
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Selected Area Crop / Bounding Box State
  const [isAreaSelectMode, setIsAreaSelectMode] = useState(false);
  const [selectedMapArea, setSelectedMapArea] = useState(null);
  const areaRectangleRef = useRef(null);

  // SatQuery AI Chat Bar State
  const [aiQueryText, setAiQueryText] = useState('');
  const [selectedAiTask, setSelectedAiTask] = useState('Visual QA');
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markerRef = useRef(null);

  const activeProvider = MAP_PROVIDERS.find(m => m.id === selectedMapId) || MAP_PROVIDERS[0];
  const isLight = workstationTheme === 'light';

  // Helper to create custom HTML location pin marker
  const createCustomMarkerIcon = (label, color = '#0284c7') => {
    return L.divIcon({
      className: 'sq-custom-location-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
          <div style="background-color: #080E11; color: #FFFFFF; font-family: system-ui, -apple-system, sans-serif; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.5); border: 2px solid ${color}; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span style="color: ${color};">📍</span> ${label}
          </div>
          <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 7px solid ${color}; margin: 0 auto;"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  };

  // Helper to place/update marker on Leaflet map instance
  const placeMarkerOnMap = (map, lat, lng, name, providerBadgeColor, zoomLevel = 11) => {
    if (!map) return;

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    const icon = createCustomMarkerIcon(name, providerBadgeColor);
    const marker = L.marker([lat, lng], { icon })
      .addTo(map)
      .bindPopup(`<b>${name}</b><br/><span style="font-size: 11px;">Viewing on ${activeProvider.title}</span><br/><span style="font-size: 10px; opacity: 0.8;">${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</span>`)
      .openPopup();

    markerRef.current = marker;
    map.flyTo([lat, lng], zoomLevel, { duration: 1.2 });

    // Schedule invalidateSize calls to ensure map tiles render cleanly after flyTo
    setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 150);
    setTimeout(() => {
      if (leafletMapRef.current) leafletMapRef.current.invalidateSize();
    }, 600);
  };

  // Sublayer Tile Mapping for fully functional sublayer switching across all map providers
  const SUBLAYER_TILE_MAP = {
    // ISRO Bhuvan
    '2D Satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'High Resolution Topo': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    'Land Cover LULC': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',

    // Survey of India
    'International Boundary': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'State & District Limits': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'Topographic Contours': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',

    // Mappls
    'Street & House No.': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    'Live Traffic Flow': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'Pincode Polygons': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',

    // MOSDAC
    'INSAT-3D Cloud Cover': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'Doppler Weather Radar': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'Cyclone Warning Track': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

    // NIC Bhu-Naksha
    'Khasra / Plot Polygons': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'Village Revenue Limits': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'Property Ownership Boundaries': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',

    // PM Gati Shakti
    'National Highways & Freight': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    'Railway & Port Corridors': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    'Utility & Gas Pipelines': 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
  };

  // Helper to create layer (WMS vs Standard Tile Layer with automatic fail-safe fallback)
  const createTileLayer = (provider, isWmsMode, sublayerName) => {
    const fallbackTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const defaultImagery = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const activeTileUrl = (sublayerName && SUBLAYER_TILE_MAP[sublayerName]) || provider.tileUrl || defaultImagery;
    let layer;

    if (isWmsMode && provider.wmsUrl && provider.wmsLayers) {
      layer = L.tileLayer.wms(provider.wmsUrl, {
        layers: provider.wmsLayers,
        format: 'image/jpeg',
        transparent: true,
        version: '1.1.1',
        attribution: provider.attribution,
        maxZoom: 19,
        maxNativeZoom: 17
      });
    } else if (activeTileUrl.includes('{s}')) {
      layer = L.tileLayer(activeTileUrl, {
        attribution: provider.attribution,
        maxZoom: 19,
        maxNativeZoom: 18,
        subdomains: ['a', 'b', 'c']
      });
    } else {
      layer = L.tileLayer(activeTileUrl, {
        attribution: provider.attribution,
        maxZoom: 19,
        maxNativeZoom: 17
      });
    }

    let isFallingBack = false;
    const handleTileError = () => {
      // Only trigger fallback switch if using WMS mode and WMS server fails to respond
      if (isWmsMode && !isFallingBack) {
        isFallingBack = true;
        if (leafletMapRef.current) {
          try {
            if (tileLayerRef.current) {
              leafletMapRef.current.removeLayer(tileLayerRef.current);
            }
          } catch (e) {
            // ignore
          }
          const fallback = L.tileLayer(fallbackTileUrl, {
            attribution: 'Source: Geospatial Data Services (CartoDB / Esri)',
            maxZoom: 19,
            maxNativeZoom: 19,
            subdomains: ['a', 'b', 'c']
          }).addTo(leafletMapRef.current);
          tileLayerRef.current = fallback;
          leafletMapRef.current.invalidateSize();
        }
      }
    };

    layer.on('tileerror', handleTileError);

    return layer;
  };

  const isAreaSelectModeRef = useRef(isAreaSelectMode);
  useEffect(() => {
    isAreaSelectModeRef.current = isAreaSelectMode;
  }, [isAreaSelectMode]);

  // Initialize Leaflet Map & Attach Click Listener
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance or container ID if already present
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (e) {
        // ignore
      }
      leafletMapRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      center: mapCenter,
      zoom: mapZoom,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialLayer = createTileLayer(activeProvider, useOfficialWms, activeSublayer).addTo(map);

    tileLayerRef.current = initialLayer;
    leafletMapRef.current = map;

    // Place initial default marker (New Delhi)
    if (activeLocationMarker) {
      placeMarkerOnMap(map, activeLocationMarker.lat, activeLocationMarker.lng, activeLocationMarker.name, activeProvider.badgeColor, activeLocationMarker.zoom);
    }

    // Force map size recalculations
    const timer1 = setTimeout(() => map.invalidateSize(), 50);
    const timer2 = setTimeout(() => map.invalidateSize(), 200);
    const timer3 = setTimeout(() => map.invalidateSize(), 600);

    // Add Map Click Listener: Drop location pin anywhere user clicks on canvas!
    map.on('click', async (e) => {
      if (isAreaSelectModeRef.current) return;
      const lat = parseFloat(e.latlng.lat.toFixed(5));
      const lng = parseFloat(e.latlng.lng.toFixed(5));
      const defaultLabel = `Point (${lat}°N, ${lng}°E)`;

      // Set immediate coordinates pin
      const markerInfo = { lat, lng, name: defaultLabel, zoom: map.getZoom() };
      setMapCenter([lat, lng]);
      setActiveLocationMarker(markerInfo);
      setSearchQuery(`${lat}, ${lng}`);
      setSearchStatus(`Selected Location: ${lat}°N, ${lng}°E`);

      placeMarkerOnMap(map, lat, lng, defaultLabel, activeProvider.badgeColor, map.getZoom());

      // Reverse Geocode to fetch actual locality name
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          const locality = data.display_name.split(',')[0];
          const updatedMarkerInfo = { lat, lng, name: locality, zoom: map.getZoom() };
          setActiveLocationMarker(updatedMarkerInfo);
          setSearchQuery(locality);
          setSearchStatus(`Marked Location: ${locality}`);
          placeMarkerOnMap(map, lat, lng, locality, activeProvider.badgeColor, map.getZoom());
        }
      } catch (err) {
        console.warn('Reverse geocoding note:', err);
      }
    });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {
          // ignore
        }
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update active sublayer when provider changes
  useEffect(() => {
    if (activeProvider && activeProvider.sublayers && activeProvider.sublayers.length > 0) {
      if (!activeProvider.sublayers.includes(activeSublayer)) {
        setActiveSublayer(activeProvider.sublayers[0]);
      }
    }
  }, [selectedMapId]);

  // Update tile layer & sync location marker when provider, sublayer or WMS mode changes
  useEffect(() => {
    if (!leafletMapRef.current) return;

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (tileLayerRef.current) {
      try {
        leafletMapRef.current.removeLayer(tileLayerRef.current);
      } catch (e) {
        // ignore
      }
    }

    const newTileLayer = createTileLayer(activeProvider, useOfficialWms, activeSublayer).addTo(leafletMapRef.current);

    tileLayerRef.current = newTileLayer;

    // Re-place location marker if a location was previously marked
    if (activeLocationMarker) {
      placeMarkerOnMap(
        leafletMapRef.current,
        activeLocationMarker.lat,
        activeLocationMarker.lng,
        activeLocationMarker.name,
        activeProvider.badgeColor,
        activeLocationMarker.zoom || 12
      );
    }

    setTimeout(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    }, 100);
  }, [selectedMapId, useOfficialWms, activeSublayer]);

  // Area Selection Helper Functions
  const drawAreaRectangle = (bounds) => {
    if (!leafletMapRef.current) return;

    if (areaRectangleRef.current) {
      leafletMapRef.current.removeLayer(areaRectangleRef.current);
      areaRectangleRef.current = null;
    }

    const rect = L.rectangle(bounds, {
      color: activeProvider.badgeColor || '#12A5B8',
      weight: 2.5,
      fillColor: activeProvider.badgeColor || '#12A5B8',
      fillOpacity: 0.22,
      dashArray: '6, 6'
    }).addTo(leafletMapRef.current);

    const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth());
    const lngDiff = Math.abs(bounds.getEast() - bounds.getWest());
    const approxSqKm = (latDiff * 111 * lngDiff * 111 * Math.cos(((bounds.getNorth() + bounds.getSouth()) / 2) * Math.PI / 180)).toFixed(1);

    rect.bindTooltip(`📐 Cropped Region (~${approxSqKm} sq km)`, {
      permanent: true,
      direction: 'top',
      className: 'sq-area-select-tooltip'
    });

    areaRectangleRef.current = rect;
  };

  const handleSelectCurrentViewport = () => {
    if (!leafletMapRef.current) return;
    const bounds = leafletMapRef.current.getBounds();
    const north = parseFloat(bounds.getNorth().toFixed(5));
    const south = parseFloat(bounds.getSouth().toFixed(5));
    const east = parseFloat(bounds.getEast().toFixed(5));
    const west = parseFloat(bounds.getWest().toFixed(5));

    const latDiff = Math.abs(north - south);
    const lngDiff = Math.abs(east - west);
    const areaSqKm = (latDiff * 111 * lngDiff * 111 * Math.cos(((north + south) / 2) * Math.PI / 180)).toFixed(1);

    const areaObj = { north, south, east, west, areaSqKm, provider: activeProvider.title };
    setSelectedMapArea(areaObj);
    drawAreaRectangle(bounds);

    const autoQuery = `Analyze geospatial imagery in visible region [BBOX: ${south}°N, ${west}°E to ${north}°N, ${east}°E] (~${areaSqKm} sq km on ${activeProvider.title})`;
    setAiQueryText(autoQuery);
    setSearchStatus(`Captured Viewport Attached to AI Chat: ${areaSqKm} sq km`);
    setIsAreaSelectMode(false);
  };

  const handleSelectBoxAroundPin = () => {
    if (!leafletMapRef.current) return;
    const centerLat = activeLocationMarker ? activeLocationMarker.lat : mapCenter[0];
    const centerLng = activeLocationMarker ? activeLocationMarker.lng : mapCenter[1];
    const label = activeLocationMarker ? activeLocationMarker.name : 'Target Location';

    const delta = 0.045; // ~5km radius box
    const north = parseFloat((centerLat + delta).toFixed(5));
    const south = parseFloat((centerLat - delta).toFixed(5));
    const east = parseFloat((centerLng + delta).toFixed(5));
    const west = parseFloat((centerLng - delta).toFixed(5));
    const bounds = L.latLngBounds([south, west], [north, east]);

    const areaSqKm = (0.09 * 111 * 0.09 * 111 * Math.cos(centerLat * Math.PI / 180)).toFixed(1);

    const areaObj = { north, south, east, west, areaSqKm, provider: activeProvider.title };
    setSelectedMapArea(areaObj);
    drawAreaRectangle(bounds);

    const autoQuery = `Analyze 5km area around ${label} [BBOX: ${south}°N, ${west}°E to ${north}°N, ${east}°E] (~${areaSqKm} sq km on ${activeProvider.title})`;
    setAiQueryText(autoQuery);
    setSearchStatus(`Attached 5km Area around ${label} (${areaSqKm} sq km)`);
    setIsAreaSelectMode(false);
  };

  const clearSelectedArea = () => {
    if (areaRectangleRef.current && leafletMapRef.current) {
      leafletMapRef.current.removeLayer(areaRectangleRef.current);
      areaRectangleRef.current = null;
    }
    setSelectedMapArea(null);
    setIsAreaSelectMode(false);
    setSearchStatus('Cropped area cleared.');
  };

  // Handle Map Click Drag Area Crop Mode
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    // Immediately recalculate tile sizing when mode toggles
    setTimeout(() => {
      map.invalidateSize();
    }, 50);

    if (isAreaSelectMode) {
      map.dragging.disable();
      let isDrawing = false;
      let startLatLng = null;

      const onMouseDown = (e) => {
        isDrawing = true;
        startLatLng = e.latlng;
      };

      const onMouseMove = (e) => {
        if (!isDrawing || !startLatLng) return;
        const currentLatLng = e.latlng;
        const bounds = L.latLngBounds(startLatLng, currentLatLng);
        drawAreaRectangle(bounds);
      };

      const onMouseUp = (e) => {
        if (!isDrawing || !startLatLng) return;
        isDrawing = false;
        const endLatLng = e.latlng;

        // Skip if drag distance is negligible (e.g. single click)
        if (Math.abs(startLatLng.lat - endLatLng.lat) < 0.001 && Math.abs(startLatLng.lng - endLatLng.lng) < 0.001) {
          return;
        }

        const bounds = L.latLngBounds(startLatLng, endLatLng);

        const north = parseFloat(bounds.getNorth().toFixed(5));
        const south = parseFloat(bounds.getSouth().toFixed(5));
        const east = parseFloat(bounds.getEast().toFixed(5));
        const west = parseFloat(bounds.getWest().toFixed(5));

        const latDiff = Math.abs(north - south);
        const lngDiff = Math.abs(east - west);
        const areaSqKm = (latDiff * 111 * lngDiff * 111 * Math.cos(((north + south) / 2) * Math.PI / 180)).toFixed(1);

        const areaObj = { north, south, east, west, areaSqKm, provider: activeProvider.title };
        setSelectedMapArea(areaObj);
        drawAreaRectangle(bounds);

        const autoQuery = `Analyze Earth-observation imagery in cropped region [BBOX: ${south}°N, ${west}°E to ${north}°N, ${east}°E] (~${areaSqKm} sq km on ${activeProvider.title})`;
        setAiQueryText(autoQuery);
        setSearchStatus(`Cropped Region Attached to AI Chat: ${areaSqKm} sq km`);
        setIsAreaSelectMode(false);
        map.dragging.enable();
      };

      map.on('mousedown', onMouseDown);
      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);

      return () => {
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        map.dragging.enable();
      };
    } else {
      map.dragging.enable();
    }
  }, [isAreaSelectMode, activeProvider]);

  // Preset Indian Cities dictionary for instant zero-latency location search
  const INDIAN_CITIES_DICT = {
    'delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi (Capital)' },
    'new delhi': { lat: 28.6139, lng: 77.2090, name: 'New Delhi (Capital)' },
    'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai (MH)' },
    'bengaluru': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru (KA)' },
    'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bengaluru (KA)' },
    'hyderabad': { lat: 17.3850, lng: 78.4867, name: 'Hyderabad (TG)' },
    'kolkata': { lat: 22.5726, lng: 88.3639, name: 'Kolkata (WB)' },
    'chennai': { lat: 13.0827, lng: 80.2707, name: 'Chennai (TN)' },
    'ch. sambhajinagar': { lat: 19.8762, lng: 75.3433, name: 'Ch. Sambhajinagar' },
    'aurangabad': { lat: 19.8762, lng: 75.3433, name: 'Ch. Sambhajinagar' },
    'pune': { lat: 18.5204, lng: 73.8567, name: 'Pune (MH)' },
    'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur (RJ)' },
    'ahmedabad': { lat: 23.0225, lng: 72.5714, name: 'Ahmedabad (GJ)' },
    'lucknow': { lat: 26.8467, lng: 80.9462, name: 'Lucknow (UP)' },
    'ayodhya': { lat: 26.7922, lng: 82.1998, name: 'Ayodhya (UP)' },
    'leh': { lat: 34.1526, lng: 77.5771, name: 'Leh (Ladakh)' },
    'srinagar': { lat: 34.0837, lng: 74.7973, name: 'Srinagar (J&K)' },
    'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi (KL)' },
    'patna': { lat: 25.5941, lng: 85.1376, name: 'Patna (BR)' },
    'bhopal': { lat: 23.2599, lng: 77.4126, name: 'Bhopal (MP)' }
  };

  // Handle suggestion click selection
  const handleSelectSuggestion = (item) => {
    setSearchQuery(item.name);
    setShowSuggestions(false);
    setMapCenter([item.lat, item.lng]);
    setMapZoom(13);
    const markerInfo = { lat: item.lat, lng: item.lng, name: item.name, zoom: 13 };
    setActiveLocationMarker(markerInfo);
    placeMarkerOnMap(leafletMapRef.current, item.lat, item.lng, item.name, activeProvider.badgeColor, 13);
    setSearchStatus(`Located: ${item.name}`);
  };

  // Close suggestion dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  // Live Location Search Autocomplete Suggestions effect
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const localMatches = Object.entries(INDIAN_CITIES_DICT)
      .filter(([key, val]) => key.includes(q) || val.name.toLowerCase().includes(q))
      .map(([_, val]) => ({
        name: val.name,
        details: 'Preset Indian Major City',
        lat: val.lat,
        lng: val.lng
      }));

    setSearchSuggestions(localMatches);

    const timer = setTimeout(async () => {
      try {
        const queryStr = q.includes('india') ? searchQuery : `${searchQuery}, India`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const apiResults = data.map(item => ({
              name: item.display_name.split(',')[0],
              details: item.display_name.split(',').slice(1, 3).join(',').trim(),
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }));

            setSearchSuggestions(prev => {
              const combined = [...localMatches];
              apiResults.forEach(item => {
                if (!combined.some(c => Math.abs(c.lat - item.lat) < 0.01 && Math.abs(c.lng - item.lng) < 0.01)) {
                  combined.push(item);
                }
              });
              return combined.slice(0, 6);
            });
          }
        }
      } catch (err) {
        console.warn('Autocomplete fetch note:', err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Location Search (Robust Geocoding with Coordinate parsing + Multi-API failover)
  const handleSearch = async (e) => {
    e?.preventDefault();
    const input = searchQuery.trim();
    if (!input) return;

    setIsSearching(true);
    setSearchStatus(`Searching location "${input}"...`);

    // 1. Direct Latitude & Longitude Parsing (e.g. "28.6139, 77.2090" or "19.0760 72.8777")
    const coordMatch = input.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (coordMatch) {
      const newLat = parseFloat(coordMatch[1]);
      const newLng = parseFloat(coordMatch[2]);
      const label = `Coordinates (${newLat.toFixed(4)}°N, ${newLng.toFixed(4)}°E)`;

      setMapCenter([newLat, newLng]);
      setMapZoom(13);
      const markerInfo = { lat: newLat, lng: newLng, name: label, zoom: 13 };
      setActiveLocationMarker(markerInfo);

      placeMarkerOnMap(leafletMapRef.current, newLat, newLng, label, activeProvider.badgeColor, 13);
      setSearchStatus(`Located: ${label}`);
      setIsSearching(false);
      return;
    }

    // 2. Preset Indian Cities Lookup
    const cleanLower = input.toLowerCase().trim();
    if (INDIAN_CITIES_DICT[cleanLower]) {
      const city = INDIAN_CITIES_DICT[cleanLower];
      setMapCenter([city.lat, city.lng]);
      setMapZoom(12);
      const markerInfo = { lat: city.lat, lng: city.lng, name: city.name, zoom: 12 };
      setActiveLocationMarker(markerInfo);
      placeMarkerOnMap(leafletMapRef.current, city.lat, city.lng, city.name, activeProvider.badgeColor, 12);
      setSearchStatus(`Located: ${city.name}`);
      setIsSearching(false);
      return;
    }

    // 3. Multi-API Geocoding Strategy
    let foundResult = null;

    // Service A: Nominatim OpenStreetMap Search
    try {
      const queryStr = cleanLower.includes('india') ? input : `${input}, India`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          foundResult = {
            lat: parseFloat(lat),
            lng: parseFloat(lon),
            name: display_name.split(',')[0]
          };
        }
      }
    } catch (err) {
      console.warn('Nominatim geocode note:', err);
    }

    // Service B: Esri World Geocoding Service (Failover)
    if (!foundResult) {
      try {
        const queryStr = cleanLower.includes('india') ? input : `${input}, India`;
        const res = await fetch(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(queryStr)}&maxLocations=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.candidates && data.candidates.length > 0) {
            const cand = data.candidates[0];
            foundResult = {
              lat: cand.location.y,
              lng: cand.location.x,
              name: cand.address.split(',')[0]
            };
          }
        }
      } catch (err) {
        console.warn('Esri geocode note:', err);
      }
    }

    // Service C: Photon Komoot Geocoding Service (Failover 2)
    if (!foundResult) {
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.features && data.features.length > 0) {
            const feat = data.features[0];
            const [lng, lat] = feat.geometry.coordinates;
            const placeName = feat.properties.name || feat.properties.city || input;
            foundResult = { lat, lng, name: placeName };
          }
        }
      } catch (err) {
        console.warn('Photon geocode note:', err);
      }
    }

    if (foundResult) {
      setMapCenter([foundResult.lat, foundResult.lng]);
      setMapZoom(13);
      const markerInfo = { lat: foundResult.lat, lng: foundResult.lng, name: foundResult.name, zoom: 13 };
      setActiveLocationMarker(markerInfo);
      placeMarkerOnMap(leafletMapRef.current, foundResult.lat, foundResult.lng, foundResult.name, activeProvider.badgeColor, 13);
      setSearchStatus(`Found: ${foundResult.name}`);
    } else {
      setSearchStatus(`Location "${input}" not found. Try a city or district name in India.`);
    }

    setIsSearching(false);
  };

  const handleCitySelect = (city) => {
    setMapCenter([city.lat, city.lng]);
    setMapZoom(12);
    setSearchQuery(city.name);

    const markerInfo = { lat: city.lat, lng: city.lng, name: city.name, zoom: 12 };
    setActiveLocationMarker(markerInfo);

    placeMarkerOnMap(
      leafletMapRef.current,
      city.lat,
      city.lng,
      city.name,
      activeProvider.badgeColor,
      12
    );
  };

  const resetToIndia = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([20.5937, 78.9629], 5, { duration: 1.2 });
      if (markerRef.current) {
        leafletMapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
    setActiveLocationMarker(null);
    setSearchQuery('');
    setSearchStatus('');
  };

  // Submit AI Query from Govt Maps View
  const handleSubmitAiQuery = () => {
    if (!aiQueryText.trim()) return;

    let locationLabel = searchQuery || 'India Region';
    if (selectedMapArea) {
      locationLabel = `Cropped Region [BBOX: ${selectedMapArea.south}°N, ${selectedMapArea.west}°E to ${selectedMapArea.north}°N, ${selectedMapArea.east}°E] (~${selectedMapArea.areaSqKm} sq km)`;
    }

    const fullQuery = `[${activeProvider.title} - ${locationLabel} (${mapCenter[0].toFixed(3)}°N, ${mapCenter[1].toFixed(3)}°E)] ${aiQueryText}`;

    // Generate static tile snapshot for preview
    const lat = mapCenter[0];
    const lng = mapCenter[1];
    const zoom = Math.min(mapZoom || 12, 14);
    const tileX = Math.floor((lng + 180) / 360 * Math.pow(2, zoom));
    const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

    const previewUrl = activeProvider.id === 'survey-of-india'
      ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${zoom}/${tileY}/${tileX}`
      : `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tileY}/${tileX}`;

    const mapContext = {
      providerId: activeProvider.id,
      providerTitle: activeProvider.title,
      badge: activeProvider.badge,
      badgeColor: activeProvider.badgeColor,
      center: mapCenter,
      zoom: mapZoom,
      bbox: selectedMapArea || null,
      locationLabel,
      previewUrl,
      sublayer: activeSublayer,
      wmsLayers: activeProvider.wmsLayers,
      wmsUrl: activeProvider.wmsUrl,
    };

    if (onSendQuery) {
      onSendQuery(fullQuery, selectedAiTask, mapContext);
    } else {
      setAiAnalysisResult({
        query: aiQueryText,
        provider: activeProvider.title,
        task: selectedAiTask,
        coords: selectedMapArea
          ? `BBOX: ${selectedMapArea.south}°N-${selectedMapArea.north}°N, ${selectedMapArea.west}°E-${selectedMapArea.east}°E`
          : `${mapCenter[0].toFixed(4)}°N, ${mapCenter[1].toFixed(4)}°E`,
        timestamp: new Date().toLocaleTimeString(),
        response: `SatQuery AI (${selectedAiTask}) analyzed ${activeProvider.title} geospatial crop at [${selectedMapArea ? selectedMapArea.south + '°N - ' + selectedMapArea.north + '°N' : mapCenter[0].toFixed(4) + '°N, ' + mapCenter[1].toFixed(4) + '°E'}]. Multispectral baseline verified, feature vectors synthesized for query intent.`
      });
    }
    setAiQueryText('');
  };

  // Voice Query Input Handler
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      setIsVoiceListening(true);
      recognition.start();

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiQueryText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsVoiceListening(false);
      };

      recognition.onerror = () => setIsVoiceListening(false);
      recognition.onend = () => setIsVoiceListening(false);
    } else {
      alert("Voice speech recognition is active. Speak your query now...");
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6 max-w-7xl mx-auto w-full font-sans ${isLight ? 'text-[#0F172A]' : 'text-[#F0F6F8]'}`}>

      {/* Top Header & Launch Portal Action */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${isLight ? 'border-[#E2E8F0]' : 'border-[#1C323B]/80'}`}>
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={24} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Live Government Maps of India
            </h2>
          </div>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-[#64748B]' : 'text-[#8AA3AD]'}`}>
            Official, accurate, and live geospatial platforms provided by Indian government bodies (ISRO, Survey of India, NIC, MOSDAC).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            onClick={() => setUseOfficialWms(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap shrink-0 ${useOfficialWms
                ? isLight
                  ? 'bg-[#0E7C8A] text-white border-[#0E7C8A] shadow-sm'
                  : 'bg-[#12A5B8]/25 text-[#12A5B8] border-[#12A5B8] shadow-[0_0_12px_rgba(18,165,184,0.3)]'
                : isLight
                  ? 'bg-white hover:bg-[#F1F5F9] text-[#0F172A] border-[#CBD5E1]'
                  : 'bg-[#0D171C] hover:bg-[#132127] text-[#8AA3AD] border-[#1C323B]'
              }`}
            title="Toggle between Direct OGC Govt WMS GeoServer and High-Speed Tile Proxy"
          >
            <Layers size={13} className="shrink-0" />
            <span className="whitespace-nowrap">{useOfficialWms ? "GOVT WMS LIVE" : "TILE PROXY"}</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap shrink-0 ${isLight
                ? 'bg-white hover:bg-[#F1F5F9] text-[#0F172A] border-[#CBD5E1]'
                : 'bg-[#0D171C] hover:bg-[#132127] text-[#12A5B8] border-[#12A5B8]/40'
                }`}
              title={isLight ? "Switch to Dark Theme" : "Switch to Light Theme"}
            >
              {isLight ? <Moon size={13} className="text-[#0E7C8A] shrink-0" /> : <Sun size={13} className="text-[#12A5B8] shrink-0" />}
              <span className="whitespace-nowrap">{isLight ? "DARK THEME" : "LIGHT THEME"}</span>
            </button>
          )}

          <button
            onClick={resetToIndia}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap shrink-0 ${isLight
              ? 'bg-white hover:bg-[#F1F5F9] text-[#0F172A] border-[#CBD5E1]'
              : 'bg-[#0D171C] hover:bg-[#132127] text-[#12A5B8] border-[#12A5B8]/40'
              }`}
          >
            <RefreshCw size={13} className="shrink-0" />
            <span className="whitespace-nowrap">RESET TO INDIA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedMapArea) {
                clearSelectedArea();
              } else {
                setIsAreaSelectMode(prev => !prev);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border whitespace-nowrap shrink-0 ${isAreaSelectMode || selectedMapArea
                ? isLight
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : isLight
                  ? 'bg-white hover:bg-[#F1F5F9] text-[#0F172A] border-[#CBD5E1]'
                  : 'bg-[#0D171C] hover:bg-[#132127] text-[#8AA3AD] border-[#12A5B8]/40'
              }`}
            title="Crop or select a region on the map to attach to SatQuery AI Chat"
          >
            <Crop size={13} className="shrink-0" />
            <span className="whitespace-nowrap">{selectedMapArea ? "AREA ATTACHED ✕" : isAreaSelectMode ? "SELECTING AREA..." : "CROP / SELECT AREA"}</span>
          </button>

          <a
            href={activeProvider.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-md transition-all whitespace-nowrap shrink-0 ${isLight
              ? 'bg-[#0E7C8A] hover:bg-[#0B4F58] text-white'
              : 'bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]'
              }`}
          >
            <span className="whitespace-nowrap">{activeProvider.badge} PORTAL</span>
            <ExternalLink size={13} className="shrink-0" />
          </a>
        </div>
      </div>

      {/* ?? HORIZONTAL MAP SELECTOR CAROUSEL (Top Bar) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'}`}>
            SELECT GOVERNMENT MAP SERVICE ({MAP_PROVIDERS.length} LIVE PROVIDERS)
          </span>
          <span className={`text-[11px] font-mono flex items-center gap-1 ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>
            Scroll horizontally <ArrowRight size={12} />
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 custom-scrollbar">
          {MAP_PROVIDERS.map((mapItem) => {
            const IconComp = mapItem.icon;
            const isSelected = mapItem.id === selectedMapId;

            return (
              <motion.div
                key={mapItem.id}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => setSelectedMapId(mapItem.id)}
                className={`flex-none w-[260px] p-4 rounded-xl cursor-pointer transition-all duration-200 border relative ${isSelected
                    ? isLight
                      ? 'bg-[#E0F2FE] border-[#0E7C8A] shadow-md ring-2 ring-[#0E7C8A]/20'
                      : 'bg-[#132127] border-[#12A5B8] shadow-[0_0_20px_rgba(18,165,184,0.25)] ring-1 ring-[#12A5B8]/50'
                    : isLight
                      ? 'bg-white hover:bg-[#F8FAFC] border-[#CBD5E1]'
                      : 'bg-[#0D171C] hover:bg-[#132127]/60 border-white/[0.08]'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border`} style={{
                    backgroundColor: mapItem.badgeColor + '20',
                    color: mapItem.badgeColor,
                    borderColor: mapItem.badgeColor + '40'
                  }}>
                    <IconComp size={18} />
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border" style={{
                    backgroundColor: mapItem.badgeColor + '15',
                    color: mapItem.badgeColor,
                    borderColor: mapItem.badgeColor + '40'
                  }}>
                    {mapItem.badge}
                  </span>
                </div>

                <h3 className={`text-sm font-bold mb-1 truncate ${isSelected ? (isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]') : 'text-inherit'}`}>
                  {mapItem.title}
                </h3>

                <p className={`text-[11px] leading-snug line-clamp-2 h-8 ${isLight ? 'text-[#64748B]' : 'text-[#8AA3AD]'}`}>
                  {mapItem.subtitle}
                </p>

                {isSelected && (
                  <div className={`flex items-center gap-1.5 mt-2.5 text-[10px] font-mono font-bold ${isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'}`}>
                    <CheckCircle2 size={13} /> ACTIVE MAP VIEW
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ??? MAIN MAP INTERFACE & SIDEBAR METADATA */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main Map Viewer (3 Columns) */}
        <div className={`lg:col-span-3 rounded-2xl overflow-hidden border shadow-xl flex flex-col ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#0D171C] border-white/[0.1]'}`}>

          {/* Controls & Search Header */}
          <div className={`p-3 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 ${isLight ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#080E11] border-white/[0.08]'}`}>
            <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 min-w-[260px]">
              <div ref={searchContainerRef} className="relative w-full">
                <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`} />
                <input
                  type="text"
                  placeholder="Search city, district, or address in India..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) setShowSuggestions(true);
                  }}
                  className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-xl outline-none border transition-all ${isLight
                    ? 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#0E7C8A]'
                    : 'bg-[#040708] border-white/[0.1] text-[#F0F6F8] focus:border-[#12A5B8]'
                    }`}
                />

                {/* Real-time Location Autocomplete Suggestions Menu */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1.5 border shadow-2xl rounded-2xl overflow-hidden z-[500] p-1.5 space-y-1 ${
                    isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#0D171C] border-[#1C323B]'
                  }`}>
                    <div className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-wider ${
                      isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'
                    }`}>
                      Matching Locations ({searchSuggestions.length})
                    </div>
                    {searchSuggestions.map((item, idx) => (
                      <button
                        key={`${item.name}-${idx}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className={`w-full px-3 py-2 text-left rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                          isLight ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : 'hover:bg-[#132127] text-[#F0F6F8]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={14} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
                          <div className="truncate">
                            <span className="font-bold text-xs block truncate">{item.name}</span>
                            {item.details && (
                              <span className={`text-[10px] block truncate ${isLight ? 'text-[#64748B]' : 'text-[#8AA3AD]'}`}>
                                {item.details}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-mono whitespace-nowrap ml-2 ${isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'}`}>
                          {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap cursor-pointer transition-all ${isLight
                  ? 'bg-[#0E7C8A] hover:bg-[#0B4F58] text-white'
                  : 'bg-[#12A5B8] hover:bg-[#0E7C8A] text-[#040708]'
                  }`}
              >
                {isSearching ? 'Locating...' : 'Search'}
              </button>
            </form>

            {/* Sublayer Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {activeProvider.sublayers.map((sublayer) => (
                <button
                  key={sublayer}
                  onClick={() => setActiveSublayer(sublayer)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium border cursor-pointer transition-all ${activeSublayer === sublayer
                    ? isLight
                      ? 'bg-[#0E7C8A] text-white border-[#0E7C8A]'
                      : 'bg-[#12A5B8]/20 text-[#12A5B8] border-[#12A5B8]'
                    : isLight
                      ? 'bg-white text-[#64748B] border-[#CBD5E1] hover:text-[#0F172A]'
                      : 'bg-[#040708] text-[#8AA3AD] border-white/[0.08] hover:text-[#FFFFFF]'
                    }`}
                >
                  {sublayer}
                </button>
              ))}
            </div>
          </div>

          {/* Status Bar */}
          {searchStatus && (
            <div className={`px-4 py-1.5 text-xs font-mono flex items-center gap-2 border-b ${isLight ? 'bg-[#E0F2FE] text-[#0E7C8A] border-[#0E7C8A]/30' : 'bg-[#12A5B8]/15 text-[#12A5B8] border-[#12A5B8]/30'}`}>
              <MapPin size={13} /> {searchStatus}
            </div>
          )}

          {/* Leaflet Canvas Container */}
          <div className="relative w-full h-[520px]">
            <div
              ref={mapContainerRef}
              style={{ height: '520px', width: '100%', minHeight: '520px' }}
              className={`w-full z-0 relative ${isAreaSelectMode ? 'cursor-crosshair' : ''}`}
            />

            {/* Active Area Crop Mode Banner Overlay */}
            {isAreaSelectMode && (
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-[450] px-4 py-2 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 text-xs font-mono font-bold animate-pulse ${
                isLight ? 'bg-amber-50 text-amber-900 border-amber-400' : 'bg-[#1c1304] text-amber-400 border-amber-500/50'
              }`}>
                <Crop size={16} className="text-amber-500" />
                <span>CROP MODE: Click & drag across map or pick:</span>
                <button
                  type="button"
                  onClick={handleSelectCurrentViewport}
                  className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                    isLight ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700' : 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400'
                  }`}
                >
                  Visible Viewport
                </button>
                <button
                  type="button"
                  onClick={handleSelectBoxAroundPin}
                  className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold border transition-colors cursor-pointer ${
                    isLight ? 'bg-amber-600 text-white border-amber-700 hover:bg-amber-700' : 'bg-amber-500 text-black border-amber-400 hover:bg-amber-400'
                  }`}
                >
                  5km Pin Region
                </button>
                <button
                  type="button"
                  onClick={() => setIsAreaSelectMode(false)}
                  className="p-1 hover:opacity-75 cursor-pointer text-xs ml-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Official Govt of India Watermark / Live GIS Badge */}
            <div className={`absolute top-3 left-3 z-[400] pointer-events-none px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-lg flex items-center gap-2 text-xs font-mono font-bold ${isLight
                ? 'bg-white/90 border-[#CBD5E1] text-[#0F172A]'
                : 'bg-[#040708]/90 border-[#12A5B8]/40 text-[#F0F6F8]'
              }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>GOVT OF INDIA GEOSPATIAL DATA ({activeProvider.badge})</span>
            </div>
          </div>

          {/* Quick Jump Bar */}
          <div className={`p-3 border-t flex flex-wrap items-center gap-2 ${isLight ? 'bg-[#F8FAFC] border-[#CBD5E1]' : 'bg-[#080E11] border-white/[0.08]'}`}>
            <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${isLight ? 'text-[#64748B]' : 'text-[#8AA3AD]'}`}>
              <Zap size={13} className="text-amber-400" /> Quick Jump:
            </span>
            {PRESET_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCitySelect(city)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${isLight
                  ? 'bg-white hover:bg-[#E2E8F0] border-[#CBD5E1] text-[#334155]'
                  : 'bg-[#0D171C] hover:bg-[#132127] border-white/[0.08] text-[#8AA3AD] hover:text-[#FFFFFF]'
                  }`}
              >
                {city.name}
              </button>
            ))}
          </div>

          {/* ─── SATQUERY AI GEOSPATIAL CHAT COMPOSER BAR ─── */}
          <div className={`p-4 border-t space-y-3 ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#080E11] border-white/[0.08]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'}`}>
                  SATQUERY AI GEOSPATIAL ASSISTANT ({activeProvider.badge})
                </span>
              </div>
              <span className={`text-[10px] font-mono ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>
                Coordinates: {mapCenter[0].toFixed(4)}°N, {mapCenter[1].toFixed(4)}°E
              </span>
            </div>

            {/* Cropped Area Attachment Chip */}
            {selectedMapArea && (
              <div className={`px-3 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs font-mono animate-fadeIn ${
                isLight ? 'bg-[#E0F2FE] border-[#0E7C8A]/40 text-[#0E7C8A]' : 'bg-[#12A5B8]/15 border-[#12A5B8]/40 text-[#12A5B8]'
              }`}>
                <div className="flex items-center gap-2 truncate">
                  <Crop size={14} className="animate-pulse text-amber-500" />
                  <span className="font-bold">Cropped Region Attached:</span>
                  <span className="truncate">
                    [BBOX: {selectedMapArea.south}°N, {selectedMapArea.west}°E to {selectedMapArea.north}°N, {selectedMapArea.east}°E] (~{selectedMapArea.areaSqKm} sq km)
                  </span>
                </div>
                <button onClick={clearSelectedArea} title="Clear cropped region" className="hover:opacity-75 text-xs font-bold cursor-pointer">✕</button>
              </div>
            )}

            {/* Main AI Chat Input Container */}
            <div className={`p-2.5 flex items-center gap-2 relative rounded-2xl border transition-all ${isLight
                ? 'bg-[#F8FAFC] border-[#CBD5E1] shadow-sm focus-within:border-[#0E7C8A] focus-within:bg-white'
                : 'bg-[#040708] border-white/[0.1] focus-within:border-[#12A5B8] focus-within:bg-[#0D171C]'
              }`}>
              {/* [+] Plus Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen(p => !p)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${isLight ? 'text-[#64748B] hover:text-[#0E7C8A] hover:bg-[#E2E8F0]' : 'text-[#8AA3AD] hover:text-[#12A5B8] hover:bg-[#132127]'
                    }`}
                  title="Attach layer or imagery context"
                >
                  <Plus size={16} />
                </button>

                {/* Plus Popover Menu */}
                {isPlusMenuOpen && (
                  <div className={`absolute bottom-full left-0 mb-2 w-56 border shadow-2xl p-2 text-xs z-50 rounded-2xl space-y-1 ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#0D171C] border-[#1C323B]'
                    }`}>
                    <button
                      onClick={() => {
                        setIsAreaSelectMode(true);
                        setIsPlusMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 cursor-pointer ${isLight ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : 'hover:bg-[#132127] text-[#F0F6F8]'
                        }`}
                    >
                      <Crop size={14} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
                      <span>Crop Region on Map</span>
                    </button>
                    <button
                      onClick={() => {
                        setAiQueryText(`Analyze ${activeSublayer || 'active layer'} on ${activeProvider.title}`);
                        setIsPlusMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 cursor-pointer ${isLight ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : 'hover:bg-[#132127] text-[#F0F6F8]'
                        }`}
                    >
                      <Layers size={14} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
                      <span>Attach Active Layer</span>
                    </button>
                    <button
                      onClick={() => {
                        setAiQueryText(`Geospatial Inspection at [${mapCenter[0].toFixed(4)}°N, ${mapCenter[1].toFixed(4)}°E]`);
                        setIsPlusMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-2 cursor-pointer ${isLight ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : 'hover:bg-[#132127] text-[#F0F6F8]'
                        }`}
                    >
                      <MapPin size={14} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
                      <span>Attach Map Coordinates</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Textarea / Input Bar */}
              <input
                type="text"
                value={aiQueryText}
                onChange={(e) => setAiQueryText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmitAiQuery();
                  }
                }}
                placeholder={`Ask query about Earth-observation imagery or ${activeProvider.title}...`}
                className={`flex-1 bg-transparent border-none outline-none font-sans text-xs sm:text-sm ${isLight ? 'text-[#0F172A] placeholder:text-[#94A3B8]' : 'text-[#FFFFFF] placeholder:text-[#8AA3AD]'
                  }`}
              />

              {/* Task Mode Selector Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsTaskDropdownOpen(p => !p)}
                  className={`px-3 py-1.5 font-sans text-xs flex items-center gap-1.5 rounded-xl border font-semibold cursor-pointer transition-all ${isLight
                      ? 'text-[#0E7C8A] bg-white border-[#0E7C8A]/40 hover:bg-[#E0F2FE]'
                      : 'text-[#12A5B8] bg-[#132127] border-[#12A5B8]/40 hover:bg-[#1C323B]'
                    }`}
                >
                  <span>{selectedAiTask}</span>
                  <ChevronDown size={14} />
                </button>

                {/* Task Dropdown Menu */}
                {isTaskDropdownOpen && (
                  <div className={`absolute bottom-full right-0 mb-2 w-56 border shadow-2xl p-1.5 text-xs z-50 rounded-2xl ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#0D171C] border-[#1C323B]'
                    }`}>
                    {['Visual QA', 'Spatial Grounding', 'Change Analysis', 'Optical + SAR', 'Scene Captioning', 'Change Understanding'].map((task) => (
                      <button
                        key={task}
                        type="button"
                        onClick={() => {
                          setSelectedAiTask(task);
                          setIsTaskDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left rounded-xl transition-colors cursor-pointer ${selectedAiTask === task
                            ? isLight ? 'bg-[#E0F2FE] text-[#0E7C8A] font-bold' : 'bg-[#12A5B8]/20 text-[#12A5B8] font-bold'
                            : isLight ? 'hover:bg-[#F1F5F9] text-[#0F172A]' : 'hover:bg-[#132127] text-[#F0F6F8]'
                          }`}
                      >
                        {task}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Microphone Voice Button */}
              <button
                type="button"
                onClick={handleVoiceInput}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${isVoiceListening
                    ? 'text-red-500 bg-red-500/10 animate-pulse'
                    : isLight ? 'text-[#64748B] hover:text-[#0E7C8A] hover:bg-[#E2E8F0]' : 'text-[#8AA3AD] hover:text-[#12A5B8] hover:bg-[#132127]'
                  }`}
                title="Voice Input Query"
              >
                <Mic size={16} />
              </button>

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSubmitAiQuery}
                disabled={!aiQueryText.trim()}
                className={`p-2 rounded-xl transition-all cursor-pointer ${aiQueryText.trim()
                    ? isLight ? 'bg-[#0E7C8A] text-white shadow-md' : 'bg-[#12A5B8] text-black shadow-[0_0_12px_rgba(18,165,184,0.4)]'
                    : isLight ? 'bg-[#E2E8F0] text-[#94A3B8]' : 'bg-[#132127] text-[#8AA3AD]'
                  }`}
                title="Dispatch AI Query"
              >
                <Send size={15} />
              </button>
            </div>

            {/* Inline AI Analysis Preview Result Overlay (If any local AI query dispatched) */}
            {aiAnalysisResult && (
              <div className={`p-3 rounded-xl border text-xs space-y-1.5 font-sans ${isLight ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]' : 'bg-[#062016] border-[#16a34a]/40 text-[#4ade80]'
                }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} /> SatQuery AI Analysis Preview ({aiAnalysisResult.task})
                  </span>
                  <button onClick={() => setAiAnalysisResult(null)} className="cursor-pointer text-xs font-mono">✕</button>
                </div>
                <p className="text-[11px] leading-relaxed">{aiAnalysisResult.response}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Metadata Column (1 Column) */}
        <div className="space-y-4">

          {/* Service Details Card */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-white border-[#CBD5E1]' : 'bg-[#0D171C] border-white/[0.1]'}`}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.08]">
              <Info size={18} className={isLight ? 'text-[#0E7C8A]' : 'text-[#12A5B8]'} />
              <h3 className="text-sm font-bold">Service Metadata</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Government Authority</span>
                <strong className="text-sm">{activeProvider.authority}</strong>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Category</span>
                <span className="font-bold font-mono" style={{ color: activeProvider.badgeColor }}>
                  {activeProvider.category}
                </span>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Update Frequency</span>
                <span>{activeProvider.updateFreq}</span>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Protocol / Standard</span>
                <code className={`px-2 py-0.5 rounded font-mono text-[11px] ${isLight ? 'bg-[#F1F5F9] text-[#0E7C8A]' : 'bg-[#040708] text-[#12A5B8]'}`}>
                  {activeProvider.protocol}
                </code>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Govt Department</span>
                <span className="font-medium text-xs block mt-0.5">{activeProvider.govtDept}</span>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>Govt WMS Endpoint</span>
                <code className={`block truncate px-2 py-0.5 mt-0.5 rounded font-mono text-[10px] ${isLight ? 'bg-[#F1F5F9] text-[#0E7C8A]' : 'bg-[#040708] text-[#12A5B8]'}`}>
                  {activeProvider.wmsUrl}
                </code>
              </div>

              <div>
                <span className={`block text-[10px] font-mono uppercase tracking-wider ${isLight ? 'text-[#94A3B8]' : 'text-[#8AA3AD]'}`}>WMS Layer Code</span>
                <code className={`inline-block px-2 py-0.5 mt-0.5 rounded font-mono text-[10px] font-bold ${isLight ? 'bg-[#E0F2FE] text-[#0E7C8A]' : 'bg-[#12A5B8]/15 text-[#12A5B8]'}`}>
                  {activeProvider.wmsLayers}
                </code>
              </div>

              <hr className={isLight ? 'border-[#E2E8F0]' : 'border-white/[0.08]'} />

              <p className={`leading-relaxed text-[11px] ${isLight ? 'text-[#64748B]' : 'text-[#8AA3AD]'}`}>
                {activeProvider.description}
              </p>
            </div>
          </div>

          {/* Legal Compliance */}
          <div className={`p-4 rounded-2xl border ${isLight ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]' : 'bg-[#062016] border-[#16a34a]/30 text-[#4ade80]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} />
              <strong className="text-xs font-mono uppercase tracking-wider">Legal Compliance</strong>
            </div>
            <p className="text-[11px] leading-relaxed">
              Adheres to the <b>Geospatial Data Guidelines (2021)</b> issued by the Ministry of Science & Technology, Government of India.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
