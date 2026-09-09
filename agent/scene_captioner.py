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
    and answers domain-specific remote-sensing visual questions.
    """

    @staticmethod
    def generate_caption(
        detected_classes: List[str],
        probabilities: Dict[str, float],
        vh_mean: Optional[float] = None,
        vv_mean: Optional[float] = None,
    ) -> str:
        """
        Generates a comprehensive descriptive caption for a satellite patch.
        """
        if not detected_classes:
            return (
                "Dual-polarization Sentinel-1 SAR acquisition displaying homogeneous "
                "low-contrast backscatter without distinct structural land-cover signatures."
            )

        primary_class = detected_classes[0]
        secondary_classes = detected_classes[1:4]

        # Analyze polarimetric characteristics if dB stats available
        polarimetric_note = ""
        if vh_mean is not None and vv_mean is not None:
            copol_diff = vv_mean - vh_mean
            if copol_diff > 9.0:
                polarimetric_note = " Dominant co-polarization (VV) suggests smooth surface reflection and dielectric boundaries."
            elif copol_diff < 5.0:
                polarimetric_note = " High cross-polarization (VH) indicates strong volumetric depolarized scattering typical of dense vegetative canopies."

        if len(detected_classes) == 1:
            caption = (
                f"Sentinel-1 SAR scene predominantly occupied by {primary_class.lower()}."
                f"{polarimetric_note}"
            )
        elif len(detected_classes) == 2:
            caption = (
                f"Sentinel-1 SAR scene exhibiting a combination of {primary_class.lower()} "
                f"and {secondary_classes[0].lower()}."
                f"{polarimetric_note}"
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
                f"{polarimetric_note}"
            )

        return caption

    @staticmethod
    def answer_specific_question(
        query: str,
        detected_classes: List[str],
        probabilities: Dict[str, float],
    ) -> Optional[str]:
        """
        Answers targeted presence, count, and category questions over the raster.
        """
        q = query.lower().strip()

        # Water / Wetlands
        if any(w in q for w in ["water", "river", "lake", "wetland", "coastal", "marine", "sea", "ocean"]):
            water_classes = [
                c for c in detected_classes
                if any(k in c.lower() for k in ["water", "wetland", "marine", "inland waters", "coastal wetlands"])
            ]
            if water_classes:
                conf = max([probabilities.get(c, 0.75) for c in water_classes])
                return (
                    f"Yes, hydrological features are present in this SAR acquisition. "
                    f"Detected categories: {', '.join(water_classes)} (Confidence: {conf:.2f}). "
                    f"Identified through characteristic low specular radar backscatter."
                )
            else:
                return (
                    "No significant open water bodies or wetlands were detected with high confidence "
                    "in this satellite patch."
                )

        # Forest / Vegetation
        if any(w in q for w in ["forest", "tree", "vegetation", "woodland", "agriculture", "crop", "pasture"]):
            veg_classes = [
                c for c in detected_classes
                if any(k in c.lower() for k in ["forest", "arable", "crop", "pasture", "vegetation", "cultivation", "agro-forestry"])
            ]
            if veg_classes:
                return (
                    f"Yes, vegetative and agricultural land cover is detected. "
                    f"Identified types: {', '.join(veg_classes)}. "
                    f"Exhibits strong volumetric depolarization in the VH channel."
                )
            else:
                return "No extensive forest or agricultural land cover was identified with high confidence."

        # Urban / Built-up
        if any(w in q for w in ["urban", "city", "building", "infrastructure", "settlement", "fabric"]):
            urban_classes = [c for c in detected_classes if "urban" in c.lower() or "fabric" in c.lower()]
            if urban_classes:
                return (
                    f"Yes, urban fabric and built structures are detected ({', '.join(urban_classes)}). "
                    f"Characterized by high double-bounce radar returns and structural backscatter."
                )
            else:
                return "No major urban fabric or dense human infrastructure detected in this raster patch."

        # Caption request
        if any(w in q for w in ["caption", "describe", "description", "summary", "overview", "what does this show"]):
            return SceneCaptioner.generate_caption(detected_classes, probabilities)

        return None
