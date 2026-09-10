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
    and answers domain-specific remote-sensing visual questions using Qwen-VL.
    """

    @staticmethod
    def generate_caption(
        image_bytes: Optional[bytes] = None,
        detected_classes: Optional[List[str]] = None,
        probabilities: Optional[Dict[str, float]] = None,
    ) -> str:
        """
        Generates a comprehensive descriptive caption for a satellite patch.
        Uses Qwen-VL if images are provided, otherwise falls back to ResNet heuristics.
        """
        if image_bytes and QWEN_BRAIN.is_loaded:
            prompt = "Act as an expert ISRO Earth Observation scientist. Provide a detailed geographical and structural caption for this Sentinel satellite scene."
            return QWEN_BRAIN.ask_qwen([image_bytes], prompt)

        # Fallback to heuristic
        if not detected_classes:
            return "Dual-polarization Sentinel-1 SAR acquisition displaying homogeneous backscatter without distinct structural signatures."

        primary_class = detected_classes[0]
        secondary_classes = detected_classes[1:4]

        if len(detected_classes) == 1:
            caption = f"Sentinel-1 SAR scene predominantly occupied by {primary_class.lower()}."
        elif len(detected_classes) == 2:
            caption = f"Sentinel-1 SAR scene exhibiting a combination of {primary_class.lower()} and {secondary_classes[0].lower()}."
        else:
            other_str = ", ".join([c.lower() for c in secondary_classes[:-1]])
            if other_str:
                other_str += f", and {secondary_classes[-1].lower()}"
            else:
                other_str = secondary_classes[-1].lower()
            caption = f"A complex landscape characterized primarily by {primary_class.lower()}, interspersed with {other_str}."

        return caption

    @staticmethod
    def answer_specific_question(
        query: str,
        image_bytes: Optional[bytes] = None,
        detected_classes: Optional[List[str]] = None,
        probabilities: Optional[Dict[str, float]] = None,
    ) -> Optional[str]:
        """
        Answers targeted presence, count, and category questions over the raster.
        Routes complex questions to Qwen-VL.
        """
        q = query.lower().strip()

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
                return f"Yes, hydrological features ({', '.join(water_classes)}) are present."
            return "No significant open water bodies or wetlands were detected."

        # Forest / Vegetation
        if any(w in q for w in ["forest", "tree", "vegetation", "agriculture", "crop"]):
            veg_classes = [c for c in (detected_classes or []) if any(k in c.lower() for k in ["forest", "arable", "crop", "vegetation"])]
            if veg_classes:
                return f"Yes, vegetative land cover ({', '.join(veg_classes)}) is detected."
            return "No extensive forest or agricultural land cover was identified."

        # Urban / Built-up
        if any(w in q for w in ["urban", "city", "building", "infrastructure"]):
            urban_classes = [c for c in (detected_classes or []) if "urban" in c.lower() or "fabric" in c.lower()]
            if urban_classes:
                return f"Yes, urban fabric and built structures ({', '.join(urban_classes)}) are detected."
            return "No major urban infrastructure detected."

        return None
