import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Rectangle,
  ImageOverlay,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export function InteractiveMap({
  center = [16.3952, 81.7516],
  zoom = 12,
  imageUrl = null,
  imageBounds = null,
  showAOI = true,
  showGrounding = false,
  boundingBoxes = [],
  className = "w-full h-full min-h-[380px]",
}) {
  const [mapType, setMapType] = useState("satellite"); // 'satellite' | 'street'

  // Default AOI polygon bounding the coordinate area
  const defaultBounds = imageBounds || [
    [center[0] - 0.04, center[1] - 0.04],
    [center[0] + 0.04, center[1] + 0.04],
  ];

  const aoiPolygon = [
    [defaultBounds[0][0], defaultBounds[0][1]],
    [defaultBounds[0][0], defaultBounds[1][1]],
    [defaultBounds[1][0], defaultBounds[1][1]],
    [defaultBounds[1][0], defaultBounds[0][1]],
  ];

  return (
    <div className={`relative ${className} overflow-hidden rounded`}>
      {/* Map Style Switcher */}
      <div className="absolute top-3 right-3 z-[1000] flex bg-white/90 backdrop-blur-md p-1 rounded-md shadow-md border border-[#d2e3fc] text-[10px] font-mono font-bold">
        <button
          onClick={() => setMapType("satellite")}
          className={`px-2 py-1 rounded transition ${
            mapType === "satellite"
              ? "bg-[#112557] text-[#B7F23A]"
              : "text-[#5a709c] hover:text-[#112557]"
          }`}
        >
          SATELLITE
        </button>
        <button
          onClick={() => setMapType("street")}
          className={`px-2 py-1 rounded transition ${
            mapType === "street"
              ? "bg-[#112557] text-[#1179FF]"
              : "text-[#5a709c] hover:text-[#112557]"
          }`}
        >
          STREET
        </button>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", minHeight: "380px" }}
      >
        <MapRecenter center={center} zoom={zoom} />

        {mapType === "satellite" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com">Esri</a> World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        {/* Satellite Image Bounds Overlay */}
        {imageUrl && defaultBounds && (
          <ImageOverlay
            url={imageUrl}
            bounds={defaultBounds}
            opacity={0.85}
          />
        )}

        {/* AOI Boundary Outline */}
        {showAOI && (
          <Polygon
            positions={aoiPolygon}
            pathOptions={{
              color: "#1179FF",
              weight: 2.5,
              dashArray: "6, 4",
              fillColor: "#1179FF",
              fillOpacity: 0.08,
            }}
          >
            <Popup>
              <div className="font-mono text-xs">
                <strong>Active AOI Boundary</strong>
                <p className="text-[10px] text-gray-600 mt-1">
                  Lat: {center[0].toFixed(4)}, Lng: {center[1].toFixed(4)}
                </p>
                <p className="text-[9px] text-blue-600">CRS: EPSG:4326 (WGS84)</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* Center Target Marker */}
        <Marker position={center}>
          <Popup>
            <div className="text-xs">
              <strong className="text-[#112557]">Satellite Scene Center</strong>
              <div className="font-mono text-[10px] text-gray-500 mt-1">
                [{center[0].toFixed(5)}, {center[1].toFixed(5)}]
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Grounding Boxes on Map */}
        {showGrounding &&
          boundingBoxes.map((box, idx) => {
            const bMinLat = defaultBounds[0][0] + (defaultBounds[1][0] - defaultBounds[0][0]) * (box.y1 || 0.2);
            const bMaxLat = defaultBounds[0][0] + (defaultBounds[1][0] - defaultBounds[0][0]) * (box.y2 || 0.6);
            const bMinLng = defaultBounds[0][1] + (defaultBounds[1][1] - defaultBounds[0][1]) * (box.x1 || 0.2);
            const bMaxLng = defaultBounds[0][1] + (defaultBounds[1][1] - defaultBounds[0][1]) * (box.x2 || 0.6);

            return (
              <Rectangle
                key={idx}
                bounds={[
                  [bMinLat, bMinLng],
                  [bMaxLat, bMaxLng],
                ]}
                pathOptions={{
                  color: "#B7F23A",
                  weight: 2,
                  fillColor: "#B7F23A",
                  fillOpacity: 0.2,
                }}
              >
                <Popup>
                  <span className="font-mono text-xs font-bold text-navy">
                    {box.label || `Grounding Box #${idx + 1}`}
                  </span>
                </Popup>
              </Rectangle>
            );
          })}
      </MapContainer>
    </div>
  );
}
