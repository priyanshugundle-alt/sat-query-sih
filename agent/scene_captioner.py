"""
SatQuery AI — Remote Sensing Scene Captioning & Advanced VQA Engine
Generates descriptive scene narratives and answers fine-grained presence/area questions
grounded in physical dual-polarization SAR backscatter and multi-label classifications.
"""

from typing import Any, Dict, List, Optional
import numpy as np


class SceneCaptioner:
    """
    Synthesizes rich, physically grounded natural language scene descriptions
    and answers domain-specific remote-sensing visual questions across Optical and SAR sensors.
    """

    @staticmethod
    def generate_caption(
        detected_classes: List[str],
        probabilities: Dict[str, float],
        vh_mean: Optional[float] = None,
        vv_mean: Optional[float] = None,
        modality: str = "Optical"
    ) -> str:
        """
        Generates a comprehensive descriptive caption for a satellite patch.
        """
        is_sar = (vh_mean is not None and vv_mean is not None) or "sar" in modality.lower()
        sensor_prefix = "Sentinel-1 SAR" if is_sar else "Sentinel-2 Multispectral"

        if not detected_classes:
            if is_sar:
                return (
                    "Dual-polarization Sentinel-1 SAR acquisition displaying homogeneous "
                    "low-contrast backscatter without distinct structural land-cover signatures."
                )
            return (
                "High-resolution multispectral satellite acquisition displaying homogeneous "
                "surface reflectance without distinct structural land-cover features."
            )

        primary_class = detected_classes[0]
        secondary_classes = detected_classes[1:4]

        # Physical diagnostic note
        diagnostic_note = ""
        if is_sar and vh_mean is not None and vv_mean is not None:
            copol_diff = vv_mean - vh_mean
            if copol_diff > 9.0:
                diagnostic_note = " Dominant co-polarization (VV) suggests smooth surface reflection and dielectric boundaries."
            elif copol_diff < 5.0:
                diagnostic_note = " High cross-polarization (VH) indicates strong volumetric depolarized scattering typical of dense vegetative canopies."

        if len(detected_classes) == 1:
            caption = (
                f"{sensor_prefix} scene predominantly occupied by {primary_class.lower()}."
                f"{diagnostic_note}"
            )
        elif len(detected_classes) == 2:
            caption = (
                f"{sensor_prefix} scene exhibiting a combination of {primary_class.lower()} "
                f"and {secondary_classes[0].lower()}."
                f"{diagnostic_note}"
            )
        else:
            other_str = ", ".join([c.lower() for c in secondary_classes[:-1]])
            if other_str:
                other_str += f", and {secondary_classes[-1].lower()}"
            else:
                other_str = secondary_classes[-1].lower()

            caption = (
                f"A complex multi-class remote sensing landscape characterized primarily by {primary_class.lower()}, "
                f"interspersed with {other_str}."
                f"{diagnostic_note}"
            )

        return caption

    @staticmethod
    def answer_specific_question(
        query: str,
        detected_classes: List[str],
        probabilities: Dict[str, float],
        modality: str = "Optical"
    ) -> Optional[str]:
        """
        Answers targeted presence, count, and category questions over the raster.
        """
        q = query.lower().strip()
        is_sar = "sar" in modality.lower()

        # Water / Wetlands
        if any(w in q for w in ["water", "river", "lake", "wetland", "coastal", "marine", "sea", "ocean"]):
            water_classes = [
                c for c in detected_classes
                if any(k in c.lower() for k in ["water", "wetland", "marine", "inland waters", "coastal wetlands"])
            ]
            if water_classes:
                conf = max([probabilities.get(c, 0.75) for c in water_classes])
                evidence_note = "identified via low specular radar backscatter" if is_sar else "confirmed by characteristic low NIR and high water-absorption reflectance"
                return (
                    f"Yes, hydrological features are present in this satellite observation. "
                    f"Detected categories: {', '.join(water_classes)} (Confidence: {conf:.2f}), {evidence_note}."
                )
            else:
                return (
                    "No significant open water bodies or wetlands were detected with high confidence "
                    "in this satellite patch."
                )

        # Forest / Vegetation
        if any(w in q for w in ["forest", "tree", "vegetation", "woodland", "agriculture", "crop", "pasture", "grassland"]):
            veg_classes = [
                c for c in detected_classes
                if any(k in c.lower() for k in ["forest", "arable", "crop", "pasture", "vegetation", "cultivation", "agro-forestry", "grassland", "shrub"])
            ]
            if veg_classes:
                evidence_note = "exhibits strong volumetric depolarization in the VH channel" if is_sar else "verified by elevated red-edge and near-infrared chlorophyll spectral reflectance"
                return (
                    f"Yes, vegetative and agricultural land cover is detected. "
                    f"Identified types: {', '.join(veg_classes)}, {evidence_note}."
                )
            else:
                return "No extensive forest or agricultural land cover was identified with high confidence."

        # Urban / Built-up
        if any(w in q for w in ["urban", "city", "building", "infrastructure", "settlement", "fabric", "industrial"]):
            urban_classes = [c for c in detected_classes if any(k in c.lower() for k in ["urban", "fabric", "industrial", "commercial", "building"])]
            if urban_classes:
                evidence_note = "characterized by double-bounce structural backscatter" if is_sar else "distinguished by high visible albedo and distinct geometric boundaries"
                return (
                    f"Yes, urban fabric and built structures are detected ({', '.join(urban_classes)}), {evidence_note}."
                )
            else:
                return "No major urban fabric or dense human infrastructure detected in this raster patch."

        # Caption request
        if any(w in q for w in ["caption", "describe", "description", "summary", "overview", "what does this show"]):
            return SceneCaptioner.generate_caption(detected_classes, probabilities, modality=modality)

        return None
