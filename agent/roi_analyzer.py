"""
SatQuery AI — Geospatial ROI Sub-Patch Analytics Engine
Phase 10 Capstone Module for SIH Problem Statement 26167 (ISRO / SAC)

Computes localized, physical radar biophysics for user-selected bounding boxes
on Sentinel-1 SAR dual-polarization (VH/VV) GeoTIFF rasters.
"""

import math
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, Union, List
import numpy as np
from PIL import Image

from model_a.config import CONFIG as MODEL_A_CONFIG


class GeospatialROIAnalyzer:
    """
    Sub-patch ROI biophysics calculator for Sentinel-1 Dual-Pol SAR.
    Computes calibrated decibel statistics, cross-polarization ratio,
    surface roughness classification, and dielectric/moisture proxies.
    """

    def __init__(self, pixel_spacing_meters: float = 10.0):
        """
        Sentinel-1 IW GRD pixel spacing is 10.0 meters.
        Each pixel represents 100 m² (0.01 hectares).
        """
        self.pixel_spacing = pixel_spacing_meters
        self.pixel_area_m2 = pixel_spacing_meters * pixel_spacing_meters

    def _load_raster_band(self, path: Path) -> np.ndarray:
        """Loads a single band GeoTIFF as a float32 numpy array."""
        if not path.exists():
            raise FileNotFoundError(f"Raster file not found: {path}")
        with Image.open(path) as img:
            return np.array(img, dtype=np.float32)

    def _clamp_bbox(
        self,
        x1: int,
        y1: int,
        x2: int,
        y2: int,
        max_w: int,
        max_h: int
    ) -> Tuple[int, int, int, int]:
        """Normalizes and clamps bounding box coordinates within [0, max_w] x [0, max_h]."""
        xmin = max(0, min(int(round(min(x1, x2))), max_w - 1))
        xmax = max(1, min(int(round(max(x1, x2))), max_w))
        ymin = max(0, min(int(round(min(y1, y2))), max_h - 1))
        ymax = max(1, min(int(round(max(y1, y2))), max_h))

        # Ensure at least 1 pixel dimension
        if xmax <= xmin:
            xmax = min(xmin + 1, max_w)
            if xmax == xmin:
                xmin = max(0, xmax - 1)
        if ymax <= ymin:
            ymax = min(ymin + 1, max_h)
            if ymax == ymin:
                ymin = max(0, ymax - 1)

        return xmin, ymin, xmax, ymax

    def _ensure_db(self, arr: np.ndarray) -> np.ndarray:
        """
        Ensures array is in calibrated decibels (dB).
        BigEarthNet-S1 GeoTIFFs are already stored in calibrated dB (typically -35.0 dB to 0.0 dB).
        If raw linear power or positive 16-bit DNs (> 5.0) are supplied, converts via 10*log10.
        """
        arr_clean = np.nan_to_num(arr, nan=-35.0, posinf=5.0, neginf=-50.0)
        # Check if values are in linear intensity/amplitude (> 8.0 or high positive mean)
        if np.nanmean(arr_clean) > 8.0 or np.nanmax(arr_clean) > 20.0:
            eps = 1e-6
            return 10.0 * np.log10(np.clip(arr_clean, eps, None))
        return np.clip(arr_clean, -50.0, 5.0)

    def _classify_roughness(
        self,
        vh_mean_db: float,
        vv_mean_db: float,
        cpr_db: float
    ) -> Dict[str, Any]:
        """
        Classifies surface roughness regime using electromagnetic scattering physics:
        - Specular / Smooth (Calm water, paved surface, runways): very low backscatter
        - Moderately Rough (Bare soil, sparse crops, open grassland): diffuse surface scattering
        - Rough / Volumetric (Forest canopy, shrubs): volume depolarization
        - Double-Bounce / Urban (Built structures, corner reflectors): very strong co-pol return
        """
        if vv_mean_db < -19.0 and vh_mean_db < -25.0:
            regime = "Specular / Extremely Smooth"
            description = "Mirror-like reflection away from radar sensor (typical of calm open water, flooded surfaces, or smooth paved surfaces)."
            radar_mechanism = "Specular reflection"
            roughness_score = 0.1
        elif vv_mean_db > -7.0:
            regime = "Double-Bounce / High-Dielectric Corner Reflector"
            description = "Intense backscatter return characteristic of orthogonal structures, urban settlements, or complex metal infrastructure."
            radar_mechanism = "Double-bounce dihedral corner reflection"
            roughness_score = 0.95
        elif vh_mean_db > -14.0 or cpr_db > -6.0:
            regime = "Volumetric / Canopy Scattering (Very Rough)"
            description = "High cross-polarization ratio indicating multiple volumetric scattering interactions within tree canopies or dense vegetation."
            radar_mechanism = "Volumetric multiple scattering"
            roughness_score = 0.85
        elif vv_mean_db > -13.0 and vh_mean_db > -20.0:
            regime = "Moderately Rough / Vegetated Ground"
            description = "Moderate surface roughness with diffuse surface scattering (typical of shrubs, agricultural crops, or undulating terrain)."
            radar_mechanism = "Diffuse surface scattering (Bragg regime)"
            roughness_score = 0.55
        else:
            regime = "Slightly Rough / Low Relief Ground"
            description = "Low backscatter indicating flat agricultural fields, dry bare soil, or sparse grassland."
            radar_mechanism = "Slightly rough surface scattering"
            roughness_score = 0.35

        return {
            "regime": regime,
            "description": description,
            "mechanism": radar_mechanism,
            "roughness_index": round(float(roughness_score), 2)
        }

    def _estimate_moisture_proxy(self, vv_mean_db: float, vh_mean_db: float) -> Dict[str, Any]:
        """
        Estimates dielectric constant / soil moisture proxy index.
        In SAR, higher soil moisture increases real part of permittivity (ε'),
        elevating VV backscatter by 3 to 7 dB compared to dry soil.
        """
        # Linear mapping of VV dB between -25 dB (bone dry / specular) and -6 dB (saturated / high moisture)
        clamped_vv = np.clip(vv_mean_db, -25.0, -6.0)
        moisture_index = float((clamped_vv - (-25.0)) / 19.0)

        if moisture_index < 0.25:
            level = "Low / Arid"
            note = "Low dielectric permittivity indicating dry soil or dry vegetation."
        elif moisture_index < 0.65:
            level = "Moderate / Mesic"
            note = "Typical terrestrial moisture regime with moderate soil dielectric response."
        else:
            level = "High / Saturated"
            note = "Elevated dielectric constant; high soil moisture content, inundation, or wet foliage."

        return {
            "moisture_index": round(moisture_index, 3),
            "moisture_level": level,
            "interpretation": note
        }

    def analyze_roi(
        self,
        vh_path: Union[str, Path],
        vv_path: Union[str, Path],
        bbox: List[int],  # [x1, y1, x2, y2]
        t2_vh_path: Optional[Union[str, Path]] = None,
        t2_vv_path: Optional[Union[str, Path]] = None
    ) -> Dict[str, Any]:
        """
        Performs full biophysical analysis on specified bounding box.
        """
        vh_path = Path(vh_path)
        vv_path = Path(vv_path)

        raw_vh = self._load_raster_band(vh_path)
        raw_vv = self._load_raster_band(vv_path)

        if raw_vh.shape != raw_vv.shape:
            raise ValueError(f"VH shape {raw_vh.shape} does not match VV shape {raw_vv.shape}")

        height, width = raw_vh.shape
        x1, y1, x2, y2 = bbox
        xmin, ymin, xmax, ymax = self._clamp_bbox(x1, y1, x2, y2, width, height)

        roi_w = xmax - xmin
        roi_h = ymax - ymin
        total_pixels = roi_w * roi_h
        area_m2 = total_pixels * self.pixel_area_m2
        area_hectares = area_m2 / 10000.0

        # Sub-patch slices
        sub_vh = raw_vh[ymin:ymax, xmin:xmax]
        sub_vv = raw_vv[ymin:ymax, xmin:xmax]

        # Convert to Decibels
        sub_vh_db = self._ensure_db(sub_vh)
        sub_vv_db = self._ensure_db(sub_vv)

        # Decibel Statistics
        vh_mean = float(np.mean(sub_vh_db))
        vh_std = float(np.std(sub_vh_db))
        vh_min = float(np.min(sub_vh_db))
        vh_max = float(np.max(sub_vh_db))

        vv_mean = float(np.mean(sub_vv_db))
        vv_std = float(np.std(sub_vv_db))
        vv_min = float(np.min(sub_vv_db))
        vv_max = float(np.max(sub_vv_db))

        # Cross-polarization ratio (VH / VV in dB is VH_dB - VV_dB)
        cpr_db = float(vh_mean - vv_mean)

        # Roughness & Moisture Biophysics
        roughness = self._classify_roughness(vh_mean, vv_mean, cpr_db)
        moisture = self._estimate_moisture_proxy(vv_mean, vh_mean)

        result: Dict[str, Any] = {
            "bbox_pixels": {
                "x1": xmin,
                "y1": ymin,
                "x2": xmax,
                "y2": ymax,
                "width": roi_w,
                "height": roi_h
            },
            "spatial_metrics": {
                "pixel_count": int(total_pixels),
                "resolution_m": float(self.pixel_spacing),
                "area_m2": round(float(area_m2), 1),
                "area_hectares": round(float(area_hectares), 4)
            },
            "polarization_vh_db": {
                "mean": round(vh_mean, 2),
                "std": round(vh_std, 2),
                "min": round(vh_min, 2),
                "max": round(vh_max, 2)
            },
            "polarization_vv_db": {
                "mean": round(vv_mean, 2),
                "std": round(vv_std, 2),
                "min": round(vv_min, 2),
                "max": round(vv_max, 2)
            },
            "cross_polarization_ratio_db": round(cpr_db, 2),
            "surface_roughness": roughness,
            "dielectric_moisture_proxy": moisture,
            "temporal_change": None
        }

        # Optional Temporal Change for ROI
        if t2_vh_path and t2_vv_path:
            t2_vh_p = Path(t2_vh_path)
            t2_vv_p = Path(t2_vv_path)
            if t2_vh_p.exists() and t2_vv_p.exists():
                t2_raw_vh = self._load_raster_band(t2_vh_p)
                t2_raw_vv = self._load_raster_band(t2_vv_p)
                t2_sub_vh_db = self._ensure_db(t2_raw_vh[ymin:ymax, xmin:xmax])
                t2_sub_vv_db = self._ensure_db(t2_raw_vv[ymin:ymax, xmin:xmax])

                delta_vh = float(np.mean(t2_sub_vh_db) - vh_mean)
                delta_vv = float(np.mean(t2_sub_vv_db) - vv_mean)

                result["temporal_change"] = {
                    "delta_vh_db": round(delta_vh, 2),
                    "delta_vv_db": round(delta_vv, 2),
                    "significant_change": abs(delta_vh) > 2.0 or abs(delta_vv) > 2.0,
                    "change_direction": "Increase in backscatter" if (delta_vh + delta_vv) > 0 else "Decrease in backscatter"
                }

        return result


# Singleton instance
ROI_ANALYZER = GeospatialROIAnalyzer()
