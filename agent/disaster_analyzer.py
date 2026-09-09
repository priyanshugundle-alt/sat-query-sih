"""
SatQuery AI — Rapid Disaster & Crisis Response Engine (Flood Inundation Mapping)
Phase 12 Capstone Module for SIH Problem Statement 26167 (ISRO / Space Applications Centre)

Provides automated microwave radar water segmentation, bi-temporal flood delta mapping,
exposure & agricultural vulnerability estimation, and Disaster Severity Index calculation
over Sentinel-1 C-SAR Dual-Polarization rasters.
"""

import io
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Union
import numpy as np
from PIL import Image


def _ensure_db(data: np.ndarray) -> np.ndarray:
    """Ensures raster values are calibrated in decibels (typically -45 dB to +5 dB)."""
    if data.dtype != np.float32 and data.dtype != np.float64:
        data = data.astype(np.float32)
    # If linear power (all positive, max > 10.0), convert to dB
    if np.nanmin(data) >= 0.0 and np.nanmax(data) > 8.0:
        data = 10.0 * np.log10(np.maximum(data, 1e-5))
    return np.clip(np.nan_to_num(data, nan=-25.0), -50.0, 10.0)


class FloodInundationAnalyzer:
    """
    Automated flood mapping and disaster vulnerability analyzer for SAR imagery.
    Applies physical specular scattering thresholding and bi-temporal flood delta.
    """

    # Agricultural and urban CORINE land-cover classes
    AGRI_CLASSES = {
        "Non-irrigated arable land", "Permanently irrigated land", "Rice fields",
        "Vineyards", "Fruit trees and berry plantations", "Olive groves",
        "Pastures", "Annual crops associated with permanent crops",
        "Complex cultivation patterns", "Land principally occupied by agriculture",
        "Agro-forestry areas"
    }
    URBAN_CLASSES = {
        "Continuous urban fabric", "Discontinuous urban fabric",
        "Industrial or commercial units", "Road and rail networks",
        "Port areas", "Airports"
    }

    def __init__(self, default_vv_threshold_db: float = -18.0, default_vh_threshold_db: float = -23.0):
        self.default_vv_threshold = default_vv_threshold_db
        self.default_vh_threshold = default_vh_threshold_db

    def load_raster(self, path: Union[str, Path]) -> np.ndarray:
        """Loads single-band GeoTIFF as float32 array in decibels."""
        with Image.open(path) as img:
            arr = np.array(img, dtype=np.float32)
        return _ensure_db(arr)

    def segment_water(
        self,
        vh_arr: np.ndarray,
        vv_arr: np.ndarray,
        vv_threshold_db: Optional[float] = None,
        vh_threshold_db: Optional[float] = None
    ) -> np.ndarray:
        """
        Segments water pixels via specular radar backscatter thresholding.
        Water causes specular reflection, scattering pulses away from antenna,
        resulting in low backscatter in both VV and VH polarizations.
        Returns a binary boolean mask where True = Water.
        """
        th_vv = vv_threshold_db if vv_threshold_db is not None else self.default_vv_threshold
        th_vh = vh_threshold_db if vh_threshold_db is not None else self.default_vh_threshold

        # Water condition: low VV backscatter or combination of low VV and low VH
        water_vv = vv_arr < th_vv
        water_vh = vh_arr < th_vh

        # Primary water mask with cross-pol confirmation to prevent shadow false alarms
        water_mask = water_vv & (water_vh | (vv_arr < (th_vv - 2.0)))
        return water_mask

    def analyze_flood(
        self,
        vh_path: Union[str, Path],
        vv_path: Union[str, Path],
        pre_vh_path: Optional[Union[str, Path]] = None,
        pre_vv_path: Optional[Union[str, Path]] = None,
        vv_threshold_db: Optional[float] = None,
        labels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Performs comprehensive flood inundation analysis.
        If pre-event (T1) rasters are provided, computes bi-temporal flood delta.
        """
        post_vh = self.load_raster(vh_path)
        post_vv = self.load_raster(vv_path)
        h, w = post_vh.shape
        total_pixels = h * w
        pixel_area_m2 = 100.0  # 10m x 10m Ground Sampling Distance
        tile_area_m2 = total_pixels * pixel_area_m2
        tile_area_ha = tile_area_m2 / 10000.0
        tile_area_km2 = tile_area_m2 / 1000000.0

        th_vv = vv_threshold_db if vv_threshold_db is not None else self.default_vv_threshold
        current_water_mask = self.segment_water(post_vh, post_vv, vv_threshold_db=th_vv)

        is_bitemporal = (pre_vh_path is not None and pre_vv_path is not None and
                         Path(pre_vh_path).exists() and Path(pre_vv_path).exists())

        if is_bitemporal:
            pre_vh = self.load_raster(pre_vh_path)
            pre_vv = self.load_raster(pre_vv_path)
            baseline_water_mask = self.segment_water(pre_vh, pre_vv, vv_threshold_db=th_vv)

            permanent_mask = baseline_water_mask & current_water_mask
            new_flood_mask = (~baseline_water_mask) & current_water_mask
            receded_mask = baseline_water_mask & (~current_water_mask)
        else:
            # Single crisis raster heuristic: deeply attenuated pixels (< -24 dB) are permanent core water
            deep_water = (post_vv < (th_vv - 5.0)) & (post_vh < (self.default_vh_threshold - 3.0))
            permanent_mask = deep_water
            new_flood_mask = current_water_mask & (~deep_water)
            receded_mask = np.zeros_like(current_water_mask, dtype=bool)

        current_water_count = int(np.sum(current_water_mask))
        permanent_water_count = int(np.sum(permanent_mask))
        new_flood_count = int(np.sum(new_flood_mask))
        receded_count = int(np.sum(receded_mask))

        water_pct = (current_water_count / total_pixels) * 100.0
        flood_pct = (new_flood_count / total_pixels) * 100.0

        # Physical areas
        inundated_area_m2 = new_flood_count * pixel_area_m2
        inundated_area_ha = inundated_area_m2 / 10000.0
        inundated_area_km2 = inundated_area_m2 / 1000000.0

        total_water_area_ha = (current_water_count * pixel_area_m2) / 10000.0
        permanent_water_ha = (permanent_water_count * pixel_area_m2) / 10000.0

        # Exposure breakdown based on detected classes
        has_agri = False
        has_urban = False
        agri_submerged_ha = 0.0
        urban_submerged_ha = 0.0

        if labels:
            for lbl in labels:
                if lbl in self.AGRI_CLASSES:
                    has_agri = True
                if lbl in self.URBAN_CLASSES:
                    has_urban = True

        if has_agri and has_urban:
            agri_submerged_ha = round(inundated_area_ha * 0.65, 2)
            urban_submerged_ha = round(inundated_area_ha * 0.35, 2)
        elif has_agri:
            agri_submerged_ha = round(inundated_area_ha * 0.85, 2)
            urban_submerged_ha = 0.0
        elif has_urban:
            agri_submerged_ha = 0.0
            urban_submerged_ha = round(inundated_area_ha * 0.80, 2)
        else:
            agri_submerged_ha = round(inundated_area_ha * 0.40, 2)
            urban_submerged_ha = round(inundated_area_ha * 0.10, 2)

        # Disaster Severity Index (0 - 100)
        # Factor in newly flooded percentage and presence of urban/agri assets
        base_severity = min(flood_pct * 3.5, 75.0)
        if has_urban and new_flood_count > 0:
            base_severity += 20.0
        elif has_agri and new_flood_count > 0:
            base_severity += 12.0

        severity_score = min(round(base_severity, 1), 100.0)

        if severity_score >= 70.0:
            severity_regime = "Catastrophic Flood Emergency"
            severity_badge = "CRITICAL"
        elif severity_score >= 40.0:
            severity_regime = "High Flood Inundation"
            severity_badge = "HIGH"
        elif severity_score >= 15.0:
            severity_regime = "Moderate Water Spillage"
            severity_badge = "MODERATE"
        else:
            severity_regime = "Low / Baseline Conditions"
            severity_badge = "LOW"

        # Mean backscatter inside flooded vs dry regions
        dry_mask = ~current_water_mask
        mean_vv_water = float(np.mean(post_vv[current_water_mask])) if current_water_count > 0 else 0.0
        mean_vh_water = float(np.mean(post_vh[current_water_mask])) if current_water_count > 0 else 0.0
        mean_vv_dry = float(np.mean(post_vv[dry_mask])) if np.sum(dry_mask) > 0 else 0.0
        mean_vh_dry = float(np.mean(post_vh[dry_mask])) if np.sum(dry_mask) > 0 else 0.0

        return {
            "mode": "bi-temporal" if is_bitemporal else "single-acquisition",
            "thresholds_used_db": {
                "vv_water_threshold": th_vv,
                "vh_water_threshold": self.default_vh_threshold
            },
            "spatial_metrics": {
                "raster_dimensions": [w, h],
                "total_pixels": total_pixels,
                "tile_area_hectares": round(tile_area_ha, 2),
                "tile_area_km2": round(tile_area_km2, 3),
                "resolution_gsd": "10.0m"
            },
            "water_extent": {
                "total_water_pixels": current_water_count,
                "total_water_hectares": round(total_water_area_ha, 2),
                "water_coverage_percent": round(water_pct, 2),
                "permanent_water_hectares": round(permanent_water_ha, 2),
                "newly_inundated_hectares": round(inundated_area_ha, 2),
                "newly_inundated_km2": round(inundated_area_km2, 4),
                "newly_inundated_percent": round(flood_pct, 2),
                "receded_water_hectares": round((receded_count * pixel_area_m2) / 10000.0, 2)
            },
            "exposure_and_vulnerability": {
                "agricultural_inundated_hectares": agri_submerged_ha,
                "urban_inundated_hectares": urban_submerged_ha,
                "infrastructure_threat_level": "High" if urban_submerged_ha > 5.0 else ("Moderate" if urban_submerged_ha > 0.0 else "Low"),
                "crop_damage_risk": "Critical" if agri_submerged_ha > 20.0 else ("Significant" if agri_submerged_ha > 5.0 else "Minimal")
            },
            "disaster_severity": {
                "score_out_of_100": severity_score,
                "regime": severity_regime,
                "badge": severity_badge,
                "recommendation": (
                    "Deploy emergency relief and activate NDRF/SDRF crisis protocol."
                    if severity_score >= 50.0 else
                    "Maintain standard hydrologic observation and monitor satellite pass."
                )
            },
            "radiometric_profiles_db": {
                "inundated_water": {"mean_vv_db": round(mean_vv_water, 2), "mean_vh_db": round(mean_vh_water, 2)},
                "dry_surfaces": {"mean_vv_db": round(mean_vv_dry, 2), "mean_vh_db": round(mean_vh_dry, 2)},
                "contrast_delta_db": round(mean_vv_dry - mean_vv_water, 2)
            }
        }

    def generate_flood_mask_bytes(
        self,
        vh_path: Union[str, Path],
        vv_path: Union[str, Path],
        pre_vh_path: Optional[Union[str, Path]] = None,
        pre_vv_path: Optional[Union[str, Path]] = None,
        vv_threshold_db: Optional[float] = None
    ) -> bytes:
        """
        Generates an RGBA PNG overlay where:
        - Dry land: transparent (0, 0, 0, 0)
        - Permanent water: deep royal blue (20, 80, 210, 190)
        - Newly inundated floodwaters: neon cyan (0, 245, 255, 220)
        """
        post_vh = self.load_raster(vh_path)
        post_vv = self.load_raster(vv_path)
        h, w = post_vh.shape

        th_vv = vv_threshold_db if vv_threshold_db is not None else self.default_vv_threshold
        current_water = self.segment_water(post_vh, post_vv, vv_threshold_db=th_vv)

        is_bitemporal = (pre_vh_path is not None and pre_vv_path is not None and
                         Path(pre_vh_path).exists() and Path(pre_vv_path).exists())

        if is_bitemporal:
            pre_vh = self.load_raster(pre_vh_path)
            pre_vv = self.load_raster(pre_vv_path)
            baseline_water = self.segment_water(pre_vh, pre_vv, vv_threshold_db=th_vv)
            permanent_water = baseline_water & current_water
            new_flood = (~baseline_water) & current_water
        else:
            deep_water = (post_vv < (th_vv - 5.0)) & (post_vh < (self.default_vh_threshold - 3.0))
            permanent_water = deep_water
            new_flood = current_water & (~deep_water)

        rgba = np.zeros((h, w, 4), dtype=np.uint8)

        # Permanent water -> Deep Blue
        rgba[permanent_water] = [20, 80, 210, 190]

        # Newly flooded -> High-contrast Neon Cyan
        rgba[new_flood] = [0, 245, 255, 220]

        img = Image.fromarray(rgba, mode="RGBA")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()


# Global Singleton instance
DISASTER_ANALYZER = FloodInundationAnalyzer()
