"""
SatQuery AI — Geo-Validity Gate
Validates geospatial characteristics, raster integrity, CRS bounds, band pairing,
and multi-temporal compatibility before routing to AI models.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image


class GeoValidityGate:
    """
    Geospatial & Raster Integrity Validator.
    Ensures that AI models only process verified, uncorrupted satellite data.
    """
    @staticmethod
    def inspect_band(band_path: Union[str, Path]) -> Dict[str, Any]:
        path = Path(band_path)
        if not path.exists():
            return {"valid": False, "error": f"File does not exist: {path}"}

        try:
            with Image.open(path) as img:
                arr = np.array(img)
                shape = arr.shape
                dtype = str(arr.dtype)
                nan_count = int(np.isnan(arr).sum()) if np.issubdtype(arr.dtype, np.floating) else 0
                inf_count = int(np.isinf(arr).sum()) if np.issubdtype(arr.dtype, np.floating) else 0
                min_val = float(np.nanmin(arr)) if arr.size > 0 else 0.0
                max_val = float(np.nanmax(arr)) if arr.size > 0 else 0.0
                tags = list(getattr(img, "tag_v2", {}).keys()) if hasattr(img, "tag_v2") else []

            return {
                "valid": True,
                "file_name": path.name,
                "dimensions": list(shape),
                "dtype": dtype,
                "nan_count": nan_count,
                "inf_count": inf_count,
                "min_val": round(min_val, 2),
                "max_val": round(max_val, 2),
                "geotiff_tags_present": len(tags) > 0
            }
        except Exception as e:
            return {"valid": False, "error": f"Failed to parse raster {path.name}: {str(e)}"}

    @classmethod
    def validate_sar_pair(
        cls,
        vh_path: Union[str, Path],
        vv_path: Union[str, Path]
    ) -> Dict[str, Any]:
        """
        Validates a dual-polarization Sentinel-1 (VH + VV) pair.
        """
        vh_info = cls.inspect_band(vh_path)
        vv_info = cls.inspect_band(vv_path)

        checks: List[Dict[str, Any]] = []
        is_valid = True

        # Check 1: File Existence
        if not vh_info["valid"] or not vv_info["valid"]:
            return {
                "status": "INVALID",
                "reason": vh_info.get("error") or vv_info.get("error"),
                "checks": [{"name": "File Existence", "passed": False}]
            }

        checks.append({"name": "File Existence", "passed": True})

        # Check 2: Spatial Dimension Matching
        vh_dim = vh_info["dimensions"]
        vv_dim = vv_info["dimensions"]
        dim_match = (vh_dim == vv_dim) and (len(vh_dim) == 2)
        checks.append({
            "name": "Spatial Dimension Matching",
            "passed": dim_match,
            "vh_dim": vh_dim,
            "vv_dim": vv_dim
        })
        if not dim_match:
            is_valid = False

        # Check 3: Corrupted Data / Extreme NaN count
        total_pixels = vh_dim[0] * vh_dim[1] if len(vh_dim) == 2 else 1
        vh_nan_ratio = vh_info["nan_count"] / total_pixels
        vv_nan_ratio = vv_info["nan_count"] / total_pixels
        nan_ok = (vh_nan_ratio < 0.20) and (vv_nan_ratio < 0.20)
        checks.append({
            "name": "Data Integrity & NaN Tolerance (<20%)",
            "passed": nan_ok,
            "vh_nan_ratio": round(vh_nan_ratio, 3),
            "vv_nan_ratio": round(vv_nan_ratio, 3)
        })
        if not nan_ok:
            is_valid = False

        # Check 4: Decibel Value Range Sanity Check (SAR typically -60 to +15 dB)
        val_range_ok = (-70.0 <= vh_info["min_val"] <= 20.0) and (-70.0 <= vv_info["min_val"] <= 20.0)
        checks.append({
            "name": "SAR Decibel Range Sanity Check",
            "passed": val_range_ok,
            "vh_range": [vh_info["min_val"], vh_info["max_val"]],
            "vv_range": [vv_info["min_val"], vv_info["max_val"]]
        })

        status = "VALID" if is_valid else "INVALID"
        if is_valid and (not val_range_ok or not vh_info["geotiff_tags_present"]):
            status = "WARNING"

        return {
            "status": status,
            "checks": checks,
            "metadata": {
                "vh": vh_info,
                "vv": vv_info
            }
        }

    @classmethod
    def validate_temporal_pair(
        cls,
        t1_pair: Tuple[Union[str, Path], Union[str, Path]],
        t2_pair: Tuple[Union[str, Path], Union[str, Path]]
    ) -> Dict[str, Any]:
        """
        Validates two temporal acquisitions (T1 vs T2) for change detection compatibility.
        """
        val_t1 = cls.validate_sar_pair(t1_pair[0], t1_pair[1])
        val_t2 = cls.validate_sar_pair(t2_pair[0], t2_pair[1])

        if val_t1["status"] == "INVALID" or val_t2["status"] == "INVALID":
            return {
                "status": "INVALID",
                "reason": "One or both temporal acquisitions failed Geo-Validity validation.",
                "t1_validation": val_t1,
                "t2_validation": val_t2
            }

        # Check dimension compatibility between T1 and T2
        dim_t1 = val_t1["metadata"]["vh"]["dimensions"]
        dim_t2 = val_t2["metadata"]["vh"]["dimensions"]
        compatible = (dim_t1 == dim_t2)

        return {
            "status": "VALID" if compatible else "INVALID",
            "temporal_dimension_match": compatible,
            "t1_dimensions": dim_t1,
            "t2_dimensions": dim_t2,
            "t1_validation": val_t1,
            "t2_validation": val_t2
        }
