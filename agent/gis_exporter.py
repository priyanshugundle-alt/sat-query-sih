"""
SatQuery AI — ISRO Bhuvan & QGIS Geospatial Vector Exporter
Phase 11 Capstone Module for SIH Problem Statement 26167 (ISRO / SAC)

Converts BigEarthNet-S1 SAR dual-polarization rasters, predictions,
sub-patch ROI bounding boxes, and bi-temporal change detections into
RFC 7946 compliant GeoJSON vector features directly compatible with:
- ISRO Bhuvan Geoportal (Indian Space Research Organisation)
- QGIS / ArcGIS Desktop & Server
- Leaflet / Mapbox Web GIS
"""

import json
import math
import re
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
from PIL import Image


def utm_to_wgs84(easting: float, northing: float, zone_number: int, northern: bool = True) -> Tuple[float, float]:
    """
    Closed-form ellipsoidal conversion from UTM coordinate (E, N)
    to WGS-84 Geodetic Coordinates (Latitude, Longitude) in decimal degrees.
    Zero-dependency, sub-meter mathematical precision (Snyder formula).
    """
    a = 6378137.0  # WGS-84 semi-major axis (meters)
    f = 1.0 / 298.257223563  # WGS-84 flattening
    e2 = 2 * f - f * f
    e_prime2 = e2 / (1.0 - e2)
    k0 = 0.9996

    x = easting - 500000.0
    y = northing if northern else northing - 10000000.0

    M = y / k0
    mu = M / (a * (1.0 - e2 / 4.0 - 3.0 * e2 * e2 / 64.0 - 5.0 * e2 * e2 * e2 / 256.0))
    e1 = (1.0 - math.sqrt(1.0 - e2)) / (1.0 + math.sqrt(1.0 - e2))

    J1 = 3.0 * e1 / 2.0 - 27.0 * e1**3 / 32.0
    J2 = 21.0 * e1**2 / 16.0 - 55.0 * e1**4 / 32.0
    J3 = 151.0 * e1**3 / 96.0
    J4 = 1097.0 * e1**4 / 512.0

    fp = mu + J1 * math.sin(2.0 * mu) + J2 * math.sin(4.0 * mu) + J3 * math.sin(6.0 * mu) + J4 * math.sin(8.0 * mu)

    sin_fp = math.sin(fp)
    cos_fp = math.cos(fp)
    tan_fp = math.tan(fp)

    C1 = e_prime2 * cos_fp * cos_fp
    T1 = tan_fp * tan_fp
    R1 = a * (1.0 - e2) / math.pow(1.0 - e2 * sin_fp * sin_fp, 1.5)
    N1 = a / math.sqrt(1.0 - e2 * sin_fp * sin_fp)

    D = x / (N1 * k0)

    lat = fp - (N1 * tan_fp / R1) * (
        D * D / 2.0
        - (5.0 + 3.0 * T1 + 10.0 * C1 - 4.0 * C1 * C1 - 9.0 * e_prime2) * math.pow(D, 4) / 24.0
        + (61.0 + 90.0 * T1 + 298.0 * C1 + 45.0 * T1 * T1 - 252.0 * e_prime2 - 3.0 * C1 * C1) * math.pow(D, 6) / 720.0
    )
    lon = (
        D
        - (1.0 + 2.0 * T1 + C1) * math.pow(D, 3) / 6.0
        + (5.0 - 2.0 * C1 + 28.0 * T1 - 3.0 * C1 * C1 + 8.0 * e_prime2 + 24.0 * T1 * T1) * math.pow(D, 5) / 120.0
    ) / cos_fp

    lat_deg = math.degrees(lat)
    lon_deg = (zone_number - 1) * 6 - 180 + 3 + math.degrees(lon)

    return lat_deg, lon_deg


class GISVectorExporter:
    """
    Extracts GeoTIFF georeferencing metadata, translates raster bounding coordinates,
    and produces RFC 7946 compliant GeoJSON polygons with biophysical attributes.
    """

    def parse_georeference(self, tiff_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Parses GeoTIFF tags for ModelTiepoint, ModelPixelScale, and UTM Zone.
        Falls back to acquisition name heuristics if tags are missing.
        """
        path = Path(tiff_path)
        easting = 500000.0
        northing = 5000000.0
        scale_x = 10.0
        scale_y = 10.0
        zone = 33
        is_northern = True
        epsg = 32633

        if path.exists():
            try:
                with Image.open(path) as img:
                    tags = getattr(img, "tag_v2", {})
                    # Tag 33922: ModelTiepointTag (I, J, K, X, Y, Z)
                    if 33922 in tags and len(tags[33922]) >= 5:
                        tp = tags[33922]
                        easting = float(tp[3])
                        northing = float(tp[4])
                    # Tag 33550: ModelPixelScaleTag (scale_x, scale_y, scale_z)
                    if 33550 in tags and len(tags[33550]) >= 2:
                        ps = tags[33550]
                        scale_x = float(ps[0])
                        scale_y = float(ps[1])
                    # Tag 34737: GeoAsciiParamsTag (e.g. 'WGS 84 / UTM zone 33N|WGS 84|')
                    if 34737 in tags and isinstance(tags[34737], str):
                        match = re.search(r"zone\s+(\d+)([NSns]?)", tags[34737], re.IGNORECASE)
                        if match:
                            zone = int(match.group(1))
                            is_northern = match.group(2).upper() != "S"
                            epsg = (32600 if is_northern else 32700) + zone
            except Exception:
                pass

        # Fallback heuristic: check patch name for MGRS/UTM zone (e.g. 33UUP -> zone 33)
        if zone == 33 and path.name:
            m = re.search(r"_(\d{2})[A-Z]{3}_", path.name)
            if m:
                zone = int(m.group(1))
                epsg = 32600 + zone

        return {
            "easting": easting,
            "northing": northing,
            "scale_x": scale_x,
            "scale_y": scale_y,
            "utm_zone": zone,
            "is_northern": is_northern,
            "epsg": epsg,
            "crs_name": f"EPSG:{epsg} (WGS 84 / UTM Zone {zone}{'N' if is_northern else 'S'})"
        }

    def compute_wgs84_polygon(
        self,
        geo_info: Dict[str, Any],
        bbox: Optional[List[int]] = None,
        img_w: int = 120,
        img_h: int = 120
    ) -> Dict[str, Any]:
        """
        Computes 4 corner coordinates in WGS-84 (lon, lat) decimal degrees.
        bbox is [x1, y1, x2, y2] relative to the raster grid [0, img_w] x [0, img_h].
        """
        x1, y1, x2, y2 = bbox if bbox else [0, 0, img_w, img_h]
        e0 = geo_info["easting"]
        n0 = geo_info["northing"]
        sx = geo_info["scale_x"]
        sy = geo_info["scale_y"]
        zone = geo_info["utm_zone"]
        north = geo_info["is_northern"]

        # UTM Corners (Upper-Left, Upper-Right, Lower-Right, Lower-Left)
        # Note: Northing decreases as raster Y increases (downward)
        c_ul_e, c_ul_n = e0 + x1 * sx, n0 - y1 * sy
        c_ur_e, c_ur_n = e0 + x2 * sx, n0 - y1 * sy
        c_lr_e, c_lr_n = e0 + x2 * sx, n0 - y2 * sy
        c_ll_e, c_ll_n = e0 + x1 * sx, n0 - y2 * sy

        # Convert to WGS-84 (lat, lon)
        lat_ul, lon_ul = utm_to_wgs84(c_ul_e, c_ul_n, zone, north)
        lat_ur, lon_ur = utm_to_wgs84(c_ur_e, c_ur_n, zone, north)
        lat_lr, lon_lr = utm_to_wgs84(c_lr_e, c_lr_n, zone, north)
        lat_ll, lon_ll = utm_to_wgs84(c_ll_e, c_ll_n, zone, north)

        centroid_lat = (lat_ul + lat_lr) / 2.0
        centroid_lon = (lon_ul + lon_lr) / 2.0

        # GeoJSON Polygon format: [[ [lon, lat], [lon, lat], ... ]] (must close ring)
        polygon_coords = [
            [
                [round(lon_ul, 6), round(lat_ul, 6)],
                [round(lon_ur, 6), round(lat_ur, 6)],
                [round(lon_lr, 6), round(lat_lr, 6)],
                [round(lon_ll, 6), round(lat_ll, 6)],
                [round(lon_ul, 6), round(lat_ul, 6)],
            ]
        ]

        # Bounding box [min_lon, min_lat, max_lon, max_lat]
        min_lon = min(lon_ul, lon_ur, lon_lr, lon_ll)
        max_lon = max(lon_ul, lon_ur, lon_lr, lon_ll)
        min_lat = min(lat_ul, lat_ur, lat_lr, lat_ll)
        max_lat = max(lat_ul, lat_ur, lat_lr, lat_ll)

        width_m = abs(x2 - x1) * sx
        height_m = abs(y2 - y1) * sy
        area_m2 = width_m * height_m

        return {
            "polygon_coordinates": polygon_coords,
            "centroid": {"latitude": round(centroid_lat, 6), "longitude": round(centroid_lon, 6)},
            "bbox_wgs84": [round(min_lon, 6), round(min_lat, 6), round(max_lon, 6), round(max_lat, 6)],
            "dimensions": {
                "width_meters": round(width_m, 1),
                "height_meters": round(height_m, 1),
                "area_m2": round(area_m2, 1),
                "area_hectares": round(area_m2 / 10000.0, 3),
                "area_km2": round(area_m2 / 1000000.0, 4)
            }
        }

    def build_patch_geojson(
        self,
        patch_id: str,
        tiff_path: Union[str, Path],
        labels: Optional[List[str]] = None,
        predictions: Optional[Dict[str, Any]] = None,
        biophysics: Optional[Dict[str, Any]] = None,
        roi_bbox: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Creates a complete RFC 7946 GeoJSON FeatureCollection for a patch.
        """
        geo_info = self.parse_georeference(tiff_path)
        spatial = self.compute_wgs84_polygon(geo_info, bbox=roi_bbox)

        feature_type_name = "Sub-Patch Region of Interest (ROI)" if roi_bbox else "Sentinel-1 SAR 10m Land-Cover Tile"

        properties: Dict[str, Any] = {
            "feature_type": feature_type_name,
            "patch_id": patch_id,
            "sensor": "Sentinel-1 C-SAR (Dual-Polarization)",
            "polarizations": ["VH", "VV"],
            "resolution_gsd": "10.0 meters",
            "crs": geo_info["crs_name"],
            "epsg": geo_info["epsg"],
            "centroid": spatial["centroid"],
            "dimensions": spatial["dimensions"],
            "ground_truth_labels": labels or [],
            "sih_metadata": {
                "problem_statement": "26167",
                "organization": "ISRO / Space Applications Centre (SAC)",
                "compatibility": ["ISRO Bhuvan", "QGIS 3.x", "ArcGIS Pro", "Google Earth"]
            }
        }

        if predictions:
            properties["ai_predictions"] = predictions

        if biophysics:
            properties["radar_biophysics"] = biophysics

        geojson_obj: Dict[str, Any] = {
            "type": "FeatureCollection",
            "name": f"SatQuery_{patch_id}",
            "crs": {
                "type": "name",
                "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
            },
            "features": [
                {
                    "type": "Feature",
                    "id": f"{patch_id}{f'_roi' if roi_bbox else ''}",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": spatial["polygon_coordinates"]
                    },
                    "properties": properties
                }
            ]
        }

        return geojson_obj


# Global Singleton instance
GIS_EXPORTER = GISVectorExporter()
