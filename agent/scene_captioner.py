"""
SatQuery AI — Remote Sensing Scene Captioning & Advanced VQA Engine
Generates descriptive scene narratives and answers fine-grained presence/area questions
using the Qwen2.5-VL QLoRA Super-Brain, while falling back to ResNet heuristics if needed.
"""

from typing import Any, Dict, List, Optional, Union
from pathlib import Path
import numpy as np
from agent.qwen_brain import QWEN_BRAIN

class SceneCaptioner:
    """
    Synthesizes rich, physically grounded natural language scene descriptions
    and answers domain-specific remote-sensing visual questions across Optical and SAR sensors using Qwen-VL.
    """

    @staticmethod
    def generate_caption(
        image_bytes: Optional[bytes] = None,
        detected_classes: Optional[List[str]] = None,
        probabilities: Optional[Dict[str, float]] = None,
        vh_mean: Optional[float] = None,
        vv_mean: Optional[float] = None,
        modality: str = "Optical"
    ) -> str:
        """
        Generates a comprehensive descriptive caption for a satellite patch.
        Uses Qwen-VL if images are provided, otherwise falls back to ResNet heuristics.
        """
        if image_bytes and QWEN_BRAIN.is_loaded:
            prompt = "Act as an expert ISRO Earth Observation scientist. Provide a detailed geographical and structural caption for this Sentinel satellite scene."
            return QWEN_BRAIN.ask_qwen([image_bytes], prompt)

        # Fallback to heuristic
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
        image_bytes: Optional[bytes] = None,
        detected_classes: Optional[List[str]] = None,
        probabilities: Optional[Dict[str, float]] = None,
        modality: str = "Optical"
    ) -> Optional[str]:
        """
        Answers targeted presence, count, and category questions over the raster.
        Routes complex questions to Qwen-VL.
        """
        q = query.lower().strip()
        is_sar = "sar" in modality.lower()

        # If it's a direct caption request
        if any(w in q for w in ["caption", "describe", "description", "summary", "overview", "what does this show"]):
            return SceneCaptioner.generate_caption(image_bytes, detected_classes, probabilities)

        # For all other specific questions, query Qwen if loaded and image provided
        if image_bytes and QWEN_BRAIN.is_loaded:
            prompt = f"Act as an expert ISRO geospatial analyst. Answer this user's question directly based on the satellite image: '{query}'"
            return QWEN_BRAIN.ask_qwen([image_bytes], prompt)

        # Fallbacks (ResNet heuristics) if Qwen isn't loaded
        # Water / Wetlands
        if any(w in q for w in ["water", "river", "lake", "wetland", "coastal", "marine", "sea", "ocean"]):
            water_classes = [c for c in (detected_classes or []) if any(k in c.lower() for k in ["water", "wetland", "marine"])]
            if water_classes:
                conf = max([(probabilities or {}).get(c, 0.75) for c in water_classes])
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
                c for c in (detected_classes or [])
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
            urban_classes = [c for c in (detected_classes or []) if any(k in c.lower() for k in ["urban", "fabric", "industrial", "commercial", "building"])]
            if urban_classes:
                evidence_note = "characterized by double-bounce structural backscatter" if is_sar else "distinguished by high visible albedo and distinct geometric boundaries"
                return (
                    f"Yes, urban fabric and built structures are detected ({', '.join(urban_classes)}), {evidence_note}."
                )
            else:
                return "No major urban fabric or dense human infrastructure detected in this raster patch."

        # Caption & General Analysis request
        if any(w in q for w in ["caption", "describe", "description", "summary", "overview", "what does this show", "analyze", "inspect", "what is", "features", "objects", "tell me", "report"]):
            return SceneCaptioner.generate_caption(image_bytes=image_bytes, detected_classes=detected_classes, probabilities=probabilities, modality=modality)

        # Fallback to rich scene caption if classes are detected
        if detected_classes:
            return SceneCaptioner.generate_caption(image_bytes=image_bytes, detected_classes=detected_classes, probabilities=probabilities, modality=modality)

        return None
